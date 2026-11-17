import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaWorkflow, NalvaWorkflowRun } from '../../core/models/nalva.model';

@Component({
  selector: 'app-nalva-workflows',
  standalone: true,
  imports: [],
  templateUrl: './workflows.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaWorkflowsComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly workflows = signal<NalvaWorkflow[]>([]);
  readonly runs = signal<NalvaWorkflowRun[]>([]);
  readonly name = signal('');
  readonly agentKey = signal('sales');
  readonly tool = signal('GetSalesPipeline');
  readonly objective = signal('Review the pipeline');
  readonly notice = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.workflows().subscribe({ next: (rows) => this.workflows.set(rows) });
    this.api.workflowRuns().subscribe({ next: (rows) => this.runs.set(rows) });
  }

  toggle(row: NalvaWorkflow): void {
    this.api.setWorkflowActive(row.id, !row.isActive).subscribe({ next: () => this.load() });
  }

  run(row: NalvaWorkflow): void {
    this.api.runWorkflow(row.id).subscribe({
      next: (result) => { this.notice.set(`${row.name}: ${result.status}`); this.load(); },
      error: () => this.notice.set('The workflow did not start. Activate the agents it uses first.'),
    });
  }

  create(): void {
    this.api.saveWorkflow({
      name: this.name(),
      description: 'Company workflow',
      triggerKind: 'Manual',
      steps: [{ key: 'step-1', agentKey: this.agentKey(), objective: this.objective(), tools: [this.tool()] }],
    }).subscribe({ next: () => { this.name.set(''); this.load(); } });
  }
}
