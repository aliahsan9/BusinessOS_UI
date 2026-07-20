import { ChangeDetectionStrategy, Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
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

interface AiWorkspaceMessage extends AiChatMessage {
  displayContent?: string;
  isStreaming?: boolean;
}

@Component({
  selector: 'app-ai-workspace',
  standalone: true,
  imports: [FormsModule, RouterLink, AppBreadcrumbComponent],
  templateUrl: './ai-workspace.component.html',
  styleUrl: './ai-workspace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiWorkspaceComponent implements OnInit, OnDestroy {
  private readonly aiChat = inject(AiChatService);

  readonly routes = ROUTES;

  // Signals
  readonly messages = signal<AiWorkspaceMessage[]>([]);
  readonly sessions = signal<AiConversationSession[]>([]);
  readonly suggestions = signal<AiSuggestionDto[]>([
    { label: 'Revenue this month', message: 'What is our revenue this month?' },
    { label: 'Products sold', message: 'How many products sold this month?' },
    { label: 'Overdue invoices', message: 'Show overdue invoices' },
    { label: 'Top customers', message: 'Who are the top customers by revenue?' },
    { label: 'Focus today', message: 'What should I focus on today?' },
  ]);

  readonly input = signal('');
  readonly loading = signal(false);
  readonly streaming = signal(false);
  readonly sidebarOpen = signal(false);

  readonly breadcrumbs = [
    { label: 'AI Copilot', route: ROUTES.ai.workspace },
    { label: 'Workspace' },
  ];

  private streamTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.refreshSessions();
  }

  ngOnDestroy(): void {
    this.clearStreamTimer();
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  send(text?: string): void {
    const message = (text ?? this.input()).trim();
    if (!message || this.loading() || this.streaming()) return;

    this.input.set('');
    this.sidebarOpen.set(false);
    this.addMessage('user', message);
    this.loading.set(true);

    this.aiChat.chat(message).subscribe({
      next: (response) => this.handleResponse(response),
      error: () => {
        this.loading.set(false);
        this.addStreamedMessage('Unable to reach AI Copilot. Please try again.');
      },
    });
  }

  loadSession(sessionId: string): void {
    this.clearStreamTimer();
    this.aiChat.setSessionId(sessionId);
    this.messages.set([]);
    this.sidebarOpen.set(false);

    this.aiChat.getConversation(sessionId).subscribe({
      next: (items) => {
        const mapped = items.flatMap((item) => [
          { role: 'user' as const, content: item.prompt, timestamp: new Date(item.createdAt) },
          {
            role: 'assistant' as const,
            content: item.response,
            displayContent: item.response,
            timestamp: new Date(item.createdAt),
            citations: item.citations,
            toolsUsed: item.toolsUsed,
          },
        ]);
        this.messages.set(mapped);
      },
    });
  }

  private refreshSessions(): void {
    this.aiChat.listConversations(30).subscribe({
      next: (sessions) => this.sessions.set(sessions),
      error: () => this.sessions.set([]),
    });
  }

  private handleResponse(response: AiChatResponse): void {
    if (response.sessionId) this.aiChat.setSessionId(response.sessionId);
    this.loading.set(false);
    this.addStreamedMessage(response.reply, response.citations, response.toolsUsed);
    this.suggestions.set(response.suggestions.length ? response.suggestions : this.suggestions());
    this.refreshSessions();
  }

  private addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.update((msgs) => [
      ...msgs,
      { role, content, displayContent: content, timestamp: new Date() },
    ]);
  }

  private addStreamedMessage(
    content: string,
    citations?: AiChatMessage['citations'],
    toolsUsed?: AiChatMessage['toolsUsed']
  ): void {
    this.clearStreamTimer();
    this.streaming.set(true);

    const newMsg: AiWorkspaceMessage = {
      role: 'assistant',
      content,
      displayContent: '',
      timestamp: new Date(),
      citations,
      toolsUsed,
      isStreaming: true,
    };

    this.messages.update((msgs) => [...msgs, newMsg]);
    const index = this.messages().length - 1;

    const words = content.split(/(\s+)/);
    let cursor = 0;

    const reveal = () => {
      cursor++;
      const partial = words.slice(0, cursor).join('');
      const isDone = cursor >= words.length;

      this.messages.update((msgs) =>
        msgs.map((msg, i) =>
          i === index ? { ...msg, displayContent: partial, isStreaming: !isDone } : msg
        )
      );

      if (!isDone) {
        this.streamTimeoutId = setTimeout(reveal, 16);
      } else {
        this.streaming.set(false);
        this.streamTimeoutId = null;
      }
    };

    this.streamTimeoutId = setTimeout(reveal, 16);
  }

  private clearStreamTimer(): void {
    if (this.streamTimeoutId) {
      clearTimeout(this.streamTimeoutId);
      this.streamTimeoutId = null;
    }
    this.streaming.set(false);
  }
}