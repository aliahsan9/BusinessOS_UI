import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaAgentCard, NalvaWorkflow } from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-nalva-workflow-builder',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./nalva.shared.scss', './workflow-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaWorkflowBuilderComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly routes = ROUTES;

  readonly workflows = signal<NalvaWorkflow[]>([]);
  readonly agents = signal<NalvaAgentCard[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly actingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly name = signal('');
  readonly description = signal('');
  readonly triggerKind = signal('Manual');
  readonly recurrenceKind = signal('Daily');
  readonly intervalMinutes = signal(1440);
  readonly timeZoneId = signal('UTC');
  readonly localTimeOfDay = signal('09:00');
  readonly daysOfWeek = signal('1,2,3,4,5');
  readonly stepAgentKey = signal('');
  readonly stepObjective = signal('');

  ngOnInit(): void {
    this.api.myAgents().subscribe({
      next: (rows) => {
        this.agents.set(rows);
        if (!this.stepAgentKey() && rows.length) this.stepAgentKey.set(rows[0].key);
      },
      error: () => undefined,
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.workflows().subscribe({
      next: (rows) => {
        this.workflows.set(rows);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not load saved workflow definitions.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    const name = this.name().trim();
    const agentKey = this.stepAgentKey().trim();
    const objective = this.stepObjective().trim();
    if (!name || !agentKey || !objective || this.saving()) return;

    this.saving.set(true);
    this.error.set(null);
    this.notice.set(null);
    this.api.saveWorkflow({
      name,
      description: this.description().trim(),
      triggerKind: this.triggerKind(),
      recurrenceKind: this.recurrenceKind(),
      intervalMinutes: this.triggerKind() === 'Scheduled' ? this.intervalMinutes() : undefined,
      timeZoneId: this.timeZoneId().trim() || 'UTC',
      localTimeOfDay: this.localTimeOfDay().trim() || undefined,
      daysOfWeek: this.recurrenceKind() === 'Weekly' || this.recurrenceKind() === 'Custom'
        ? this.daysOfWeek().trim() || undefined
        : undefined,
      steps: [{
        key: 'step-1',
        agentKey,
        objective,
        tools: [],
      }],
    }).subscribe({
      next: (created) => {
        this.workflows.update((rows) => [created, ...rows]);
        this.name.set('');
        this.description.set('');
        this.stepObjective.set('');
        this.notice.set(`Workflow "${created.name}" was saved. It is not active until you activate it.`);
        this.saving.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.status === 403
          ? 'Your account does not have permission to save Navla workflows.'
          : err.detail || err.title || 'The workflow was not saved.');
        this.saving.set(false);
      },
    });
  }

  setActive(workflow: NalvaWorkflow, active: boolean): void {
    if (this.actingId()) return;
    this.actingId.set(workflow.id);
    this.error.set(null);
    this.notice.set(null);
    this.api.setWorkflowActive(workflow.id, active).subscribe({
      next: (updated) => {
        this.workflows.update((rows) => rows.map((row) => row.id === updated.id ? updated : row));
        this.notice.set(`Workflow "${updated.name}" is now ${updated.isActive ? 'active' : 'inactive'}.`);
        this.actingId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not change workflow activation.');
        this.actingId.set(null);
      },
    });
  }

  run(workflow: NalvaWorkflow, dryRun: boolean): void {
    if (this.actingId()) return;
    this.actingId.set(workflow.id);
    this.error.set(null);
    this.notice.set(null);
    const request = dryRun
      ? this.api.testWorkflow(workflow.id)
      : this.api.runWorkflow(workflow.id);
    request.subscribe({
      next: (run) => {
        this.notice.set(`${dryRun ? 'Dry-run' : 'Run'} started for "${workflow.name}". Status: ${run.status}.`);
        this.actingId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || `Could not ${dryRun ? 'test' : 'run'} this workflow.`);
        this.actingId.set(null);
      },
    });
  }
}
