import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AiChatService } from '../../../core/services/ai-chat.service';
import { AiContextService } from '../../../core/services/ai-context.service';
import {
  AiChatMessage,
  AiChatResponse,
  AiConversationSession,
  AiSuggestionDto,
} from '../../../core/models/ai.model';
import { ROUTES } from '../../../core/constants/route.constants';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppCardComponent } from '../../../shared/components/app-card/app-card.component';

/**
 * Extends the base chat message with client-only state used to drive
 * the ChatGPT-style "typing" reveal animation. None of this is persisted -
 * it only controls how a message is progressively rendered on screen.
 */
interface AiWorkspaceMessage extends AiChatMessage {
  /** Text currently shown to the user while streaming is in progress. */
  displayContent?: string;
  /** True while the assistant bubble is still being "typed" out. */
  isStreaming?: boolean;
  /**
   * True when this message originated from (user) or was generated in
   * response to (assistant) a voice interaction. Purely a UI hint used to
   * show the mic/speaker badge and to decide whether to auto-read the
   * assistant's reply aloud - it does not change what gets sent/persisted.
   */
  isVoice?: boolean;
}

const TYPE_SPEED_MS = 18;

// Minimal local typings for the (still non-standard, vendor-prefixed on some
// browsers) Web Speech API so we don't need to pull in extra @types.
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
  length: number;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

