import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, forkJoin, interval, startWith, switchMap } from 'rxjs';
import { AiChatService } from '../../core/services/ai-chat.service';
import { NalvaService } from '../../core/services/nalva.service';
import { SophiaVoiceService } from '../../core/services/sophia-voice.service';
import { TokenService } from '../../core/services/token.service';
import { PermissionCodes } from '../../core/constants/permission.constants';
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

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './command-center.component.html',
  styleUrl: './experience.scss',
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

  readonly canManage = this.token.hasAnyPermission([PermissionCodes.nalva.manage]);
  readonly canApprove = this.token.hasAnyPermission([PermissionCodes.nalva.approve]);
  readonly sessions = signal<AiConversationSession[]>([]);
  readonly messages = signal<AiConversationMessage[]>([]);
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
  readonly voiceNote = signal<string | null>(null);
  readonly transcript = signal('');
  readonly leftOpen = signal(true);
  readonly rightOpen = signal(true);
  readonly voices = this.voice.voices;
  readonly selectedVoice = this.voice.selectedVoice;

  ngOnInit(): void {
    void this.voice.loadPreferences();
    this.chat.listConversations().subscribe({
      next: (rows) => this.sessions.set(rows ?? []),
      error: () => this.sessions.set([]),
    });
    this.poll = interval(8000).pipe(
      startWith(0),
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

  openSession(session: AiConversationSession): void {
    this.chat.setSessionId(session.id);
    this.chat.getConversation(session.id).subscribe({
      next: (rows) => this.messages.set(rows ?? []),
      error: () => this.error.set('That conversation could not be opened.'),
    });
  }

  newConversation(): void {
    this.chat.clearSession();
    this.messages.set([]);
    this.status.set('New conversation');
  }

  toggleAgent(key: string): void {
    this.selectedAgents.update((keys) => keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key]);
  }

  send(): void {
    const text = this.draft().trim();
    if (!text) return;
    this.draft.set('');
    this.transcript.set(text);
    const agents = this.selectedAgents();
    if (agents.length && this.canManage) {
      this.assign(text, agents);
      return;
    }
    this.status.set('Thinking');
    this.sendSub?.unsubscribe();
    this.sendSub = this.chat.chat(text).subscribe({
      next: (response) => {
        const sessionId = this.chat.resolveSessionId(response);
        if (sessionId) this.chat.setSessionId(sessionId);
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
      },
      error: () => {
        this.status.set('Ready');
        this.error.set('The assistant could not answer. Nothing was executed.');
      },
    });
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
  }

  assign(text: string, agents: string[]): void {
    const deadline = this.deadline() ? new Date(this.deadline()).toISOString() : undefined;
    this.status.set('Queuing');
    const [first, ...rest] = agents;
    this.nalva.enqueue(first, text, { deadline }).subscribe({
      next: (parent) => {
        rest.forEach((key) => this.nalva.enqueue(key, text, { deadline, parentTaskId: parent.id }).subscribe({ error: () => this.error.set('One agent could not accept the task.') }));
        this.tasks.update((rows) => [parent, ...rows]);
        this.status.set(rest.length ? 'Queued for the selected agents' : `Queued for ${parent.agentKey}`);
      },
      error: () => {
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
      next: () => this.approvals.update((rows) => rows.filter((row) => row.id !== approval.id)),
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
}
