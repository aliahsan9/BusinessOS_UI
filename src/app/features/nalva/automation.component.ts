import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaApproval, NalvaWorkflow, NalvaWorkflowRun } from '../../core/models/nalva.model';

@Component({
  selector: 'app-nalva-automation',
  standalone: true,
  imports: [],
  templateUrl: './automation.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaAutomationComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly workflows = signal<NalvaWorkflow[]>([]);
  readonly runs = signal<NalvaWorkflowRun[]>([]);
  readonly approvals = signal<NalvaApproval[]>([]);

  ngOnInit(): void {
    this.api.workflows().subscribe({ next: (rows) => this.workflows.set(rows) });
    this.api.workflowRuns().subscribe({ next: (rows) => this.runs.set(rows) });
    this.api.approvals('Pending').subscribe({ next: (rows) => this.approvals.set(rows) });
  }

  count(status: string): number {
    return this.runs().filter((run) => run.status === status).length;
  }

  scheduled(): number {
    return this.workflows().filter((row) => row.triggerKind === 'Scheduled' && row.isActive).length;
  }

  active(): number {
    return this.workflows().filter((row) => row.isActive).length;
  }

  paused(): number {
    return this.workflows().filter((row) => !row.isActive).length;
  }
}
