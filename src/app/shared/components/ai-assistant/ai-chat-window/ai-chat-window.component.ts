import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  output,
  ElementRef,
  viewChild,
  afterNextRender,
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AiChatService } from '../../../../core/services/ai-chat.service';
import { AiContextService } from '../../../../core/services/ai-context.service';
import { AiRetrievalService } from '../../../../core/services/ai-retrieval.service';
import { AiActionService } from '../../../../core/services/ai-action.service';
import { AiPromptBuilderService } from '../../../../core/services/ai-prompt-builder.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AiChatMessage,
  AiChatResponse,
  AiCitation,
  AiQuickActionDto,
  AiSearchResultDto,
  AiSourceDocument,
  AiStreamError,
  AiSuggestionDto,
} from '../../../../core/models/ai.model';
import { ApiError } from '../../../../core/models/api-error.model';
import { AiAssistantStateService } from '../../../../state/ai-assistant.state';
import { ROUTES } from '../../../../core/constants/route.constants';
import { TenantSettingsStoreService } from '../../../../core/services/tenant-settings-store.service';

@Component({
  selector: 'app-ai-chat-window',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './ai-chat-window.component.html',
  styleUrl: './ai-chat-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatWindowComponent implements OnDestroy {
  private readonly aiChatService = inject(AiChatService);
  private readonly aiContextService = inject(AiContextService);
  private readonly aiRetrievalService = inject(AiRetrievalService);
  private readonly aiActionService = inject(AiActionService);
  private readonly aiPromptBuilder = inject(AiPromptBuilderService);
  private readonly aiAssistantState = inject(AiAssistantStateService);
  private readonly tenantSettingsStore = inject(TenantSettingsStoreService);
  private readonly notification = inject(NotificationService);
  private readonly messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  readonly close = output<void>();
  readonly navigate = output<string>();

  readonly welcomeMessage: AiChatMessage = {
    role: 'assistant',
    content:
      "Hi! I'm BusinessOS AI Copilot. Ask about revenue, invoices, projects, customers, or say \"What should I focus on today?\" — I'll answer using your live business data.",
    timestamp: new Date(),
  };

  readonly messages = signal<AiChatMessage[]>([{ ...this.welcomeMessage }]);
  readonly suggestions = signal<AiSuggestionDto[]>([]);
  readonly quickActions = signal<AiQuickActionDto[]>([]);
  readonly searchResults = signal<AiSearchResultDto[]>([]);
  readonly inputText = signal('');
  readonly searchText = signal('');
  readonly loading = signal(false);
  readonly streamingEnabled = signal(true);
  readonly expandedCitations = signal<Record<number, boolean>>({});
  readonly showSuggestions = computed(
    () => this.tenantSettingsStore.settings()?.aiShowSuggestions ?? true,
  );
  readonly chatEnabled = this.aiAssistantState.chatEnabled;
  readonly settingsRoute = ROUTES.settings.hub;
  readonly workspaceRoute = ROUTES.ai.workspace;
  readonly contextLabel = computed(() =>
    this.aiPromptBuilder.buildContextLabel(this.aiContextService.buildPageContext()),
  );
  readonly canRegenerate = computed(() => {
    const msgs = this.messages();
    return !this.loading() && msgs.some((m) => m.role === 'user');
  });

  constructor() {
    afterNextRender(() => this.scrollToBottom());
  }

  ngOnDestroy(): void {
    this.aiChatService.stopGeneration();
  }

  sendMessage(text?: string, options?: { regenerate?: boolean }): void {
    const message = (text ?? this.inputText()).trim();
    if (!message || this.loading()) return;

    if (!this.chatEnabled()) {
      this.appendMessage(
        'assistant',
        'The AI assistant is turned off in tenant settings. Enable it under Settings to start chatting.',
      );
      return;
    }

    if (!options?.regenerate) {
      this.inputText.set('');
      this.appendMessage('user', message);
    }

    this.loading.set(true);

    if (this.streamingEnabled()) {
      void this.sendStreaming(message, options?.regenerate);
      return;
    }

    this.aiChatService.chat(message, { regenerate: options?.regenerate }).subscribe({
      next: (response) => this.handleResponse(this.aiChatService.normalizeResponse(response)),
      error: (err: ApiError) => this.handleError(err),
    });
  }

  newConversation(): void {
    this.aiChatService.stopGeneration();
    this.aiChatService.clearSession();
    this.messages.set([{ ...this.welcomeMessage, timestamp: new Date() }]);
    this.suggestions.set([]);
    this.quickActions.set([]);
    this.searchResults.set([]);
    this.inputText.set('');
    this.searchText.set('');
    this.loading.set(false);
    this.expandedCitations.set({});
  }

  stopGeneration(): void {
    this.aiChatService.stopGeneration();
    this.loading.set(false);
    this.messages.update((msgs) =>
      msgs.map((msg) => (msg.streaming ? { ...msg, streaming: false } : msg)),
    );
  }

  regenerateLast(): void {
    const lastUser = [...this.messages()].reverse().find((m) => m.role === 'user');
    if (!lastUser || this.loading()) return;

    this.messages.update((msgs) => {
      const copy = [...msgs];
      while (copy.length && copy[copy.length - 1].role === 'assistant') {
        copy.pop();
      }
      return copy;
    });

    this.sendMessage(lastUser.content, { regenerate: true });
  }

  toggleCitations(messageIndex: number): void {
    this.expandedCitations.update((state) => ({
      ...state,
      [messageIndex]: !state[messageIndex],
    }));
  }

  citationSources(msg: AiChatMessage): AiSourceDocument[] {
    return (msg.citations ?? []).map((c) => this.aiRetrievalService.toSourceDocument(c));
  }

  formatScore(score: number): string {
    return this.aiRetrievalService.formatSimilarity(score);
  }

  formatMetadata(metadata: Record<string, unknown> | null | undefined): string | null {
    return this.aiRetrievalService.formatMetadata(metadata);
  }

  private async sendStreaming(message: string, regenerate = false): Promise<void> {
    const streamMsg: AiChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
    };
    this.messages.update((msgs) => [...msgs, streamMsg]);
    const msgIndex = this.messages().length - 1;

    try {
      for await (const chunk of this.aiChatService.streamWithFallback(message, { regenerate })) {
        if ((chunk.type === 'token' || chunk.type === 'delta') && chunk.content) {
          this.messages.update((msgs) => {
            const copy = [...msgs];
            copy[msgIndex] = { ...copy[msgIndex], content: copy[msgIndex].content + chunk.content };
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
                streaming: false,
              };
              return copy;
            });
          }
        }
      }

      // If stream ended without clearing the caret, finalize whatever text we have.
      this.messages.update((msgs) => {
        const copy = [...msgs];
        if (copy[msgIndex]?.streaming) {
          copy[msgIndex] = {
            ...copy[msgIndex],
            streaming: false,
            content:
              copy[msgIndex].content ||
              'Sorry, I could not generate a response. Please try again.',
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
            streaming: false,
          };
          return copy;
        });
        return;
      }

      // Last-resort HTTP fallback if streamWithFallback itself failed before yielding.
      try {
        const response = await firstValueFrom(this.aiChatService.chat(message, { regenerate }));
        this.applyFinalResponse(this.aiChatService.normalizeResponse(response), msgIndex);
      } catch (fallbackErr) {
        this.messages.update((msgs) => {
          const copy = [...msgs];
          copy[msgIndex] = {
            ...copy[msgIndex],
            content: this.formatStreamOrApiError(fallbackErr),
            streaming: false,
          };
          return copy;
        });
        this.notifyStreamError(fallbackErr);
      }
    } finally {
      this.loading.set(false);
      this.messages.update((msgs) =>
        msgs.map((msg, i) => (i === msgIndex && msg.streaming ? { ...msg, streaming: false } : msg)),
      );
    }
  }

  private handleResponse(response: AiChatResponse): void {
    const sessionId = this.aiChatService.resolveSessionId(response);
    if (sessionId) {
      this.aiChatService.setSessionId(sessionId);
    }
    this.appendMessage(
      'assistant',
      response.reply,
      response.sources,
      response.actionResult,
      this.mergeCitations(response),
      response.toolsUsed,
    );
    if (this.showSuggestions()) {
      this.suggestions.set(response.suggestions);
    }
    this.quickActions.set(response.quickActions);
    this.searchResults.set(response.searchResults);

    const navRoute = response.actionResult
      ? this.aiActionService.shouldNavigate(response.actionResult)
      : null;
    if (navRoute) {
      this.navigate.emit(navRoute);
    }

    this.loading.set(false);
  }

  private applyFinalResponse(response: AiChatResponse, msgIndex: number): void {
    const sessionId = this.aiChatService.resolveSessionId(response);
    if (sessionId) {
      this.aiChatService.setSessionId(sessionId);
    }
    this.messages.update((msgs) => {
      const copy = [...msgs];
      copy[msgIndex] = {
        ...copy[msgIndex],
        content: response.reply || copy[msgIndex].content,
        streaming: false,
        sources: response.sources,
        citations: this.mergeCitations(response),
        toolsUsed: response.toolsUsed,
        actionResult: response.actionResult,
      };
      return copy;
    });
    if (this.showSuggestions()) {
      this.suggestions.set(response.suggestions);
    }
    this.quickActions.set(response.quickActions);
    this.searchResults.set(response.searchResults);

    const navRoute = response.actionResult
      ? this.aiActionService.shouldNavigate(response.actionResult)
      : null;
    if (navRoute) {
      this.navigate.emit(navRoute);
    }
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

  runSearch(): void {
    const query = this.searchText().trim();
    if (!query || this.loading()) return;

    if (!this.chatEnabled()) {
      this.appendMessage(
        'assistant',
        'Search is unavailable while the AI assistant is disabled in tenant settings.',
      );
      return;
    }

    this.loading.set(true);
    this.aiChatService.search(query).subscribe({
      next: (response) => {
        const normalized = this.aiChatService.normalizeResponse(response);
        this.searchResults.set(normalized.searchResults);
        this.appendMessage(
          'assistant',
          normalized.searchResults.length
            ? `Found ${normalized.searchResults.length} result(s) for "${query}".`
            : `No results found for "${query}".`,
          normalized.sources,
          null,
          this.mergeCitations(normalized),
        );
        this.loading.set(false);
      },
      error: (err: ApiError) => this.handleError(err),
    });
  }

  sourcesSummary(msg: AiChatMessage): string | null {
    if (!msg.sources || !this.aiRetrievalService.hasRetrievedData(msg.sources)) return null;
    return this.aiRetrievalService.formatSourcesSummary(msg.sources);
  }

  useSuggestion(suggestion: AiSuggestionDto): void {
    this.sendMessage(suggestion.message);
  }

  goTo(route: string): void {
    this.navigate.emit(route);
  }

  onClose(): void {
    this.close.emit();
  }

  private appendMessage(
    role: 'user' | 'assistant',
    content: string,
    sources?: AiChatMessage['sources'],
    actionResult?: AiChatMessage['actionResult'],
    citations?: AiChatMessage['citations'],
    toolsUsed?: AiChatMessage['toolsUsed'],
  ): void {
    this.messages.update((msgs) => [
      ...msgs,
      { role, content, timestamp: new Date(), sources, actionResult, citations, toolsUsed },
    ]);
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private handleError(err: ApiError): void {
    this.appendMessage('assistant', this.formatErrorMessage(err));
    this.loading.set(false);
    this.notifyApiError(err);
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private formatErrorMessage(err: ApiError): string {
    const message = err.detail?.trim() || err.title?.trim();
    if (message) {
      return message;
    }

    return 'Sorry, I could not reach the AI service. Please try again in a moment.';
  }

  private formatStreamOrApiError(err: unknown): string {
    if (err instanceof AiStreamError) {
      return err.message;
    }
    if (err && typeof err === 'object' && 'status' in err) {
      return this.formatErrorMessage(err as ApiError);
    }
    return 'Sorry, streaming failed. Please try again.';
  }

  private notifyStreamError(err: unknown): void {
    if (err instanceof AiStreamError) {
      if (err.status === 401) {
        this.notification.error('Session expired', 'Please sign in again.');
      } else if (err.status === 403) {
        this.notification.error('Access denied', err.message);
      } else if (err.status === 404) {
        this.notification.error('AI endpoint not found', err.message);
      } else if (err.status >= 500) {
        this.notification.error('AI server error', err.message);
      } else if (err.status === 0) {
        this.notification.error('Network error', err.message);
      }
      return;
    }
    if (err && typeof err === 'object' && 'status' in err) {
      this.notifyApiError(err as ApiError);
    }
  }

  private notifyApiError(err: ApiError): void {
    if (err.status === 404) {
      this.notification.error('Not found', err.detail ?? err.title);
    } else if (err.status === 408) {
      this.notification.error('Request timed out', 'The AI service took too long to respond.');
    }
  }
}
