import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NalvaService } from '../../core/services/nalva.service';
import {
  NalvaAgentActivity,
  NalvaAgentCard,
  NalvaApproval,
  NalvaApprovalPolicy,
  NalvaAutomationDashboard,
  NalvaAutomationRule,
  NalvaFailedAutomation,
  NalvaReliabilitySnapshot,
  NalvaSchedule,
  NalvaWorkflowRun,
} from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';
import { ROUTES } from '../../core/constants/route.constants';

type AutomationTab = 'dashboard' | 'schedules' | 'rules' | 'history' | 'failed' | 'approvals' | 'policy' | 'agents';

@Component({
  selector: 'app-nalva-automation',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink],
  templateUrl: './automation.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaAutomationComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly routes = ROUTES;

  readonly tab = signal<AutomationTab>('dashboard');
  readonly dashboard = signal<NalvaAutomationDashboard | null>(null);
  readonly reliability = signal<NalvaReliabilitySnapshot | null>(null);
  readonly schedules = signal<NalvaSchedule[]>([]);
  readonly rules = signal<NalvaAutomationRule[]>([]);
  readonly history = signal<NalvaWorkflowRun[]>([]);
  readonly failures = signal<NalvaFailedAutomation[]>([]);
  readonly activity = signal<NalvaAgentActivity[]>([]);
  readonly approvals = signal<NalvaApproval[]>([]);
  readonly policy = signal<NalvaApprovalPolicy | null>(null);
  readonly agents = signal<NalvaAgentCard[]>([]);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly actingId = signal<string | null>(null);

  readonly scheduleName = signal('');
  readonly scheduleDescription = signal('');
  readonly recurrenceKind = signal('Daily');
  readonly localTime = signal('09:00');
  readonly timeZoneId = signal('UTC');
  readonly daysOfWeek = signal('Mon,Tue,Wed,Thu,Fri');
  readonly dayOfMonth = signal(1);
  readonly intervalMinutes = signal(1440);
  readonly scheduleAgentKey = signal('');
  readonly scheduleObjective = signal('');

  readonly ruleName = signal('');
  readonly ruleDescription = signal('');
  readonly ruleTrigger = signal('Event');
  readonly ruleEvent = signal('LeadCreated');
  readonly ruleCondition = signal('');
  readonly ruleAgentKey = signal('');
  readonly ruleObjective = signal('');

  ngOnInit(): void {
    this.api.myAgents().subscribe({
      next: (rows) => {
        this.agents.set(rows);
        if (!this.scheduleAgentKey() && rows.length) this.scheduleAgentKey.set(rows[0].key);
        if (!this.ruleAgentKey() && rows.length) this.ruleAgentKey.set(rows[0].key);
      },
      error: () => undefined,
    });
    this.load();
  }

  setTab(tab: AutomationTab): void {
    this.tab.set(tab);
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.automationDashboard().subscribe({
      next: (row) => {
        this.dashboard.set(row);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Automation dashboard could not be loaded.');
        this.loading.set(false);
      },
    });
    this.api.reliability().subscribe({
      next: (row) => this.reliability.set(row),
      error: () => undefined,
    });
    this.api.automationSchedules().subscribe({
      next: (rows) => this.schedules.set(rows),
      error: () => undefined,
    });
    this.api.automationRules().subscribe({
      next: (rows) => this.rules.set(rows),
      error: () => undefined,
    });
    this.api.automationHistory().subscribe({
      next: (rows) => this.history.set(rows),
      error: () => undefined,
    });
    this.api.automationFailed().subscribe({
      next: (rows) => this.failures.set(rows),
      error: () => undefined,
    });
    this.api.automationAgentActivity().subscribe({
      next: (rows) => this.activity.set(rows),
      error: () => undefined,
    });
    this.api.approvals('Pending').subscribe({
      next: (rows) => this.approvals.set(rows),
      error: () => undefined,
    });
    this.api.approvalPolicy().subscribe({
      next: (row) => this.policy.set(row),
      error: () => undefined,
    });
  }

  createSchedule(): void {
    const name = this.scheduleName().trim();
    const agentKey = this.scheduleAgentKey().trim();
    const objective = this.scheduleObjective().trim();
    if (!name || !agentKey || !objective || this.saving()) return;

    this.saving.set(true);
    this.error.set(null);
    this.api.saveSchedule({
      name,
      description: this.scheduleDescription().trim(),
      recurrenceKind: this.recurrenceKind(),
      intervalMinutes: this.recurrenceKind() === 'Interval' ? this.intervalMinutes() : null,
      timeZoneId: this.timeZoneId().trim() || 'UTC',
      localTimeOfDay: this.localTime().trim() || '09:00',
      daysOfWeek: this.recurrenceKind() === 'Weekly' || this.recurrenceKind() === 'Custom' ? this.daysOfWeek() : null,
      dayOfMonth: this.recurrenceKind() === 'Monthly' ? this.dayOfMonth() : null,
      activate: true,
      steps: [{ key: 'step-1', agentKey, objective, tools: [] }],
    }).subscribe({
      next: (created) => {
        this.schedules.update((rows) => [created, ...rows]);
        this.scheduleName.set('');
        this.scheduleObjective.set('');
        this.notice.set(`Schedule "${created.name}" saved.`);
        this.saving.set(false);
        this.tab.set('schedules');
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Schedule was not saved.');
        this.saving.set(false);
      },
    });
  }

  createRule(): void {
    const name = this.ruleName().trim();
    const agentKey = this.ruleAgentKey().trim();
    const objective = this.ruleObjective().trim();
    if (!name || !agentKey || !objective || this.saving()) return;

    this.saving.set(true);
    this.api.saveAutomationRule({
      name,
      description: this.ruleDescription().trim(),
      triggerKind: this.ruleTrigger(),
      triggerEvent: this.ruleTrigger() === 'Event' ? this.ruleEvent() : null,
      condition: this.ruleCondition().trim() || null,
      enable: true,
      steps: [{ key: 'step-1', agentKey, objective, tools: [] }],
    }).subscribe({
      next: (created) => {
        this.rules.update((rows) => [created, ...rows]);
        this.ruleName.set('');
        this.ruleObjective.set('');
        this.notice.set(`Automation "${created.name}" saved.`);
        this.saving.set(false);
        this.tab.set('rules');
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Automation rule was not saved.');
        this.saving.set(false);
      },
    });
  }

  pause(row: NalvaSchedule): void {
    this.act(row.id, this.api.pauseSchedule(row.id), 'paused');
  }

  resume(row: NalvaSchedule): void {
    this.act(row.id, this.api.resumeSchedule(row.id), 'resumed');
  }

  cancel(row: NalvaSchedule): void {
    this.act(row.id, this.api.cancelSchedule(row.id), 'cancelled');
  }

  enableRule(row: NalvaAutomationRule, enabled: boolean): void {
    if (this.actingId()) return;
    this.actingId.set(row.id);
    this.api.setRuleEnabled(row.id, enabled).subscribe({
      next: (updated) => {
        this.rules.update((rows) => rows.map((item) => item.id === updated.id ? updated : item));
        this.notice.set(`Rule "${updated.name}" ${enabled ? 'enabled' : 'disabled'}.`);
        this.actingId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not update rule.');
        this.actingId.set(null);
      },
    });
  }

  savePolicy(): void {
    const current = this.policy();
    if (!current || this.saving()) return;
    this.saving.set(true);
    this.api.saveApprovalPolicy({
      approvalExpiryDays: current.approvalExpiryDays,
      notifyPendingApprovals: current.notifyPendingApprovals,
      autoExpireApprovals: current.autoExpireApprovals,
      requireApprovalForExternalActions: current.requireApprovalForExternalActions,
      extraApprovalTools: current.extraApprovalTools,
    }).subscribe({
      next: (saved) => {
        this.policy.set(saved);
        this.notice.set('Approval policy saved.');
        this.saving.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not save approval policy.');
        this.saving.set(false);
      },
    });
  }

  patchPolicy<K extends keyof NalvaApprovalPolicy>(key: K, value: NalvaApprovalPolicy[K]): void {
    const current = this.policy();
    if (!current) return;
    this.policy.set({ ...current, [key]: value });
  }

  private act(id: string, request: ReturnType<NalvaService['pauseSchedule']>, verb: string): void {
    if (this.actingId()) return;
    this.actingId.set(id);
    request.subscribe({
      next: (updated) => {
        this.schedules.update((rows) => rows.map((item) => item.id === updated.id ? updated : item));
        this.notice.set(`Schedule "${updated.name}" ${verb}.`);
        this.actingId.set(null);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || `Could not ${verb} schedule.`);
        this.actingId.set(null);
      },
    });
  }
}
