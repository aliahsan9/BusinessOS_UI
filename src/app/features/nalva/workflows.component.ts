import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AgentEmployeeService } from '../../core/services/agent-employee.service';
import { AgentWorkflowSummary } from '../../core/models/agent.model';

@Component({
  selector: 'app-nalva-workflows',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './workflows.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaWorkflowsComponent implements OnInit {
  private readonly api = inject(AgentEmployeeService);
  readonly workflows = signal<AgentWorkflowSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listWorkflows(50).subscribe({
      next: (rows) => {
        this.workflows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Execution workflow history could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  status(value: number | string): string {
    if (typeof value === 'string') return value;
    return ['Pending', 'Running', 'Completed', 'Failed', 'Cancelled'][value] ?? 'Unknown';
  }
}
