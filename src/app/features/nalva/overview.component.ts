import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AgentEmployeeService } from '../../core/services/agent-employee.service';
import { AgentWorkflowSummary } from '../../core/models/agent.model';
import { AgentEmployee } from '../../core/models/agent.model';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-nalva-overview',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './overview.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaOverviewComponent implements OnInit {
  private readonly agentsApi = inject(AgentEmployeeService);
  readonly routes = ROUTES;
  readonly employees = signal<AgentEmployee[]>([]);
  readonly workflows = signal<AgentWorkflowSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly activeEmployees = () => this.employees().filter((employee) => employee.isActive).length;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      employees: this.agentsApi.listEmployees(),
      workflows: this.agentsApi.listWorkflows(20),
    }).subscribe({
      next: ({ employees, workflows }) => {
        this.employees.set(employees);
        this.workflows.set(workflows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Navla data could not be loaded. Check your API connection and permissions.');
        this.loading.set(false);
      },
    });
  }

  workflowStatus(status: number | string): string {
    if (typeof status === 'string') return status;
    return ['Pending', 'Running', 'Completed', 'Failed', 'Cancelled'][status] ?? 'Unknown';
  }
}
