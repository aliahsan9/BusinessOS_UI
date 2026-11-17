import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AgentEmployeeService } from '../../core/services/agent-employee.service';
import { AgentEmployee, AgentWorkflowSummary } from '../../core/models/agent.model';

@Component({
  selector: 'app-nalva-agent-detail',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './agent-detail.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaAgentDetailComponent implements OnInit {
  private readonly api = inject(AgentEmployeeService);
  private readonly route = inject(ActivatedRoute);

  readonly agent = signal<AgentEmployee | null>(null);
  readonly history = signal<AgentWorkflowSummary[]>([]);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const key = this.route.snapshot.paramMap.get('key') ?? '';
    this.loading.set(true);
    this.error.set(null);

    this.api.listEmployees().subscribe({
      next: (employees) => {
        const employee = employees.find((item) => item.key === key) ?? null;
        this.agent.set(employee);
        if (!employee) {
          this.error.set('This AI employee was not found in the backend catalog.');
          this.loading.set(false);
          return;
        }

        this.api.listWorkflows(100).subscribe({
          next: (workflows) => {
            this.history.set(workflows.filter((workflow) => workflow.agentKey === key));
            this.loading.set(false);
          },
          error: () => {
            this.error.set('The employee loaded, but execution history could not be retrieved.');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('The AI employee could not be loaded. Check your API connection and permissions.');
        this.loading.set(false);
      },
    });
  }

  workflowStatus(status: number | string): string {
    if (typeof status === 'string') return status;
    return ['Pending', 'Running', 'Completed', 'Failed', 'Cancelled'][status] ?? 'Unknown';
  }
}
