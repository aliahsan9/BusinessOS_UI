import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppEmptyStateComponent } from '../../../shared/components/app-empty-state/app-empty-state.component';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { MilestoneRow, ProjectProgress, ProjectRow, TaskRow, TimeRow, WorkspaceApiService, workspaceError } from '../workspace-api.service';

type ProjectScreen = 'projects' | 'tasks' | 'time';

@Component({
  selector: 'app-project-ops-page',
  standalone: true,
  imports: [FormsModule, AppCurrencyPipe, AppAlertComponent, AppBreadcrumbComponent, AppEmptyStateComponent, AppPageHeaderComponent, AppSkeletonComponent],
  templateUrl: './project-ops-page.component.html',
  styleUrl: '../people/workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectOpsPageComponent implements OnInit {
  private readonly api = inject(WorkspaceApiService);
  private readonly route = inject(ActivatedRoute);
  readonly stages = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Blocked', 'Completed', 'Development', 'Code Review', 'QA Testing', 'Ready for Deployment', 'Deployed'];
  readonly screen = signal<ProjectScreen>('projects');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly projects = signal<ProjectRow[]>([]);
  readonly selectedId = signal('');
  readonly progress = signal<ProjectProgress | null>(null);
  readonly milestones = signal<MilestoneRow[]>([]);
  readonly tasks = signal<TaskRow[]>([]);
  readonly time = signal<TimeRow[]>([]);
  project = { name: '', description: '', customerId: '', budget: 0, workflow: 'General', deadline: '' };
  milestone = { name: '', dueDate: '', isClientVisible: false };
  task = { title: '', stage: 'To Do', priority: 2, taskKind: 'Task' };
  entry = { hours: 1, isBillable: true, notes: '' };
  portalEmail = '';
  billDue = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    this.screen.set((this.route.snapshot.data['screen'] as ProjectScreen) ?? 'projects');
    this.reload();
  }

  title(): string {
    return { projects: 'Projects', tasks: 'Tasks', time: 'Timesheets' }[this.screen()];
  }

  tasksIn(stage: string): TaskRow[] {
    return this.tasks().filter((task) => (task.stage || 'To Do') === stage);
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    const done = () => this.loading.set(false);
    const fail = (error: unknown) => { this.error.set(workspaceError(error)); done(); };
    this.api.projects().subscribe({
      next: (page) => {
        this.projects.set(page.items);
        if (!this.selectedId() && page.items[0]) {
          this.selectedId.set(page.items[0].id);
        }
        if (this.screen() === 'tasks') {
          this.api.tasks(this.selectedId() || undefined).subscribe({ next: (tasks) => { this.tasks.set(tasks.items); done(); }, error: fail });
        } else if (this.screen() === 'time') {
          this.api.time(this.selectedId() || undefined).subscribe({ next: (rows) => { this.time.set(rows.items); done(); }, error: fail });
        } else if (this.selectedId()) {
          this.loadProjectDetail(done, fail);
        } else {
          done();
        }
      },
      error: fail,
    });
  }

  selectProject(id: string): void {
    this.selectedId.set(id);
    this.reload();
  }

  saveProject(): void {
    this.run(() => this.api.saveProject({
      name: this.project.name,
      description: this.project.description || null,
      code: null,
      customerId: this.project.customerId || null,
      managerUserId: null,
      startDate: new Date().toISOString(),
      deadline: this.project.deadline ? `${this.project.deadline}T00:00:00Z` : null,
      budget: Number(this.project.budget),
      priority: 2,
      workflow: this.project.workflow,
      visibility: 'Internal',
      dealId: null,
    }));
  }

  saveMilestone(): void {
    this.run(() => this.api.saveMilestone({
      projectId: this.selectedId(),
      name: this.milestone.name,
      dueDate: this.milestone.dueDate ? `${this.milestone.dueDate}T00:00:00Z` : null,
      isClientVisible: this.milestone.isClientVisible,
    }));
  }

  saveTask(): void {
    this.run(() => this.api.saveTask({
      projectId: this.selectedId(),
      title: this.task.title,
      description: null,
      assignedUserId: null,
      priority: Number(this.task.priority),
      dueDate: null,
      stage: this.task.stage,
      taskKind: this.task.taskKind,
      parentTaskId: null,
      sprintId: null,
      isClientVisible: false,
    }));
  }

  moveTask(task: TaskRow, stage: string): void {
    this.run(() => this.api.saveTask({
      projectId: task.projectId,
      title: task.title,
      description: null,
      assignedUserId: task.assignedUserId ?? null,
      priority: task.priority,
      dueDate: task.dueDate ?? null,
      stage,
      taskKind: task.taskKind,
      parentTaskId: null,
      sprintId: null,
      isClientVisible: task.isClientVisible,
    }, task.id));
  }

  saveTime(): void {
    this.run(() => this.api.saveTime({
      projectId: this.selectedId() || null,
      workTaskId: null,
      hours: Number(this.entry.hours),
      isBillable: this.entry.isBillable,
      hourlyRate: null,
      notes: this.entry.notes || null,
      startedAt: new Date().toISOString(),
    }));
  }

  start(): void { this.run(() => this.api.startTimer(this.selectedId() || undefined)); }
  stop(): void { this.run(() => this.api.stopTimer()); }
  approve(row: TimeRow): void { this.run(() => this.api.approveTime(row.id)); }

  invite(): void {
    this.saving.set(true);
    this.api.clientAccess(this.selectedId(), this.portalEmail).subscribe({
      next: (access) => {
        this.notice.set(`Portal link: /portal/${access.token}`);
        this.saving.set(false);
      },
      error: (error: unknown) => { this.saving.set(false); this.error.set(workspaceError(error)); },
    });
  }

  bill(): void {
    this.run(() => this.api.billProject(this.selectedId(), `${this.billDue}T00:00:00Z`));
  }

  private loadProjectDetail(done: () => void, fail: (error: unknown) => void): void {
    this.api.progress(this.selectedId()).subscribe({
      next: (progress) => {
        this.progress.set(progress);
        this.api.milestones(this.selectedId()).subscribe({ next: (rows) => { this.milestones.set(rows); done(); }, error: fail });
      },
      error: fail,
    });
  }

  private run(request: () => Observable<unknown>): void {
    this.saving.set(true);
    this.error.set(null);
    request().subscribe({
      next: () => { this.saving.set(false); this.reload(); },
      error: (error: unknown) => { this.saving.set(false); this.error.set(workspaceError(error)); },
    });
  }
}
