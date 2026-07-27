import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  afterNextRender,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AgentEmployeeService } from '../../../../core/services/agent-employee.service';
import { SophiaVoiceService } from '../../../../core/services/sophia-voice.service';
import { AiContextService } from '../../../../core/services/ai-context.service';
import { AiRetrievalService } from '../../../../core/services/ai-retrieval.service';
import { AiActionService } from '../../../../core/services/ai-action.service';
import { AiPromptBuilderService } from '../../../../core/services/ai-prompt-builder.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  AiChatMessage,
  AiCitation,
  AiQuickActionDto,
  AiSearchResultDto,
  AiSourceDocument,
  AiStreamError,
  AiSuggestionDto,
} from '../../../../core/models/ai.model';
import { AgentChatResponse, AgentWorkflowStep } from '../../../../core/models/agent.model';
import { ApiError } from '../../../../core/models/api-error.model';
import { AiAssistantStateService } from '../../../../state/ai-assistant.state';
import { ROUTES } from '../../../../core/constants/route.constants';
import { TenantSettingsStoreService } from '../../../../core/services/tenant-settings-store.service';
import { bootstrapIconClass, isBootstrapIcon } from '../../../utils/icon.util';

@Component({
  selector: 'app-ai-chat-window',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './ai-chat-window.component.html',
  styleUrl: './ai-chat-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatWindowComponent implements OnInit, OnDestroy {
  private readonly agentService = inject(AgentEmployeeService);
  private readonly voice = inject(SophiaVoiceService);
  private readonly aiContextService = inject(AiContextService);
  private readonly aiRetrievalService = inject(AiRetrievalService);
  private readonly aiActionService = inject(AiActionService);
  private readonly aiPromptBuilder = inject(AiPromptBuilderService);
  private readonly aiAssistantState = inject(AiAssistantStateService);
  private readonly tenantSettingsStore = inject(TenantSettingsStoreService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messagesContainer = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  readonly close = output<void>();
  readonly navigate = output<string>();

  readonly agentName = signal('Sophia');
  readonly agentRole = signal('Senior Business Analyst');
  readonly workflowSteps = signal<AgentWorkflowStep[]>([]);
  readonly liveTaskStatus = signal<string | null>(null);
  readonly liveToolName = signal<string | null>(null);

  private buildWelcome(_lang: string, name = 'Sophia'): AiChatMessage {
    return {
      role: 'assistant',
      content: `Hi — I'm ${name}, your Senior Business Analyst. Talk or type anytime. Try: "Create order for this customer", "Create supplier Acme", "What should I reorder?", or "Inventory summary".`,
      timestamp: new Date(),
      agentDisplayName: name,
    };
  }

  readonly welcomeMessage: AiChatMessage = this.buildWelcome('en');

  readonly messages = signal<AiChatMessage[]>([{ ...this.welcomeMessage }]);
  readonly suggestions = signal<AiSuggestionDto[]>([]);
  readonly quickActions = signal<AiQuickActionDto[]>([]);
  readonly searchResults = signal<AiSearchResultDto[]>([]);
  readonly inputText = signal('');
  readonly searchText = signal('');
  readonly loading = signal(false);
  readonly expandedCitations = signal<Record<number, boolean>>({});

  readonly isBootstrapIcon = isBootstrapIcon;
  readonly bootstrapIconClass = bootstrapIconClass;

  readonly voiceState = this.voice.voiceState;
  readonly isListening = this.voice.isListening;
  readonly isSpeaking = this.voice.isSpeaking;
  readonly isMuted = this.voice.isMuted;
  readonly micSupported = this.voice.micSupported;
  readonly language = this.voice.language;
  readonly interimTranscript = this.voice.transcriptInterim;

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
  readonly statusLabel = computed(() => {
    const live = this.liveTaskStatus();
    if (live && this.loading()) return live;
    switch (this.voiceState()) {
      case 'listening':
        return 'Listening…';
      case 'processing':
        return 'Thinking…';
      case 'speaking':
        return 'Speaking…';
      case 'working':
        return this.liveToolName() ? `Calling ${this.liveToolName()}…` : 'Working…';
      default:
        return this.loading() ? 'Thinking…' : 'Ready';
    }
  });

  constructor() {
    afterNextRender(() => this.scrollToBottom());
  }

  ngOnInit(): void {
    void this.bootstrap();
    this.voice.onFinalTranscript = (text) => this.sendMessage(text);
    this.aiAssistantState.pendingPrompt;
    // Consume pending Ask Sophia prompts when the window opens.
    const pending = this.aiAssistantState.consumePendingPrompt();
    if (pending) {
      setTimeout(() => this.sendMessage(pending), 120);
    }
  }

  ngOnDestroy(): void {
    this.agentService.stopGeneration();
    this.voice.stopListening();
    this.voice.stopSpeaking();
    this.voice.onFinalTranscript = null;
  }

  private async bootstrap(): Promise<void> {
    await this.voice.loadPreferences();
    const lang = this.voice.language();
    const welcome = this.buildWelcome(lang, this.agentName());
    this.messages.set([{ ...welcome }]);

    this.agentService
      .listEmployees()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (employees) => {
          const sophia = employees.find((e) => e.key === 'sophia') ?? employees.find((e) => e.isDefault);
          if (sophia) {
            this.agentName.set(sophia.displayName);
            this.agentRole.set(sophia.roleTitle);
            if (this.messages().length === 1 && this.messages()[0].role === 'assistant') {
              this.messages.set([{ ...this.buildWelcome(this.voice.language(), sophia.displayName) }]);
            }
          }
        },
        error: () => undefined,
      });

    this.agentService
      .getAskSophiaSuggestions()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (this.showSuggestions() && data.suggestions?.length) {
            this.suggestions.set(
              data.suggestions.map((s) => ({ label: s.label, message: s.message })),
            );
          }
        },
        error: () => undefined,
      });
  }

  sendMessage(text?: string): void {
    const message = (text ?? this.inputText()).trim();
    if (!message || this.loading()) return;

    if (!this.chatEnabled()) {
      this.appendMessage(
        'assistant',
        'Sophia is turned off in tenant settings. Enable her under Settings → AI Assistant.',
      );
      return;
    }

    this.inputText.set('');
    this.appendMessage('user', message);
    this.loading.set(true);
    this.voice.setProcessing(true);
    this.workflowSteps.set([]);
    this.liveTaskStatus.set(null);
    this.liveToolName.set(null);
    void this.sendStreaming(message);
  }

  newConversation(): void {
    this.agentService.stopGeneration();
    this.agentService.clearSession();
    this.voice.stopSpeaking();
    this.messages.set([{ ...this.buildWelcome(this.voice.language(), this.agentName()), timestamp: new Date() }]);
    this.suggestions.set([]);
    this.quickActions.set([]);
    this.searchResults.set([]);
    this.workflowSteps.set([]);
    this.liveTaskStatus.set(null);
    this.liveToolName.set(null);
    this.inputText.set('');
    this.searchText.set('');
    this.loading.set(false);
    this.expandedCitations.set({});
  }

  stopGeneration(): void {
    this.agentService.stopGeneration();
    this.loading.set(false);
    this.voice.setProcessing(false);
    this.messages.update((msgs) =>
      msgs.map((msg) => (msg.streaming ? { ...msg, streaming: false } : msg)),
    );
  }

  regenerateLast(): void {
    const lastUser = [...this.messages()].reverse().find((m) => m.role === 'user');
    if (!lastUser || this.loading()) return;
    this.messages.update((msgs) => {
      const copy = [...msgs];
      while (copy.length && copy[copy.length - 1].role === 'assistant') copy.pop();
      return copy;
    });
    this.sendMessage(lastUser.content);
  }

  toggleMic(): void {
    this.voice.toggleListening();
  }

  onMicPointerDown(event: Event): void {
    event.preventDefault();
    if (!this.micSupported() || this.loading()) return;
    this.voice.startListening({ pushToTalk: true });
  }

  onMicPointerUp(): void {
    if (this.isListening()) this.voice.stopListening();
  }

  toggleMute(): void {
    this.voice.toggleMute();
  }

  stopSpeaking(): void {
    this.voice.stopSpeaking();
  }

  replay(): void {
    this.voice.replay();
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

  formatTools(tools: string[]): string {
    return tools
      .map((t) =>
        t
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/^Get /i, '')
          .replace(/^Create /i, ''),
      )
      .join(' · ');
  }

  friendlyEntity(entityType: string | null | undefined): string {
    if (!entityType) return 'record';
    return entityType
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ');
  }

  stepStatusIcon(status: AgentWorkflowStep['status']): string {
    const value = String(status);
    if (value === 'Completed' || value === '2') return 'bi-check-lg';
    if (value === 'Running' || value === '1') return 'bi-arrow-repeat';
    if (value === 'Failed' || value === '3') return 'bi-exclamation-lg';
    if (value === 'Skipped' || value === '4') return 'bi-dash-lg';
    return 'bi-circle';
  }

  isStepDone(status: AgentWorkflowStep['status']): boolean {
    const value = String(status);
    return value === 'Completed' || value === '2';
  }

  isStepActive(status: AgentWorkflowStep['status']): boolean {
    const value = String(status);
    return value === 'Running' || value === '1';
  }

  private async sendStreaming(message: string): Promise<void> {
    const streamMsg: AiChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
      agentDisplayName: this.agentName(),
    };
    this.messages.update((msgs) => [...msgs, streamMsg]);
    const msgIndex = this.messages().length - 1;

    try {
      for await (const chunk of this.agentService.streamWithFallback(message)) {
        if (chunk.type === 'status' && chunk.content) {
          this.liveTaskStatus.set(chunk.content);
          this.voice.setWorking(true);
        }
        if (chunk.type === 'tool') {
          if (chunk.toolName) this.liveToolName.set(chunk.toolName);
          if (chunk.content) this.liveTaskStatus.set(chunk.content);
          this.voice.setWorking(true);
        }
        if (chunk.type === 'workflow_step' && chunk.workflowStep) {
          this.upsertWorkflowStep(chunk.workflowStep);
          this.voice.setWorking(true);
        }
        if ((chunk.type === 'token' || chunk.type === 'delta') && chunk.content) {
          this.messages.update((msgs) => {
            const copy = [...msgs];
            copy[msgIndex] = { ...copy[msgIndex], content: copy[msgIndex].content + chunk.content };
            return copy;
          });
          this.scrollToBottom();
        }
        if (chunk.type === 'final' || chunk.type === 'done') {
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
          copy[msgIndex] = {
            ...copy[msgIndex],
            content: copy[msgIndex].content || 'Generation stopped.',
            streaming: false,
          };
          return copy;
        });
        return;
      }
      try {
        const response = await firstValueFrom(this.agentService.chat(message));
        this.applyFinalResponse(this.agentService.normalizeResponse(response), msgIndex);
      } catch (fallbackErr) {
        this.messages.update((msgs) => {
          const copy = [...msgs];
          copy[msgIndex] = {
            ...copy[msgIndex],
            content: this.formatError(fallbackErr),
            streaming: false,
          };
          return copy;
        });
      }
    } finally {
      this.loading.set(false);
      this.voice.setProcessing(false);
      this.liveTaskStatus.set(null);
      this.liveToolName.set(null);
      this.messages.update((msgs) =>
        msgs.map((msg, i) => (i === msgIndex && msg.streaming ? { ...msg, streaming: false } : msg)),
      );
    }
  }

  private applyFinalResponse(response: AgentChatResponse, msgIndex: number): void {
    if (response.sessionId) this.agentService.setSessionId(response.sessionId);
    if (response.agentDisplayName) this.agentName.set(response.agentDisplayName);
    if (response.workflowSteps?.length) this.workflowSteps.set([...response.workflowSteps]);

    this.messages.update((msgs) => {
      const copy = [...msgs];
      copy[msgIndex] = {
        ...copy[msgIndex],
        content: response.reply || copy[msgIndex].content,
        streaming: false,
        sources: response.sources,
        citations: response.citations ?? [],
        toolsUsed: response.toolsUsed,
        actionResult: response.actionResult,
        workflowSteps: response.workflowSteps ?? [],
        agentDisplayName: response.agentDisplayName,
      };
      return copy;
    });

    if (response.suggestions?.length) {
      this.suggestions.set(response.suggestions);
    } else if (this.showSuggestions()) {
      this.suggestions.set([]);
    }
    this.quickActions.set(response.quickActions ?? []);
    this.searchResults.set(response.searchResults ?? []);

    const speakText = (response.spokenReply || response.reply || '').trim();
    if (speakText) this.voice.speak(speakText);

    const navRoute = response.actionResult
      ? this.aiActionService.shouldNavigate(response.actionResult)
      : null;
    if (navRoute) this.navigate.emit(navRoute);
  }

  private upsertWorkflowStep(step: AgentWorkflowStep): void {
    this.workflowSteps.update((steps) => {
      const copy = [...steps];
      const idx = copy.findIndex((s) => s.stepKey === step.stepKey);
      if (idx >= 0) copy[idx] = { ...copy[idx], ...step };
      else copy.push(step);
      return copy.sort((a, b) => a.sortOrder - b.sortOrder);
    });
  }

  runSearch(): void {
    const query = this.searchText().trim();
    if (!query || this.loading()) return;
    this.sendMessage(`Search for: ${query}`);
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
    this.voice.stopListening();
    this.voice.stopSpeaking();
    this.close.emit();
  }

  private appendMessage(
    role: 'user' | 'assistant',
    content: string,
    extras?: Partial<AiChatMessage>,
  ): void {
    this.messages.update((msgs) => [
      ...msgs,
      { role, content, timestamp: new Date(), agentDisplayName: this.agentName(), ...extras },
    ]);
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private scrollToBottom(): void {
    const el = this.messagesContainer()?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private formatError(err: unknown): string {
    if (err instanceof AiStreamError) return err.message;
    if (err && typeof err === 'object' && 'detail' in err) {
      return String((err as ApiError).detail || (err as ApiError).title || 'Request failed.');
    }
    return 'Sorry, I could not reach Sophia right now. Please try again.';
  }
}
