import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaAgentCard, NalvaTask } from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';

@Component({
  selector: 'app-nalva-tasks',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaTasksComponent implements OnInit {
  private readonly api = inject(NalvaService);

  readonly tasks = signal<NalvaTask[]>([]);
  readonly agents = signal<NalvaAgentCard[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly savingId = signal<string | null>(null);
  readonly enqueueing = signal(false);
  readonly agentKey = signal('');
  readonly objective = signal('');
  readonly statusFilter = signal('');

  ngOnInit(): void {
    this.api.myAgents().subscribe({
      next: (rows) => {
        this.agents.set(rows);
        if (!this.agentKey() && rows.length) {
          this.agentKey.set(rows[0].key);
        }
      },
      error: () => undefined,
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.tasks(undefined, this.statusFilter() || undefined).subscribe({
      next: (rows) => {
        this.tasks.set(rows);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(this.describeError(err, 'Could not load the agent task queue.'));
        this.loading.set(false);
      },
    });
  }

  enqueue(): void {
    const key = this.agentKey().trim();
    const objective = this.objective().trim();
    if (!key || !objective || this.enqueueing()) return;

    this.enqueueing.set(true);
    this.error.set(null);
    this.notice.set(null);
    this.api.enqueue(key, objective).subscribe({
      next: (task) => {
        this.tasks.update((rows) => [task, ...rows]);
        this.objective.set('');
        this.notice.set(`Task queued for ${task.agentKey}. Status: ${task.status}.`);
        this.enqueueing.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(this.describeError(err, 'The task was not queued. No work was scheduled.'));
        this.enqueueing.set(false);
      },
    });
  }

  act(task: NalvaTask, action: 'cancel' | 'pause' | 'resume' | 'retry'): void {
    if (this.savingId()) return;
    this.savingId.set(task.id);
    this.error.set(null);
    this.notice.set(null);

    const request =
      action === 'cancel' ? this.api.cancelTask(task.id) :
      action === 'pause' ? this.api.pauseTask(task.id) :
      action === 'resume' ? this.api.resumeTask(task.id) :
      this.api.retryTask(task.id);

    request.subscribe({
      next: (updated) => {
        this.tasks.update((rows) => rows.map((row) => row.id === updated.id ? updated : row));
        this.notice.set(`Task ${action} completed. Current status: ${updated.status}.`);
        this.savingId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(this.describeError(err, `Could not ${action} this task. Its previous status was kept.`));
        this.savingId.set(null);
      },
    });
  }

  private describeError(err: ApiError, fallback: string): string {
    if (err.status === 403) return 'Your account does not have permission to manage Navla tasks.';
    if (err.status === 404) return 'That task is no longer available in this workspace.';
    return err.detail || err.title || fallback;
  }
}
