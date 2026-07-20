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
}

const TYPE_SPEED_MS = 18;

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

  readonly breadcrumbs = [
    { label: 'AI Copilot', route: ROUTES.ai.workspace },
    { label: 'Workspace' },
  ];

  /** Handle for the current typewriter animation so it can be cancelled/cleaned up. */
  private streamTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.refreshSessions();
  }

  ngOnDestroy(): void {
    this.clearStreamTimer();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  /** Starts a brand-new conversation, clearing the transcript locally. */
  newChat(): void {
    this.clearStreamTimer();
    this.activeSessionId.set(null);
    this.messages.set([]);
    this.input.set('');
    this.suggestions.set(this.defaultSuggestions);
    this.sidebarOpen.set(false);
  }

  send(text?: string): void {
    const message = (text ?? this.input()).trim();
    if (!message || this.loading() || this.streaming()) return;

    this.input.set('');
    this.resizeComposer();
    this.sidebarOpen.set(false);
    this.push('user', message);
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
    this.pushStreamed(response.reply, response.citations, response.toolsUsed);
    this.suggestions.set(response.suggestions.length ? response.suggestions : this.suggestions());
    this.refreshSessions();
  }

  private push(role: 'user' | 'assistant', content: string): void {
    this.messages.update((m) => [
      ...m,
      { role, content, displayContent: content, timestamp: new Date() },
    ]);
    this.scrollToBottom();
  }

  /**
   * Adds an assistant message and reveals its content progressively,
   * similar to the streaming/typing effect used by other chat assistants.
   * The underlying data (content, citations, toolsUsed) is set immediately;
   * only the on-screen text is animated, so nothing about the app's
   * data flow changes.
   */
  private pushStreamed(
    content: string,
    citations?: AiChatMessage['citations'],
    toolsUsed?: AiChatMessage['toolsUsed'],
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