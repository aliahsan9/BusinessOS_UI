import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  COMMAND_OBJECTIVE_EXAMPLES,
  CommandCenterComponent,
} from './command-center.component';
import { AiChatService } from '../../core/services/ai-chat.service';
import { NalvaService } from '../../core/services/nalva.service';
import { SophiaVoiceService } from '../../core/services/sophia-voice.service';
import { TokenService } from '../../core/services/token.service';
import { NalvaAgentCard, NalvaTask } from '../../core/models/nalva.model';

describe('CommandCenterComponent', () => {
  let fixture: ComponentFixture<CommandCenterComponent>;
  let component: CommandCenterComponent;
  let nalva: jasmine.SpyObj<NalvaService>;
  let chat: jasmine.SpyObj<AiChatService>;
  let token: jasmine.SpyObj<TokenService>;

  const ceo: NalvaAgentCard = {
    key: 'ceo',
    name: 'AI CEO',
    description: 'Strategic planning & delegation',
    role: 'Chief operations agent',
    category: 'Executive Management',
    status: 'Active',
    health: 'Healthy',
    isCustom: false,
    isCore: true,
    autonomyLevel: 3,
    responsibilities: ['Strategic planning & delegation'],
    executions: 2,
    tokens: 10,
    estimatedCostUsd: 0.01,
  };

  const sales: NalvaAgentCard = {
    ...ceo,
    key: 'sales',
    name: 'AI Sales',
    description: 'Find leads & close deals',
    role: 'Sales agent',
    category: 'Sales',
    responsibilities: ['Find leads & close deals'],
  };

  const queuedTask = (partial: Partial<NalvaTask>): NalvaTask => ({
    id: partial.id ?? 'task-1',
    agentKey: partial.agentKey ?? 'ceo',
    objective: partial.objective ?? 'Analyze my business performance.',
    status: partial.status ?? 'Queued',
    priority: 3,
    runAfter: new Date().toISOString(),
    attempt: 0,
    createdAt: new Date().toISOString(),
    parentTaskId: partial.parentTaskId,
    deadline: partial.deadline,
    lastError: partial.lastError,
    completedExecutionId: partial.completedExecutionId,
  });

  beforeEach(async () => {
    nalva = jasmine.createSpyObj('NalvaService', [
      'myAgents',
      'tasks',
      'approvals',
      'executions',
      'enqueue',
      'pauseTask',
      'resumeTask',
      'cancelTask',
      'retryTask',
      'decide',
    ]);
    chat = jasmine.createSpyObj('AiChatService', [
      'listConversations',
      'getConversation',
      'setSessionId',
      'getSessionId',
      'clearSession',
      'chat',
      'resolveSessionId',
      'stopGeneration',
    ]);
    token = jasmine.createSpyObj('TokenService', ['hasAnyPermission']);
    token.hasAnyPermission.and.returnValue(true);

    nalva.myAgents.and.returnValue(of([ceo, sales]));
    nalva.tasks.and.returnValue(of([]));
    nalva.approvals.and.returnValue(of([]));
    nalva.executions.and.returnValue(of([]));
    chat.listConversations.and.returnValue(of([]));
    chat.getSessionId.and.returnValue(null);

    const voice = {
      voices: signal([{ id: 'coral', label: 'Coral' }]),
      selectedVoice: signal('coral'),
      loadPreferences: jasmine.createSpy('loadPreferences').and.resolveTo(undefined),
      speak: jasmine.createSpy('speak'),
      stopSpeaking: jasmine.createSpy('stopSpeaking'),
    };

    await TestBed.configureTestingModule({
      imports: [CommandCenterComponent],
      providers: [
        provideRouter([]),
        { provide: NalvaService, useValue: nalva },
        { provide: AiChatService, useValue: chat },
        { provide: TokenService, useValue: token },
        { provide: SophiaVoiceService, useValue: voice },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes first-time objective examples for business owners', () => {
    expect(COMMAND_OBJECTIVE_EXAMPLES).toContain('Analyze my business performance.');
    expect(COMMAND_OBJECTIVE_EXAMPLES).toContain('Review overdue invoices.');
    expect(fixture.nativeElement.textContent).toContain('Command Center');
    expect(fixture.nativeElement.textContent).toContain('Analyze my business performance.');
    component.draft.set('Analyze my business performance.');
    component.goToStep(2);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('AI CEO delegation');
  });

  it('defaults assign mode to AI CEO when the CEO agent is active', fakeAsync(() => {
    tick(0);
    fixture.detectChanges();
    expect(component.assignMethod()).toBe('ceo');
    expect(component.ceoAvailable()).toBeTrue();
    expect(component.selectedAgents()).toEqual(['ceo']);
  }));

  it('blocks workforce step until an objective is defined', () => {
    component.draft.set('short');
    component.goToStep(2);
    expect(component.wizardStep()).toBe(1);
    expect(component.error()).toContain('Describe what you want');
  });

  it('assigns a read-only analysis objective to AI CEO through enqueue', fakeAsync(() => {
    tick(0);
    const parent = queuedTask({ id: 'parent-1', agentKey: 'ceo', objective: 'Analyze my business performance.' });
    nalva.enqueue.and.returnValue(of(parent));

    component.draft.set('Analyze my business performance.');
    component.setAssignMethod('ceo');
    component.goToStep(4);
    component.assignObjective();
    tick();

    expect(nalva.enqueue).toHaveBeenCalledWith('ceo', 'Analyze my business performance.', jasmine.objectContaining({
      deadline: undefined,
    }));
    expect(component.lastAssignedTaskIds()).toEqual(['parent-1']);
    expect(component.notice()).toContain('Objective received by AI CEO');
    expect(component.assigning()).toBeFalse();
  }));

  it('manually assigns the same objective to multiple agents with parent/child linkage', fakeAsync(() => {
    tick(0);
    const parent = queuedTask({ id: 'p1', agentKey: 'sales' });
    const child = queuedTask({ id: 'c1', agentKey: 'ceo', parentTaskId: 'p1' });
    nalva.enqueue.and.returnValues(of(parent), of(child));

    component.setAssignMethod('manual');
    component.selectedAgents.set(['sales', 'ceo']);
    component.draft.set('Find new customers for this month.');
    component.assignObjective();
    tick();

    expect(nalva.enqueue.calls.count()).toBe(2);
    expect(nalva.enqueue.calls.argsFor(0)).toEqual(['sales', 'Find new customers for this month.', jasmine.any(Object)]);
    expect(nalva.enqueue.calls.argsFor(1)).toEqual([
      'ceo',
      'Find new customers for this month.',
      jasmine.objectContaining({ parentTaskId: 'p1' }),
    ]);
    expect(component.lastAssignedTaskIds()).toEqual(['p1', 'c1']);
  }));

  it('surfaces enqueue failures without inventing task progress', fakeAsync(() => {
    tick(0);
    nalva.enqueue.and.returnValue(throwError(() => ({ status: 403 })));
    component.draft.set('Prepare a financial report.');
    component.assignObjective();
    tick();

    expect(component.error()).toContain('could not accept that task');
    expect(component.taskLifecycle().received).toBe(0);
    expect(component.assigning()).toBeFalse();
  }));

  it('summarizes live task statuses for execution visibility', fakeAsync(() => {
    tick(0);
    component.tasks.set([
      queuedTask({ id: '1', status: 'Queued' }),
      queuedTask({ id: '2', status: 'Running' }),
      queuedTask({ id: '3', status: 'AwaitingApproval' }),
      queuedTask({ id: '4', status: 'Completed' }),
      queuedTask({ id: '5', status: 'Failed' }),
    ]);
    expect(component.taskLifecycle()).toEqual(jasmine.objectContaining({
      received: 5,
      queued: 1,
      inProgress: 1,
      awaitingApproval: 1,
      completed: 1,
      failed: 1,
    }));
    expect(component.overallObjectiveStatus()).toBe('Waiting for your approval');
  }));

  it('keeps chat mode separate from workforce assignment', fakeAsync(() => {
    tick(0);
    chat.chat.and.returnValue(of({
      reply: 'Here is a summary.',
      toolsUsed: [],
      citations: [],
      sessionId: 's1',
      suggestions: [],
      quickActions: [],
      searchResults: [],
      sources: { customers: 0, orders: 0, invoices: 0, projects: 0 },
    }));
    chat.resolveSessionId.and.returnValue('s1');
    chat.listConversations.and.returnValue(of([{
      id: 's1',
      title: 'Business analysis',
      lastActivityAt: new Date().toISOString(),
      messageCount: 1,
      lastMessagePreview: 'Here is a summary.',
    }]));

    component.setCenterMode('chat');
    component.draft.set('How are sales this week?');
    component.send();
    tick();

    expect(chat.chat).toHaveBeenCalled();
    expect(nalva.enqueue).not.toHaveBeenCalled();
    expect(component.messages().length).toBe(1);
  }));
});