@Component({
  selector: 'app-ai-workspace',
  standalone: true,
  imports: [FormsModule, RouterLink, AppBreadcrumbComponent, AppCardComponent],
  templateUrl: './ai-workspace.component.html',
  styleUrl: './ai-workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiWorkspaceComponent implements OnInit, OnDestroy {
  private readonly aiChat = inject(AiChatService);
  private readonly aiContext = inject(AiContextService);

  private readonly messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesEl');
  private readonly composerEl = viewChild<ElementRef<HTMLTextAreaElement>>('composerEl');

  readonly routes = ROUTES;
  readonly messages = signal<AiWorkspaceMessage[]>([]);
  readonly sessions = signal<AiConversationSession[]>([]);
  readonly activeSessionId = signal<string | null>(null);
  readonly suggestions = signal<AiSuggestionDto[]>([
    { label: 'Revenue this month', message: 'What is our revenue this month?' },
    { label: 'Products sold', message: 'How many products sold this month?' },
    { label: 'Overdue invoices', message: 'Show overdue invoices' },
    { label: 'Top customers', message: 'Who are the top customers by revenue?' },
    { label: 'Focus today', message: 'What should I focus on today?' },
  ]);
  private readonly defaultSuggestions = this.suggestions();
  readonly input = signal('');

  /** True while we are waiting on the network call (shows the "thinking" indicator). */
  readonly loading = signal(false);
  /** True while an assistant reply is being revealed character-by-character. */
  readonly streaming = signal(false);
  readonly sidebarOpen = signal(false);
  readonly sessionsLoading = signal(false);

  // --- Voice input/output state ------------------------------------------

  /** True if this browser exposes SpeechRecognition (mic → text). */
  readonly voiceInputSupported = signal(false);
  /** True if this browser exposes speechSynthesis (text → spoken audio). */
  readonly voiceOutputSupported = signal(false);
  /** True while the mic is actively capturing speech. */
  readonly isListening = signal(false);
  /** Last mic/voice error, shown near the composer until dismissed/retried. */
  readonly voiceError = signal<string | null>(null);
  /** When on, assistant replies to voice messages are read aloud automatically. */
  readonly autoSpeak = signal(false);
  /** Which message (by index) is currently being read aloud, for the UI. */
  readonly speakingIndex = signal<number | null>(null);

  readonly breadcrumbs = [
    { label: 'AI Copilot', route: ROUTES.ai.workspace },
    { label: 'Workspace' },
  ];

  /** Handle for the current typewriter animation so it can be cancelled/cleaned up. */
  private streamTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private recognition: SpeechRecognitionLike | null = null;
  /** Accumulates the finalized transcript for the in-progress voice capture. */
  private pendingVoiceTranscript = '';
  /** Whether the most recently *sent* user message came in via voice. */
  private lastInputWasVoice = false;

  ngOnInit(): void {
    this.refreshSessions();
    this.setupSpeechRecognition();
    this.voiceOutputSupported.set(typeof window !== 'undefined' && 'speechSynthesis' in window);
  }

  ngOnDestroy(): void {
    this.clearStreamTimer();
    this.recognition?.abort();
    if (this.voiceOutputSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  /** Starts a brand-new conversation, clearing the transcript locally. */
  newChat(): void {
    this.clearStreamTimer();
    this.stopListening();
    this.stopSpeaking();
    this.activeSessionId.set(null);
    this.messages.set([]);
    this.input.set('');
    this.suggestions.set(this.defaultSuggestions);
    this.sidebarOpen.set(false);
  }

  send(text?: string, isVoice = false): void {
    const message = (text ?? this.input()).trim();
    if (!message || this.loading() || this.streaming()) return;

    this.input.set('');
    this.resizeComposer();
    this.sidebarOpen.set(false);
    this.lastInputWasVoice = isVoice;
    this.push('user', message, isVoice);
    this.loading.set(true);
    this.scrollToBottom();

    this.aiChat.chat(message).subscribe({
      next: (response) => this.applyResponse(response),
      error: () => {
        this.loading.set(false);
        this.pushStreamed('Unable to reach AI Copilot. Please try again in a moment.');
      },
    });
  }

  loadSession(sessionId: string): void {
    this.clearStreamTimer();
    this.stopListening();
    this.stopSpeaking();
    this.aiChat.setSessionId(sessionId);
    this.activeSessionId.set(sessionId);
    this.messages.set([]);
    this.sidebarOpen.set(false);

    this.aiChat.getConversation(sessionId).subscribe({
      next: (items) => {
        const msgs: AiWorkspaceMessage[] = [];
        for (const item of items) {
          msgs.push({ role: 'user', content: item.prompt, timestamp: new Date(item.createdAt) });
          msgs.push({
            role: 'assistant',
            content: item.response,
            displayContent: item.response,
            timestamp: new Date(item.createdAt),
            citations: item.citations,
            toolsUsed: item.toolsUsed,
          });
        }
        this.messages.set(msgs);
        this.scrollToBottom();
      },
    });
  }

  /** Grows/shrinks the composer textarea to fit its content, capped by CSS max-height. */
  onComposerInput(value: string): void {
    this.input.set(value);
    this.resizeComposer();
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  // --- Voice input ---------------------------------------------------------

  /** Wires up SpeechRecognition once; safe no-op if the browser doesn't support it. */
  private setupSpeechRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionCtor: (new () => SpeechRecognitionLike) | undefined =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      this.voiceInputSupported.set(false);
      return;
    }

    this.voiceInputSupported.set(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (final) {
        this.pendingVoiceTranscript = (this.pendingVoiceTranscript + ' ' + final).trim();
      }

      // Show live progress in the composer so the user can see what's being heard.
      this.input.set((this.pendingVoiceTranscript + ' ' + interim).trim());
      this.resizeComposer();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      this.isListening.set(false);
      this.voiceError.set(this.describeVoiceError(event.error));
    };

    recognition.onend = () => {
      this.isListening.set(false);
      const transcript = this.pendingVoiceTranscript.trim();
      this.pendingVoiceTranscript = '';

      if (transcript) {
        // Send exactly like a typed message - this is what makes voice
        // messages persist to conversation history via the normal flow.
        this.send(transcript, true);
      }
    };

    this.recognition = recognition;
  }

  /** Starts or stops mic capture when the user taps the mic button. */
  toggleVoiceInput(): void {
    if (!this.voiceInputSupported() || this.loading() || this.streaming()) return;

    if (this.isListening()) {
      this.recognition?.stop();
      return;
    }

    this.voiceError.set(null);
    this.pendingVoiceTranscript = '';
    this.input.set('');
    this.stopSpeaking();

    try {
      this.recognition?.start();
      this.isListening.set(true);
    } catch {
      this.isListening.set(false);
      this.voiceError.set('Could not start the microphone. Please try again.');
    }
  }

  private stopListening(): void {
    if (this.isListening()) {
      this.recognition?.stop();
    }
    this.isListening.set(false);
    this.pendingVoiceTranscript = '';
  }

  private describeVoiceError(error: string): string {
    switch (error) {
      case 'not-allowed':
      case 'service-not-allowed':
        return 'Microphone access was blocked. Please allow mic permissions and try again.';
      case 'no-speech':
        return "Didn't catch that - please try speaking again.";
      case 'audio-capture':
        return 'No microphone was found on this device.';
      case 'network':
        return 'Voice recognition needs an internet connection.';
      default:
        return 'Voice input ran into a problem. Please try again.';
    }
  }

  // --- Voice output (read replies aloud) -----------------------------------

  toggleAutoSpeak(): void {
    this.autoSpeak.update((v) => !v);
    if (!this.autoSpeak()) {
      this.stopSpeaking();
    }
  }

  /** Reads a message's text aloud; used both for auto-speak and the manual "listen" button. */
  speakMessage(index: number, text: string): void {
    if (!this.voiceOutputSupported() || !text) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onstart = () => this.speakingIndex.set(index);
    utterance.onend = () => this.speakingIndex.set(null);
    utterance.onerror = () => this.speakingIndex.set(null);
    window.speechSynthesis.speak(utterance);
  }

  stopSpeaking(): void {
    if (this.voiceOutputSupported()) {
      window.speechSynthesis.cancel();
    }
    this.speakingIndex.set(null);
  }

  private resizeComposer(): void {
    const el = this.composerEl()?.nativeElement;
    if (!el) return;
    // Reset first so shrinking (e.g. after send) is measured correctly.
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  private refreshSessions(): void {
    this.sessionsLoading.set(true);
    this.aiChat.listConversations(30).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.sessionsLoading.set(false);
      },
      error: () => {
        this.sessions.set([]);
        this.sessionsLoading.set(false);
      },
    });
  }

  private applyResponse(response: AiChatResponse): void {
    if (response.sessionId) {
      this.aiChat.setSessionId(response.sessionId);
      this.activeSessionId.set(response.sessionId);
    }
    this.loading.set(false);
    this.pushStreamed(response.reply, response.citations, response.toolsUsed, this.lastInputWasVoice);
    this.suggestions.set(response.suggestions.length ? response.suggestions : this.suggestions());
    this.refreshSessions();
  }

  private push(role: 'user' | 'assistant', content: string, isVoice = false): void {
    this.messages.update((m) => [
      ...m,
      { role, content, displayContent: content, timestamp: new Date(), isVoice },
    ]);
    this.scrollToBottom();
  }

  /**
   * Adds an assistant message and reveals its content progressively,
   * similar to the streaming/typing effect used by other chat assistants.
   * The underlying data (content, citations, toolsUsed) is set immediately;
   * only the on-screen text is animated, so nothing about the app's
   * data flow changes.
   *
   * When `isVoice` is true (the user spoke their message) and auto-speak is
   * enabled, the finished reply is also read aloud once typing completes.
   */
  private pushStreamed(
    content: string,
    citations?: AiChatMessage['citations'],
    toolsUsed?: AiChatMessage['toolsUsed'],
    isVoice = false,
  ): void {
    this.clearStreamTimer();
    this.streaming.set(true);

    const message: AiWorkspaceMessage = {
      role: 'assistant',
      content,
      displayContent: '',
      timestamp: new Date(),
      citations,
      toolsUsed,
      isStreaming: true,
      isVoice,
    };
    this.messages.update((m) => [...m, message]);
    const index = this.messages().length - 1;
    this.scrollToBottom();

    const words = content.split(/(\s+)/); // keep whitespace tokens so spacing is preserved
    let cursor = 0;

    const revealNext = () => {
      cursor += 1;
      const partial = words.slice(0, cursor).join('');
      const done = cursor >= words.length;

      this.messages.update((m) =>
        m.map((msg, i) =>
          i === index ? { ...msg, displayContent: partial, isStreaming: !done } : msg,
        ),
      );
      this.scrollToBottom();

      if (!done) {
        this.streamTimeoutId = setTimeout(revealNext, TYPE_SPEED_MS);
      } else {
        this.streaming.set(false);
        this.streamTimeoutId = null;

        if (isVoice && this.autoSpeak()) {
          this.speakMessage(index, content);
        }
      }
    };

    this.streamTimeoutId = setTimeout(revealNext, TYPE_SPEED_MS);
  }

  private clearStreamTimer(): void {
    if (this.streamTimeoutId !== null) {
      clearTimeout(this.streamTimeoutId);
      this.streamTimeoutId = null;
    }
    this.streaming.set(false);
  }

  /**
   * Keeps the transcript pinned to the latest message. This is what lets
   * `.messages` grow internally (with its own scrollbar) instead of the
   * whole page stretching as the conversation gets longer.
   */
  private scrollToBottom(): void {
    queueMicrotask(() => {
      const el = this.messagesEl()?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    });
  }
}