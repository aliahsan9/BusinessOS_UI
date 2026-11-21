import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NalvaService } from '../../core/services/nalva.service';
import {
  NalvaObjectivePlan,
  NalvaWorkforceBoard,
  NalvaWorkflowDetail,
} from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-nalva-workforce',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, RouterLink],
  templateUrl: './workforce.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaWorkforceComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly routes = ROUTES;

  readonly board = signal<NalvaWorkforceBoard | null>(null);
  readonly plan = signal<NalvaObjectivePlan | null>(null);
  readonly detail = signal<NalvaWorkflowDetail | null>(null);
  objective = 'Prepare a weekly business performance report.';
  readonly loading = signal(true);
  readonly planning = signal(false);
  readonly starting = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.workforceBoard().subscribe({
      next: (board) => {
        this.board.set(board);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Workforce board could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  planObjective(): void {
    const text = this.objective.trim();
    if (!text || this.planning()) return;
    this.planning.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.planObjective(text).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.planning.set(false);
        this.notice.set(plan.canStart
          ? `Plan ready: ${plan.workflowName} (${Math.round(plan.confidence * 100)}% match).`
          : plan.blockReason || 'Clarify the objective before starting.');
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not plan that objective.');
        this.planning.set(false);
      },
    });
  }

  startObjective(): void {
    const text = this.objective.trim();
    if (!text || this.starting()) return;
    this.starting.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.startObjective(text).subscribe({
      next: (plan) => {
        this.plan.set(plan);
        this.starting.set(false);
        this.notice.set(plan.reportSummary || `Workflow ${plan.workflowKey} status: ${plan.runStatus}`);
        if (plan.workflowRunId) {
          this.openRun(plan.workflowRunId);
        }
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not start that objective.');
        this.starting.set(false);
      },
    });
  }

  openRun(runId: string): void {
    this.api.workflowDetail(runId).subscribe({
      next: (detail) => this.detail.set(detail),
      error: (err: ApiError) => this.error.set(err.detail || err.title || 'Workflow detail unavailable.'),
    });
  }

  decide(id: string, decision: 'approve' | 'reject'): void {
    this.api.decide(id, decision).subscribe({
      next: (result) => {
        this.notice.set(result.summary || `Decision recorded: ${decision}`);
        this.load();
      },
      error: (err: ApiError) => this.error.set(err.detail || err.title || 'Approval decision failed.'),
    });
  }

  cancelTask(id: string): void {
    this.api.cancelTask(id).subscribe({
      next: () => {
        this.notice.set('Task cancel requested.');
        this.load();
      },
      error: (err: ApiError) => this.error.set(err.detail || err.title || 'Could not cancel task.'),
    });
  }

  pauseTask(id: string): void {
    this.api.pauseTask(id).subscribe({
      next: () => {
        this.notice.set('Task paused.');
        this.load();
      },
      error: (err: ApiError) => this.error.set(err.detail || err.title || 'Could not pause task.'),
    });
  }

  resumeTask(id: string): void {
    this.api.resumeTask(id).subscribe({
      next: () => {
        this.notice.set('Task resumed.');
        this.load();
      },
      error: (err: ApiError) => this.error.set(err.detail || err.title || 'Could not resume task.'),
    });
  }
}
