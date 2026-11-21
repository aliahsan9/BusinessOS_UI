import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NalvaAutomationComponent } from './automation.component';
import { NalvaService } from '../../core/services/nalva.service';
import {
  NalvaAgentCard,
  NalvaApprovalPolicy,
  NalvaAutomationDashboard,
  NalvaReliabilitySnapshot,
  NalvaSchedule,
} from '../../core/models/nalva.model';

describe('NalvaAutomationComponent', () => {
  let fixture: ComponentFixture<NalvaAutomationComponent>;
  let component: NalvaAutomationComponent;
  let api: jasmine.SpyObj<NalvaService>;

  const agent: NalvaAgentCard = {
    key: 'sales',
    name: 'Sales',
    description: 'Sales agent',
    role: 'Sales',
    category: 'Sales',
    status: 'Active',
    health: 'Healthy',
    isCustom: false,
    isCore: true,
    autonomyLevel: 2,
    responsibilities: [],
    executions: 0,
    tokens: 0,
    estimatedCostUsd: 0,
  };

  const dashboard: NalvaAutomationDashboard = {
    activeAutomations: 1,
    pausedSchedules: 0,
    scheduledAutomations: 1,
    eventAutomations: 0,
    runningExecutions: 0,
    completedToday: 0,
    failedToday: 0,
    pendingApprovals: 2,
    expiredApprovals: 0,
    deadLetterTasks: 1,
    agentActivity: [],
    upcomingSchedules: [],
    recentFailures: [],
  };

  const reliability: NalvaReliabilitySnapshot = {
    queuedTasks: 0,
    runningTasks: 0,
    deadLetterTasks: 1,
    failedTasks: 0,
    pendingApprovals: 2,
    expiredApprovals: 0,
    pendingEvents: 0,
    deadLetterEvents: 0,
    stuckRunningTasks: 0,
    stuckRunningExecutions: 0,
    stuckRunningEvents: 0,
    failedWorkflowRunsToday: 0,
    generatedAtUtc: new Date().toISOString(),
  };

  const policy: NalvaApprovalPolicy = {
    approvalExpiryDays: 7,
    notifyPendingApprovals: true,
    autoExpireApprovals: true,
    requireApprovalForExternalActions: true,
    extraApprovalTools: [],
    catalogApprovalTools: [],
  };

  const schedule: NalvaSchedule = {
    id: 'sch-1',
    key: 'daily-pipeline',
    name: 'Daily pipeline',
    description: '',
    recurrenceKind: 'Daily',
    timeZoneId: 'UTC',
    isActive: true,
    isPaused: false,
    isCancelled: false,
    maxConcurrentRuns: 1,
    consecutiveFailures: 0,
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj('NalvaService', [
      'myAgents',
      'automationDashboard',
      'reliability',
      'automationSchedules',
      'automationRules',
      'automationHistory',
      'automationFailed',
      'automationAgentActivity',
      'approvals',
      'approvalPolicy',
      'saveSchedule',
    ]);

    api.myAgents.and.returnValue(of([agent]));
    api.automationDashboard.and.returnValue(of(dashboard));
    api.reliability.and.returnValue(of(reliability));
    api.automationSchedules.and.returnValue(of([]));
    api.automationRules.and.returnValue(of([]));
    api.automationHistory.and.returnValue(of([]));
    api.automationFailed.and.returnValue(of([]));
    api.automationAgentActivity.and.returnValue(of([]));
    api.approvals.and.returnValue(of([]));
    api.approvalPolicy.and.returnValue(of(policy));

    await TestBed.configureTestingModule({
      imports: [NalvaAutomationComponent],
      providers: [
        provideRouter([]),
        { provide: NalvaService, useValue: api },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NalvaAutomationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the automation dashboard and related panels', () => {
    expect(api.automationDashboard).toHaveBeenCalled();
    expect(component.dashboard()?.pendingApprovals).toBe(2);
    expect(component.loading()).toBeFalse();
    expect(component.agents()[0].key).toBe('sales');
  });

  it('records dashboard load errors', () => {
    api.automationDashboard.and.returnValue(throwError(() => ({
      detail: 'Automation offline',
      title: 'Error',
    })));
    component.load();
    expect(component.error()).toBe('Automation offline');
    expect(component.loading()).toBeFalse();
  });

  it('creates a schedule when required fields are present', () => {
    api.saveSchedule.and.returnValue(of(schedule));
    component.scheduleName.set('Daily pipeline');
    component.scheduleAgentKey.set('sales');
    component.scheduleObjective.set('Check pipeline');
    component.createSchedule();

    expect(api.saveSchedule).toHaveBeenCalled();
    expect(component.notice()).toContain('Daily pipeline');
    expect(component.saving()).toBeFalse();
  });

  it('does not create a schedule when the name is blank', () => {
    component.scheduleName.set('   ');
    component.scheduleAgentKey.set('sales');
    component.scheduleObjective.set('Check pipeline');
    component.createSchedule();
    expect(api.saveSchedule).not.toHaveBeenCalled();
  });
});
