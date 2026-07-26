import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  signal,
  computed,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AiChatService } from '../../../core/services/ai-chat.service';
import { AiRetrievalService } from '../../../core/services/ai-retrieval.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  AiChatMessage,
  AiChatResponse,
  AiCitation,
  AiConversationSession,
  AiSourceDocument,
  AiStreamError,
  AiSuggestionDto,
} from '../../../core/models/ai.model';
import { ApiError } from '../../../core/models/api-error.model';
import { ROUTES } from '../../../core/constants/route.constants';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppCardComponent } from '../../../shared/components/app-card/app-card.component';
import { AppConfirmDialogComponent } from '../../../shared/components/app-confirm-dialog/app-confirm-dialog.component';

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
  imports: [FormsModule, RouterLink, AppBreadcrumbComponent, AppCardComponent, AppConfirmDialogComponent],
  templateUrl: './ai-workspace.component.html',
  styleUrl: './ai-workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiWorkspaceComponent implements OnInit, OnDestroy {
  private readonly aiChat = inject(AiChatService);
  private readonly aiRetrieval = inject(AiRetrievalService);
  private readonly notification = inject(NotificationService);
  private readonly sanitizer = inject(DomSanitizer);

  private readonly messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesEl');
  private readonly composerEl = viewChild<ElementRef<HTMLTextAreaElement>>('composerEl');

  readonly routes = ROUTES;
  readonly messages = signal<AiWorkspaceMessage[]>([]);
  readonly sessions = signal<AiConversationSession[]>([]);
  readonly activeSessionId = signal<string | null>(null);
  readonly suggestions = signal<AiSuggestionDto[]>([
    { label: 'Revenue this month', message: 'What is our revenue this month?' },
    { label: 'Best-selling products', message: 'Which products are best selling this month?' },
    { label: 'Sales trends', message: 'What are our sales trends over the last few months?' },
    { label: 'Increase sales', message: 'How can I increase sales based on our current data?' },
    { label: 'Overdue invoices', message: 'Show overdue invoices' },
    { label: 'Top customers', message: 'Who are the top customers by revenue?' },
    { label: 'Focus today', message: 'What should I focus on today?' },
  ]);

  readonly starterPrompts = [
    {
      icon: 'bi-graph-up-arrow',
      title: 'Sales & revenue',
      description: 'Live totals, bestsellers, and month-over-month trends.',
      prompts: [
        { label: 'Revenue this month', message: 'What is our revenue this month?' },
        { label: 'Best sellers', message: 'Which products are best selling this month?' },
        { label: 'Sales trends', message: 'What are our sales trends over the last few months?' },
      ],
    },
    {
      icon: 'bi-lightbulb',
      title: 'Grow the business',
      description: 'Practical tips grounded in your actual numbers.',
      prompts: [
        { label: 'Increase sales', message: 'How can I increase sales based on our current data?' },
        { label: 'Focus today', message: 'What should I focus on today?' },
      ],
    },
    {
      icon: 'bi-people',
      title: 'Customers & cash',
      description: 'Who pays, who owes, and who to follow up.',
      prompts: [
        { label: 'Top customers', message: 'Who are the top customers by revenue?' },
        { label: 'Overdue invoices', message: 'Show overdue invoices' },
      ],
    },
  ] as const;
  private readonly defaultSuggestions = this.suggestions();
  readonly input = signal('');
  readonly expandedCitations = signal<Record<number, boolean>>({});

  /** True while we are waiting on the network call (shows the "thinking" indicator). */
  readonly loading = signal(false);
  /** True while an assistant reply is being revealed character-by-character. */
  readonly streaming = signal(false);
  readonly sidebarOpen = signal(false);
  readonly sessionsLoading = signal(false);
  readonly deleteTarget = signal<AiConversationSession | null>(null);
  readonly deleting = signal(false);
  readonly canRegenerate = computed(() => {
    const msgs = this.messages();
    return !this.loading() && !this.streaming() && msgs.some((m) => m.role === 'user');
  });

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
    this.aiChat.stopGeneration();
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
    this.aiChat.stopGeneration();
    this.aiChat.clearSession();
    this.stopListening();
    this.stopSpeaking();
    this.activeSessionId.set(null);
    this.messages.set([]);
    this.input.set('');
    this.suggestions.set(this.defaultSuggestions);
    this.expandedCitations.set({});
    this.loading.set(false);
    this.streaming.set(false);
    this.sidebarOpen.set(false);
  }

  send(text?: string, isVoice = false, options?: { regenerate?: boolean }): void {
    const message = (text ?? this.input()).trim();
    if (!message || this.loading() || this.streaming()) return;

    if (!options?.regenerate) {
      this.input.set('');
      this.resizeComposer();
      this.push('user', message, isVoice);
    }

    this.sidebarOpen.set(false);
    this.lastInputWasVoice = isVoice;
    this.loading.set(true);
    this.scrollToBottom();
    void this.sendStreaming(message, options?.regenerate);
  }

  stopGeneration(): void {
    this.aiChat.stopGeneration();
    this.clearStreamTimer();
    this.loading.set(false);
    this.streaming.set(false);
    this.messages.update((msgs) =>
      msgs.map((msg) =>
        msg.isStreaming
          ? {
              ...msg,
              isStreaming: false,
              displayContent: msg.displayContent || msg.content || 'Generation stopped.',
              content: msg.content || 'Generation stopped.',
            }
          : msg,
      ),
    );
  }

  regenerateLast(): void {
    const lastUser = [...this.messages()].reverse().find((m) => m.role === 'user');
    if (!lastUser || this.loading() || this.streaming()) return;

    this.clearStreamTimer();
    this.messages.update((msgs) => {
      const copy = [...msgs];
      while (copy.length && copy[copy.length - 1].role === 'assistant') {
        copy.pop();
      }
      return copy;
    });

    this.send(lastUser.content, false, { regenerate: true });
  }

  loadSession(sessionId: string): void {
    this.clearStreamTimer();
    this.aiChat.stopGeneration();
    this.stopListening();
    this.stopSpeaking();
    this.aiChat.setSessionId(sessionId);
    this.activeSessionId.set(sessionId);
    this.messages.set([]);
    this.expandedCitations.set({});
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
      error: (err: ApiError) => {
        this.notification.error('Could not load conversation', err.detail ?? err.title);
      },
    });
  }

  confirmDeleteSession(session: AiConversationSession, event: Event): void {
    event.stopPropagation();
    this.deleteTarget.set(session);
  }

  deleteConfirmMessage(session: AiConversationSession): string {
    const title = session.title?.trim() || 'this chat';
    return `Delete "${title}"? This cannot be undone.`;
  }

  cancelDeleteSession(): void {
    if (this.deleting()) return;
    this.deleteTarget.set(null);
  }

  deleteSession(): void {
    const target = this.deleteTarget();
    if (!target) return;

    this.deleting.set(true);
    this.aiChat.deleteConversation(target.id).subscribe({
      next: () => {
        this.sessions.update((list) => list.filter((s) => s.id !== target.id));
        if (this.activeSessionId() === target.id) {
          this.newChat();
        }
        this.notification.success('Conversation deleted');
        this.deleteTarget.set(null);
        this.deleting.set(false);
      },
      error: (err: ApiError) => {
        const detail =
          err.status === 405
            ? 'Delete is not available on this API yet. Restart the backend after the latest update.'
            : (err.detail ?? err.title);
        this.notification.error('Failed to delete conversation', detail);
        this.deleting.set(false);
      },
    });
  }

  toggleCitations(messageIndex: number): void {
    this.expandedCitations.update((state) => ({
      ...state,
      [messageIndex]: !state[messageIndex],
    }));
  }

  citationSources(msg: AiChatMessage): AiSourceDocument[] {
    return (msg.citations ?? []).map((c) => this.aiRetrieval.toSourceDocument(c));
  }

  formatScore(score: number): string {
    return this.aiRetrieval.formatSimilarity(score);
  }

  formatMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
    return this.aiRetrieval.formatMetadata(metadata);
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

  private async sendStreaming(message: string, regenerate = false): Promise<void> {
    const streamMsg: AiWorkspaceMessage = {
      role: 'assistant',
      content: '',
      displayContent: '',
      timestamp: new Date(),
      isStreaming: true,
      isVoice: this.lastInputWasVoice,
    };
    this.messages.update((m) => [...m, streamMsg]);
    const msgIndex = this.messages().length - 1;
    this.streaming.set(true);
    this.scrollToBottom();

    try {
      for await (const chunk of this.aiChat.streamWithFallback(message, { regenerate })) {
        if ((chunk.type === 'token' || chunk.type === 'delta') && chunk.content) {
          this.loading.set(false);
          this.messages.update((msgs) => {
            const copy = [...msgs];
            const nextContent = (copy[msgIndex].content || '') + chunk.content;
            copy[msgIndex] = {
              ...copy[msgIndex],
              content: nextContent,
              displayContent: nextContent,
              isStreaming: true,
            };
            return copy;
          });
          this.scrollToBottom();
        }

        if (chunk.type === 'done') {
          if (chunk.finalResponse) {
            this.applyFinalResponse(chunk.finalResponse, msgIndex);
          } else if (chunk.content) {
            this.messages.update((msgs) => {
              const copy = [...msgs];
              copy[msgIndex] = {
                ...copy[msgIndex],
                content: chunk.content || copy[msgIndex].content,
                displayContent: chunk.content || copy[msgIndex].displayContent,
                isStreaming: false,
              };
              return copy;
            });
            this.streaming.set(false);
          }
        }
      }

      this.messages.update((msgs) => {
        const copy = [...msgs];
        if (copy[msgIndex]?.isStreaming) {
          const text =
            copy[msgIndex].content ||
            'Sorry, I could not generate a response. Please try again.';
          copy[msgIndex] = {
            ...copy[msgIndex],
            content: text,
            displayContent: text,
            isStreaming: false,
          };
        }
        return copy;
      });
    } catch (err) {
      if (err instanceof AiStreamError && err.aborted) {
        this.messages.update((msgs) => {
          const copy = [...msgs];
          const current = copy[msgIndex];
          copy[msgIndex] = {
            ...current,
            content: current.content || 'Generation stopped.',
            displayContent: current.displayContent || current.content || 'Generation stopped.',
            isStreaming: false,
          };
          return copy;
        });
        return;
      }

      try {
        const response = await firstValueFrom(this.aiChat.chat(message, { regenerate }));
        this.applyFinalResponse(this.aiChat.normalizeResponse(response), msgIndex, true);
      } catch (fallbackErr) {
        this.loading.set(false);
        this.streaming.set(false);
        this.messages.update((msgs) => {
          const copy = [...msgs];
          copy[msgIndex] = {
            ...copy[msgIndex],
            content: 'Unable to reach AI Copilot. Please try again in a moment.',
            displayContent: 'Unable to reach AI Copilot. Please try again in a moment.',
            isStreaming: false,
          };
          return copy;
        });
        this.notifyError(fallbackErr);
      }
    } finally {
      this.loading.set(false);
      if (!this.streamTimeoutId) {
        this.streaming.set(false);
      }
      this.messages.update((msgs) =>
        msgs.map((msg, i) =>
          i === msgIndex && msg.isStreaming ? { ...msg, isStreaming: false } : msg,
        ),
      );
    }
  }

  private applyFinalResponse(response: AiChatResponse, msgIndex: number, animateFallback = false): void {
    const sessionId = this.aiChat.resolveSessionId(response);
    if (sessionId) {
      this.aiChat.setSessionId(sessionId);
      this.activeSessionId.set(sessionId);
    }

    const citations = this.mergeCitations(response);
    const reply = response.reply || this.messages()[msgIndex]?.content || '';

    this.loading.set(false);

    if (animateFallback && reply) {
      this.messages.update((msgs) => {
        const copy = [...msgs];
        copy[msgIndex] = {
          ...copy[msgIndex],
          content: reply,
          displayContent: '',
          citations,
          toolsUsed: response.toolsUsed,
          sources: response.sources,
          isStreaming: true,
          isVoice: this.lastInputWasVoice,
        };
        return copy;
      });
      this.animateReveal(msgIndex, reply);
    } else {
      this.messages.update((msgs) => {
        const copy = [...msgs];
        copy[msgIndex] = {
          ...copy[msgIndex],
          content: reply,
          displayContent: reply,
          citations,
          toolsUsed: response.toolsUsed,
          sources: response.sources,
          isStreaming: false,
          isVoice: this.lastInputWasVoice,
        };
        return copy;
      });
      this.streaming.set(false);

      if (this.lastInputWasVoice && this.autoSpeak()) {
        this.speakMessage(msgIndex, reply);
      }
    }

    this.suggestions.set(response.suggestions.length ? response.suggestions : this.suggestions());
    this.refreshSessions();
    this.scrollToBottom();
  }

  private mergeCitations(response: AiChatResponse): AiCitation[] {
    const fromCitations = response.citations ?? [];
    if (fromCitations.length || !response.sourceDocuments?.length) {
      return fromCitations;
    }

    return response.sourceDocuments.map((doc) => ({
      title: doc.documentName,
      documentType: doc.entityType,
      sourceId: doc.sourceId,
      excerpt: doc.preview,
      score: doc.similarityScore,
      documentName: doc.documentName,
      entityType: doc.entityType,
      similarityScore: doc.similarityScore,
      metadata: doc.metadata,
      preview: doc.preview,
    }));
  }

  private notifyError(err: unknown): void {
    if (err instanceof AiStreamError) {
      if (err.status === 0) {
        this.notification.error('Network error', err.message);
      } else if (err.status === 403) {
        this.notification.error('Access denied', err.message);
      } else if (err.status >= 500) {
        this.notification.error('AI server error', err.message);
      }
      return;
    }
    if (err && typeof err === 'object' && 'status' in err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 404 || apiErr.status === 408) {
        this.notification.error(apiErr.title, apiErr.detail);
      }
    }
  }

  /** Lightweight markdown → HTML for assistant replies (**bold**, bullets, paragraphs). */
  formatReplyHtml(text: string | undefined | null): SafeHtml {
    const raw = (text ?? '').trim();
    if (!raw) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }

    const escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const withInline = escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    const lines = withInline.split('\n');
    const htmlParts: string[] = [];
    let inList = false;

    for (const line of lines) {
      const bullet = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
      if (bullet) {
        if (!inList) {
          htmlParts.push('<ul>');
          inList = true;
        }
        htmlParts.push(`<li>${bullet[1]}</li>`);
        continue;
      }

      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }

      if (!line.trim()) {
        htmlParts.push('<br />');
        continue;
      }

      htmlParts.push(`<p>${line}</p>`);
    }

    if (inList) {
      htmlParts.push('</ul>');
    }

    return this.sanitizer.bypassSecurityTrustHtml(htmlParts.join(''));
  }

  private push(role: 'user' | 'assistant', content: string, isVoice = false): void {
    this.messages.update((m) => [
      ...m,
      { role, content, displayContent: content, timestamp: new Date(), isVoice },
    ]);
    this.scrollToBottom();
  }

  /** Client-side reveal used only when falling back from SSE to a full HTTP reply. */
  private animateReveal(index: number, content: string): void {
    this.clearStreamTimer();
    this.streaming.set(true);

    const words = content.split(/(\s+)/);
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

        if (this.lastInputWasVoice && this.autoSpeak()) {
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
