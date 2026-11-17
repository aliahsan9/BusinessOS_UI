import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppConfirmDialogComponent } from '../../../shared/components/app-confirm-dialog/app-confirm-dialog.component';
import { AppEmptyStateComponent } from '../../../shared/components/app-empty-state/app-empty-state.component';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import {
  AnnouncementRow,
  AttendanceRow,
  DepartmentRow,
  EmployeeRow,
  GoalRow,
  LeaveRow,
  LeaveTypeRow,
  TeamRow,
  WorkspaceApiService,
  workspaceError,
} from '../workspace-api.service';

type PeopleScreen = 'employees' | 'departments' | 'attendance' | 'leave' | 'announcements' | 'performance';

@Component({
  selector: 'app-people-page',
  standalone: true,
  imports: [
    FormsModule,
    AppAlertComponent,
    AppBreadcrumbComponent,
    AppConfirmDialogComponent,
    AppEmptyStateComponent,
    AppPageHeaderComponent,
    AppSkeletonComponent,
  ],
  templateUrl: './people-page.component.html',
  styleUrl: './workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PeoplePageComponent implements OnInit {
  private readonly api = inject(WorkspaceApiService);
  private readonly route = inject(ActivatedRoute);

  readonly screen = signal<PeopleScreen>('employees');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly employees = signal<EmployeeRow[]>([]);
  readonly departments = signal<DepartmentRow[]>([]);
  readonly teams = signal<TeamRow[]>([]);
  readonly attendance = signal<AttendanceRow[]>([]);
  readonly leaveTypes = signal<LeaveTypeRow[]>([]);
  readonly leave = signal<LeaveRow[]>([]);
  readonly announcements = signal<AnnouncementRow[]>([]);
  readonly goals = signal<GoalRow[]>([]);
  readonly pendingEmployee = signal<EmployeeRow | null>(null);

  employee = this.blankEmployee();
  department = { name: '', description: '' };
  team = { name: '', description: '', departmentId: '' };
  leaveType = { name: '', defaultDays: 12, isPaid: true };
  leaveRequest = { leaveTypeId: '', startDate: '', endDate: '', reason: '' };
  rejectReason = '';
  announcement = { title: '', body: '', audience: 'Company', priority: 'Normal' };
  goal = { employeeId: '', title: '', kpiName: '', targetValue: 1, currentValue: 0 };
  review = { employeeId: '', periodLabel: '', rating: 3, feedback: '', status: 'Completed' };

  ngOnInit(): void {
    this.screen.set((this.route.snapshot.data['screen'] as PeopleScreen) ?? 'employees');
    this.reload();
  }

  title(): string {
    return {
      employees: 'Employees',
      departments: 'Departments and teams',
      attendance: 'Attendance',
      leave: 'Leave',
      announcements: 'Announcements',
      performance: 'Performance',
    }[this.screen()];
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    const done = () => this.loading.set(false);
    const fail = (error: unknown) => {
      this.error.set(workspaceError(error));
      done();
    };
    switch (this.screen()) {
      case 'employees':
        this.api.employees().subscribe({ next: (page) => { this.employees.set(page.items); done(); }, error: fail });
        break;
      case 'departments':
        this.api.departments().subscribe({
          next: (rows) => {
            this.departments.set(rows);
            this.api.teams().subscribe({ next: (teams) => { this.teams.set(teams); done(); }, error: fail });
          },
          error: fail,
        });
        break;
      case 'attendance':
        this.api.attendance().subscribe({ next: (page) => { this.attendance.set(page.items); done(); }, error: fail });
        break;
      case 'leave':
        this.api.leaveTypes().subscribe({
          next: (types) => {
            this.leaveTypes.set(types);
            this.api.leaveRequests().subscribe({ next: (page) => { this.leave.set(page.items); done(); }, error: fail });
          },
          error: fail,
        });
        break;
      case 'announcements':
        this.api.announcements().subscribe({ next: (rows) => { this.announcements.set(rows); done(); }, error: fail });
        break;
      case 'performance':
        this.api.employees().subscribe({
          next: (page) => {
            this.employees.set(page.items);
            this.api.goals().subscribe({ next: (rows) => { this.goals.set(rows); done(); }, error: fail });
          },
          error: fail,
        });
        break;
    }
  }

  saveEmployee(): void {
    this.run(() => this.api.saveEmployee({
      ...this.employee,
      joiningDate: `${this.employee.joiningDate}T00:00:00Z`,
      salary: this.employee.salary === null || this.employee.salary === undefined || Number.isNaN(Number(this.employee.salary))
        ? null
        : Number(this.employee.salary),
      departmentId: null,
      teamId: null,
      managerEmployeeId: null,
    }), () => {
      this.employee = this.blankEmployee();
    });
  }

  confirmDeactivate(employee: EmployeeRow): void {
    this.pendingEmployee.set(employee);
  }

  deactivate(): void {
    const employee = this.pendingEmployee();
    if (!employee) {
      return;
    }
    this.saving.set(true);
    this.api.setEmployeeActive(employee.id, false).subscribe({
      next: () => {
        this.pendingEmployee.set(null);
        this.saving.set(false);
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(workspaceError(error));
      },
    });
  }

  saveDepartment(): void {
    this.run(() => this.api.saveDepartment({ name: this.department.name, description: this.department.description || null, managerEmployeeId: null }), () => {
      this.department = { name: '', description: '' };
    });
  }

  saveTeam(): void {
    this.run(() => this.api.saveTeam({
      name: this.team.name,
      description: this.team.description || null,
      departmentId: this.team.departmentId || null,
      leaderEmployeeId: null,
    }), () => {
      this.team = { name: '', description: '', departmentId: '' };
    });
  }

  check(kind: 'in' | 'out'): void {
    this.run(() => kind === 'in' ? this.api.checkIn() : this.api.checkOut());
  }

  saveLeaveType(): void {
    this.run(() => this.api.saveLeaveType(this.leaveType), () => {
      this.leaveType = { name: '', defaultDays: 12, isPaid: true };
    });
  }

  applyLeave(): void {
    this.run(() => this.api.applyLeave({
      leaveTypeId: this.leaveRequest.leaveTypeId,
      startDate: this.leaveRequest.startDate,
      endDate: this.leaveRequest.endDate,
      reason: this.leaveRequest.reason || null,
      employeeId: null,
    }));
  }

  decide(row: LeaveRow, approve: boolean): void {
    this.run(() => this.api.decideLeave(row.id, approve, this.rejectReason));
  }

  saveAnnouncement(): void {
    this.run(() => this.api.saveAnnouncement({
      ...this.announcement,
      departmentId: null,
      companyTeamId: null,
      expiresAt: null,
    }), () => {
      this.announcement = { title: '', body: '', audience: 'Company', priority: 'Normal' };
    });
  }

  markRead(row: AnnouncementRow): void {
    this.run(() => this.api.markAnnouncementRead(row.id));
  }

  saveGoal(): void {
    this.run(() => this.api.saveGoal({
      employeeId: this.goal.employeeId,
      title: this.goal.title,
      kpiName: this.goal.kpiName || null,
      targetValue: Number(this.goal.targetValue),
      currentValue: Number(this.goal.currentValue),
      description: null,
      periodStart: null,
      periodEnd: null,
    }));
  }

  saveReview(): void {
    this.run(() => this.api.saveReview({
      employeeId: this.review.employeeId,
      periodLabel: this.review.periodLabel,
      rating: Number(this.review.rating),
      feedback: this.review.feedback || null,
      status: this.review.status,
    }));
  }

  private run(request: () => Observable<unknown>, after?: () => void): void {
    this.saving.set(true);
    this.error.set(null);
    request().subscribe({
      next: () => {
        after?.();
        this.saving.set(false);
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(workspaceError(error));
      },
    });
  }

  private blankEmployee() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      jobTitle: '',
      joiningDate: new Date().toISOString().slice(0, 10),
      employmentType: 'FullTime',
      skills: '',
      workLocation: '',
      salary: null as number | null,
    };
  }
}
