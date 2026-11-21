import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, filter, forkJoin, interval, startWith, switchMap } from 'rxjs';
import { AiChatService } from '../../core/services/ai-chat.service';
import { NalvaService } from '../../core/services/nalva.service';
import { SophiaVoiceService } from '../../core/services/sophia-voice.service';
import { TokenService } from '../../core/services/token.service';
import { PermissionCodes } from '../../core/constants/permission.constants';
import { ROUTES } from '../../core/constants/route.constants';
import { AiConversationMessage, AiConversationSession } from '../../core/models/ai.model';
import { NalvaAgentCard, NalvaApproval, NalvaExecution, NalvaTask } from '../../core/models/nalva.model';

type SpeechCtor = new () => {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type CenterMode = 'assign' | 'chat';
type AssignMethod = 'ceo' | 'manual';
type WizardStep = 1 | 2 | 3 | 4;

const GUIDANCE_STORAGE_KEY = 'businessos.commandCenter.guidanceDismissed';

export const COMMAND_OBJECTIVE_EXAMPLES = [
  'Analyze my business performance.',
  'Find new customers.',
  'Increase monthly sales.',
  'Identify low-stock products.',
  'Prepare a financial report.',
  'Create a marketing campaign.',
  'Review overdue invoices.',
] as const;

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './command-center.component.html',
  styleUrls: ['./experience.scss', './command-center.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandCenterComponent implements OnInit, OnDestroy {
  private readonly chat = inject(AiChatService);
  private readonly nalva = inject(NalvaService);
  private readonly voice = inject(SophiaVoiceService);
  private readonly token = inject(TokenService);
  private poll?: Subscription;
  private sendSub?: Subscription;
  private recognition: { stop: () => void } | null = null;

  readonly routes = ROUTES;
  readonly canManage = this.token.hasAnyPermission([PermissionCodes.nalva.manage]);
  readonly canApprove = this.token.hasAnyPermission([PermissionCodes.nalva.approve]);
  readonly objectiveExamples = COMMAND_OBJECTIVE_EXAMPLES;

  readonly sessions = signal<AiConversationSession[]>([]);
  readonly messages = signal<AiConversationMessage[]>([]);
  readonly selectedSessionId = signal<string | null>(null);
  readonly draft = signal('');
  readonly agents = signal<NalvaAgentCard[]>([]);
  readonly selectedAgents = signal<string[]>([]);
  readonly tasks = signal<NalvaTask[]>([]);
  readonly approvals = signal<NalvaApproval[]>([]);
  readonly executions = signal<NalvaExecution[]>([]);
  readonly selectedExecution = signal<NalvaExecution | null>(null);
  readonly deadline = signal('');
  readonly status = signal('Ready');
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly voiceNote = signal<string | null>(null);
  readonly transcript = signal('');
  readonly leftOpen = signal(true);
  readonly rightOpen = signal(true);
  readonly voices = this.voice.voices;
  readonly selectedVoice = this.voice.selectedVoice;
  readonly lastPolledAt = signal<string | null>(null);

  readonly centerMode = signal<CenterMode>('assign');
  readonly assignMethod = signal<AssignMethod>('ceo');
  readonly wizardStep = signal<WizardStep>(1);
  readonly assigning = signal(false);
  readonly lastAssignedTaskIds = signal<string[]>([]);
  readonly showGuidance = signal(this.readGuidancePreference());
  readonly panelView = signal<'tasks' | 'approvals' | 'executions'>('tasks');

  readonly ceoAgent = computed(() => this.agents().find((agent) => agent.key === 'ceo') ?? null);
  readonly ceoAvailable = computed(() => {
    const ceo = this.ceoAgent();
    return !!ceo && ceo.status === 'Active';
  });
  readonly selectedAgentCards = computed(() => {
    const byKey = new Map(this.agents().map((agent) => [agent.key, agent]));
    return this.selectedAgents()
      .map((key) => byKey.get(key))
      .filter((agent): agent is NalvaAgentCard => !!agent);
  });
  readonly assignmentTargets = computed(() => {
    if (this.assignMethod() === 'ceo') {
      const ceo = this.ceoAgent();
      return ceo ? [ceo] : [];
    }
    return this.selectedAgentCards();
  });
  readonly assignmentTargetNames = computed(() =>
    this.assignmentTargets().map((agent) => agent.name).join(', '));
  readonly canAdvanceFromObjective = computed(() => this.draft().trim().length >= 8);
  readonly canAdvanceFromWorkforce = computed(() => {
    if (this.assignMethod() === 'ceo') return this.ceoAvailable();
    return this.selectedAgents().length > 0;
  });
  readonly canAssign = computed(() =>
    this.canManage
    && this.canAdvanceFromObjective()
    && this.canAdvanceFromWorkforce()
    && !this.assigning());

  readonly taskLifecycle = computed(() => {
    const rows = this.tasks();
    const count = (...statuses: string[]) => rows.filter((task) => statuses.includes(task.status)).length;
    return {
      received: rows.length,
      assigned: rows.filter((task) => !!task.agentKey).length,
      queued: count('Queued', 'Pending'),
      inProgress: count('Running'),
      awaitingApproval: count('AwaitingApproval'),
      completed: count('Completed'),
      failed: count('Failed', 'DeadLetter'),
      paused: count('Paused'),
      cancelled: count('Cancelled'),
    };
  });

  readonly focusedTasks = computed(() => {
    const ids = new Set(this.lastAssignedTaskIds());
    if (!ids.size) return this.rootTasks();
    const matched = this.tasks().filter((task) => ids.has(task.id) || (task.parentTaskId && ids.has(task.parentTaskId)));
    if (!matched.length) return this.rootTasks();
    const matchedIds = new Set(matched.map((task) => task.id));
    return matched.filter((task) => !task.parentTaskId || !matchedIds.has(task.parentTaskId));
  });

  ngOnInit(): void {
    void this.voice.loadPreferences();
    this.selectedSessionId.set(this.chat.getSessionId());
    this.chat.listConversations().subscribe({
      next: (rows) => this.sessions.set(rows ?? []),
      error: () => this.sessions.set([]),
    });
    this.poll = interval(8000).pipe(
      startWith(0),
      filter(() => typeof document === 'undefined' || document.visibilityState !== 'hidden'),
      switchMap(() => forkJoin({
        agents: this.nalva.myAgents(),
        tasks: this.nalva.tasks(),
        approvals: this.nalva.approvals('Pending'),
        executions: this.nalva.executions(),
      })),
    ).subscribe({
      next: (data) => {
        this.agents.set(data.agents ?? []);
        this.tasks.set(data.tasks ?? []);
        this.approvals.set(data.approvals ?? []);
        this.executions.set(data.executions ?? []);
        this.lastPolledAt.set(new Date().toISOString());
        this.error.update((current) => current === 'The AI workforce could not be refreshed.' ? null : current);
        this.ensureCeoSelectionDefault();
      },
      error: () => this.error.set('The AI workforce could not be refreshed.'),
    });
  }

  ngOnDestroy(): void {
    this.poll?.unsubscribe();
    this.sendSub?.unsubscribe();
    this.recognition?.stop();
    this.voice.stopSpeaking();
  }

  setCenterMode(mode: CenterMode): void {
    this.centerMode.set(mode);
    this.error.set(null);
    this.notice.set(null);
  }

  setAssignMethod(method: AssignMethod): void {
    this.assignMethod.set(method);
    if (method === 'ceo') {
      const ceo = this.ceoAgent();
      this.selectedAgents.set(ceo ? ['ceo'] : []);
    }
  }

  goToStep(step: WizardStep): void {
    if (step === 1) {
      this.wizardStep.set(1);
      return;
    }
    if (step >= 2 && !this.canAdvanceFromObjective()) {
      this.error.set('Describe what you want to accomplish in a short sentence first.');
      return;
    }
    if (step >= 3 && !this.canAdvanceFromWorkforce()) {
      this.error.set(this.assignMethod() === 'ceo'
        ? 'Activate the AI CEO agent before using CEO delegation.'
        : 'Select at least one agent for manual assignment.');
      return;
    }
    this.error.set(null);
    this.wizardStep.set(step);
  }

  nextStep(): void {
    const step = this.wizardStep();
    if (step < 4) this.goToStep((step + 1) as WizardStep);
  }

  previousStep(): void {
    const step = this.wizardStep();
    if (step > 1) this.wizardStep.set((step - 1) as WizardStep);
  }

  useExample(example: string): void {
    this.draft.set(example);
    this.centerMode.set('assign');
    if (this.wizardStep() === 1) this.wizardStep.set(1);
  }

  dismissGuidance(): void {
    this.showGuidance.set(false);
    try {
      localStorage.setItem(GUIDANCE_STORAGE_KEY, '1');
    } catch {
      /* ignore private-mode storage failures */
    }
  }

  openSession(session: AiConversationSession): void {
    this.centerMode.set('chat');
    this.selectedSessionId.set(session.id);
    this.chat.setSessionId(session.id);
    this.chat.getConversation(session.id).subscribe({
      next: (rows) => this.messages.set(rows ?? []),
      error: () => this.error.set('That conversation could not be opened.'),
    });
  }

  newConversation(): void {
    this.chat.clearSession();
    this.selectedSessionId.set(null);
    this.messages.set([]);
    this.status.set('New conversation');
    this.centerMode.set('chat');
  }

  toggleAgent(key: string): void {
    if (!this.canManage) return;
    if (this.assignMethod() === 'ceo' && key !== 'ceo') {
      this.setAssignMethod('manual');
    }
    this.selectedAgents.update((keys) =>
      keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key]);
  }

  isAgentSelected(key: string): boolean {
    if (this.assignMethod() === 'ceo') return key === 'ceo';
    return this.selectedAgents().includes(key);
  }

  send(): void {
    const text = this.draft().trim();
    if (!text) return;

    if (this.centerMode() === 'assign' && this.canManage) {
      this.assignObjective();
      return;
    }

    this.draft.set('');
    this.transcript.set(text);
    this.status.set('Thinking');
    this.sendSub?.unsubscribe();
    this.sendSub = this.chat.chat(text).subscribe({
      next: (response) => {
        const sessionId = this.chat.resolveSessionId(response);
        if (sessionId) {
          this.chat.setSessionId(sessionId);
          this.selectedSessionId.set(sessionId);
        }
        this.messages.update((rows) => [...rows, {
          id: crypto.randomUUID(),
          prompt: text,
          response: response.reply,
          toolsUsed: response.toolsUsed ?? [],
          citations: response.citations ?? [],
          createdAt: new Date().toISOString(),
        }]);
        this.status.set(response.toolsUsed?.length ? `Tools used: ${response.toolsUsed.join(', ')}` : 'Ready');
        if (response.reply) this.voice.speak(response.reply);
        this.refreshSessions();
      },
      error: () => {
        this.status.set('Ready');
        this.error.set('The assistant could not answer. Nothing was executed.');
      },
    });
  }

  assignObjective(): void {
    if (!this.canAssign()) {
      if (!this.canManage) {
        this.error.set('You need AI workforce manage permission to assign objectives.');
        return;
      }
      this.goToStep(this.canAdvanceFromObjective() ? 2 : 1);
      return;
    }

    const text = this.draft().trim();
    const targets = this.assignmentTargets().map((agent) => agent.key);
    if (!targets.length) {
      this.error.set('No active agents are available for this assignment method.');
      return;
    }

    this.assigning.set(true);
    this.error.set(null);
    this.notice.set(null);
    this.assign(text, targets);
  }

  stopSpeech(): void {
    this.voice.stopSpeaking();
  }

  stop(): void {
    this.sendSub?.unsubscribe();
    this.chat.stopGeneration();
    this.voice.stopSpeaking();
    this.recognition?.stop();
    this.status.set('Stopped');
    this.assigning.set(false);
  }

  assign(text: string, agents: string[]): void {
    const deadline = this.deadline() ? new Date(this.deadline()).toISOString() : undefined;
    this.status.set('Queuing');
    const [first, ...rest] = agents;
    this.nalva.enqueue(first, text, { deadline }).subscribe({
      next: (parent) => {
        const createdIds = [parent.id];
        if (!rest.length) {
          this.finishAssign(parent, createdIds, text);
          return;
        }
        let remaining = rest.length;
        rest.forEach((key) => this.nalva.enqueue(key, text, { deadline, parentTaskId: parent.id }).subscribe({
          next: (child) => {
            createdIds.push(child.id);
            remaining -= 1;
            if (remaining === 0) this.finishAssign(parent, createdIds, text);
          },
          error: () => {
            remaining -= 1;
            this.error.set('One agent could not accept the task.');
            if (remaining === 0) this.finishAssign(parent, createdIds, text);
          },
        }));
      },
      error: () => {
        this.assigning.set(false);
        this.status.set('Ready');
        this.error.set('The agent could not accept that task. It may be inactive or outside your permissions.');
      },
    });
  }

  control(task: NalvaTask, action: 'pause' | 'resume' | 'cancel' | 'retry'): void {
    const call = {
      pause: this.nalva.pauseTask(task.id),
      resume: this.nalva.resumeTask(task.id),
      cancel: this.nalva.cancelTask(task.id),
      retry: this.nalva.retryTask(task.id),
    }[action];
    call.subscribe({
      next: (updated) => this.tasks.update((rows) => rows.map((row) => row.id === updated.id ? updated : row)),
      error: () => this.error.set('That task control is not available in the current state.'),
    });
  }

  decide(approval: NalvaApproval, decision: 'approve' | 'reject'): void {
    const note = window.prompt(decision === 'approve' ? 'Approval note' : 'Rejection note') ?? '';
    this.nalva.decide(approval.id, decision, note).subscribe({
      next: () => {
        this.approvals.update((rows) => rows.filter((row) => row.id !== approval.id));
        this.notice.set(decision === 'approve' ? 'Approval recorded.' : 'Rejection recorded.');
        this.panelView.set('approvals');
      },
      error: () => this.error.set('The approval could not be recorded.'),
    });
  }

  listen(): void {
    const speech = window as Window & { SpeechRecognition?: SpeechCtor; webkitSpeechRecognition?: SpeechCtor };
    const Ctor = speech.SpeechRecognition ?? speech.webkitSpeechRecognition;
    if (!Ctor) {
      this.voiceNote.set('Voice input is not available in this browser. Type the command instead.');
      return;
    }
    const recognition = new Ctor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? '';
      this.transcript.set(text);
      this.draft.set(text);
    };
    recognition.onerror = () => this.voiceNote.set('The microphone could not be used.');
    this.recognition = recognition;
    recognition.start();
    this.status.set('Listening');
  }

  chooseVoice(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.voice.selectedVoice.set(value);
  }

  childTasks(parentId: string): NalvaTask[] {
    return this.tasks().filter((task) => task.parentTaskId === parentId);
  }

  rootTasks(): NalvaTask[] {
    const ids = new Set(this.tasks().map((task) => task.id));
    return this.tasks().filter((task) => !task.parentTaskId || !ids.has(task.parentTaskId));
  }

  agentName(key: string): string {
    return this.agents().find((agent) => agent.key === key)?.name ?? key;
  }

  agentBlurb(agent: NalvaAgentCard): string {
    if (agent.responsibilities?.length) return agent.responsibilities[0];
    return agent.description || agent.role;
  }

  relativeTime(value?: string | null): string {
    if (!value) return '';
    const then = new Date(value).getTime();
    if (Number.isNaN(then)) return '';
    const deltaSec = Math.round((Date.now() - then) / 1000);
    if (deltaSec < 60) return 'just now';
    if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)}m ago`;
    if (deltaSec < 86400) return `${Math.floor(deltaSec / 3600)}h ago`;
    if (deltaSec < 604800) return `${Math.floor(deltaSec / 86400)}d ago`;
    return new Date(value).toLocaleDateString();
  }

  statusTone(status: string): string {
    switch (status) {
      case 'Completed': return 'ok';
      case 'Running': return 'run';
      case 'AwaitingApproval': return 'wait';
      case 'Failed':
      case 'DeadLetter': return 'bad';
      case 'Paused':
      case 'Cancelled': return 'mute';
      default: return 'queued';
    }
  }

  overallObjectiveStatus(): string {
    const life = this.taskLifecycle();
    if (!life.received) return 'No objectives yet';
    if (life.awaitingApproval) return 'Waiting for your approval';
    if (life.inProgress || life.queued) return 'In progress';
    if (life.failed && !life.completed) return 'Needs attention';
    if (life.completed && !life.inProgress && !life.queued && !life.awaitingApproval) return 'Completed';
    return 'Mixed status';
  }

  private finishAssign(parent: NalvaTask, createdIds: string[], text: string): void {
    this.tasks.update((rows) => {
      const without = rows.filter((row) => !createdIds.includes(row.id));
      return [parent, ...without];
    });
    this.lastAssignedTaskIds.set(createdIds);
    this.assigning.set(false);
    this.panelView.set('tasks');
    this.wizardStep.set(1);
    this.draft.set('');
    this.transcript.set(text);
    const method = this.assignMethod();
    this.status.set(method === 'ceo'
      ? 'Queued for AI CEO — the CEO may create follow-up tasks for other agents while running'
      : createdIds.length > 1
        ? 'Queued for the selected agents'
        : `Queued for ${parent.agentKey}`);
    this.notice.set(method === 'ceo'
      ? 'Objective received by AI CEO. Watch Tasks for progress, Approvals for sensitive actions, and Reports for completed summaries.'
      : 'Objective assigned. Task statuses below update from the live workforce APIs.');
  }

  private ensureCeoSelectionDefault(): void {
    if (this.assignMethod() !== 'ceo') return;
    if (this.ceoAvailable() && !this.selectedAgents().includes('ceo')) {
      this.selectedAgents.set(['ceo']);
    }
  }

  private refreshSessions(): void {
    this.chat.listConversations().subscribe({
      next: (rows) => this.sessions.set(rows ?? []),
      error: () => undefined,
    });
  }

  private readGuidancePreference(): boolean {
    try {
      return localStorage.getItem(GUIDANCE_STORAGE_KEY) !== '1';
    } catch {
      return true;
    }
  }
}
