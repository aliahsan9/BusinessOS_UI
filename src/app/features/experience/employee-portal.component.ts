import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TokenService } from '../../core/services/token.service';
import { AnnouncementRow, LeaveRow, TaskRow, WorkspaceApiService } from '../workspace/workspace-api.service';

@Component({
  selector: 'app-employee-portal',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './employee-portal.component.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmployeePortalComponent implements OnInit {
  private readonly workspace = inject(WorkspaceApiService);
  private readonly token = inject(TokenService);
  readonly tasks = signal<TaskRow[]>([]);
  readonly leave = signal<LeaveRow[]>([]);
  readonly announcements = signal<AnnouncementRow[]>([]);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const userId = this.token.user()?.userId;
    this.workspace.tasks().subscribe({
      next: (page) => {
        const rows = page.items ?? [];
        this.tasks.set(userId ? rows.filter((task) => !task.assignedUserId || task.assignedUserId === userId) : rows);
      },
      error: () => this.error.set('Tasks could not be loaded.'),
    });
    this.workspace.leaveRequests().subscribe({
      next: (page) => this.leave.set(page.items ?? []),
      error: () => this.leave.set([]),
    });
    this.workspace.announcements().subscribe({
      next: (rows) => this.announcements.set(rows ?? []),
      error: () => this.announcements.set([]),
    });
  }
}
