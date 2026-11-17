import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaWorkflow } from '../../core/models/nalva.model';

interface BuilderStep {
  key: string;
  kind: 'agent' | 'condition' | 'approval';
  agentKey: string;
  objective: string;
  tool: string;
  condition: string;
}

@Component({
  selector: 'app-nalva-workflow-builder',
  standalone: true,
  imports: [],
  templateUrl: './workflow-builder.component.html',
  styleUrls: ['./nalva.shared.scss', './workflow-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaWorkflowBuilderComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly name = signal('New automation');
  readonly trigger = signal('Manual');
  readonly eventName = signal('LeadCreated');
  readonly steps = signal<BuilderStep[]>([this.blank(1)]);
  readonly workflows = signal<NalvaWorkflow[]>([]);
  readonly notice = signal<string | null>(null);
  readonly selected = signal(0);

  ngOnInit(): void {
    this.api.workflows().subscribe({ next: (rows) => this.workflows.set(rows) });
  }

  add(kind: BuilderStep['kind']): void {
    const step = this.blank(this.steps().length + 1);
    step.kind = kind;
    if (kind === 'approval') {
      step.tool = 'SendExternalEmail';
      step.objective = 'Request approval before an external action.';
    }
    if (kind === 'condition') step.condition = 'priority == High';
    this.steps.update((rows) => [...rows, step]);
    this.selected.set(this.steps().length - 1);
  }

  move(index: number, direction: number): void {
    const next = index + direction;
    const rows = [...this.steps()];
    if (next < 0 || next >= rows.length) return;
    const [item] = rows.splice(index, 1);
    rows.splice(next, 0, item);
    this.steps.set(rows);
    this.selected.set(next);
  }

  update(index: number, field: keyof BuilderStep, value: string): void {
    this.steps.update((rows) => rows.map((step, stepIndex) => stepIndex === index ? { ...step, [field]: value } : step));
  }

  save(activate: boolean): void {
    const steps = this.steps().map((step) => ({
      key: step.key,
      agentKey: step.agentKey,
      objective: step.objective,
      tools: [step.tool],
      condition: step.kind === 'condition' ? step.condition : null,
    }));
    this.api.saveWorkflow({
      name: this.name(),
      description: 'Built in the visual editor',
      triggerKind: this.trigger(),
      triggerEvent: this.trigger() === 'Event' ? this.eventName() : null,
      steps,
    }).subscribe({
      next: (row) => {
        if (!activate) {
          this.notice.set('Workflow saved. It stays inactive until you activate it.');
          this.ngOnInit();
          return;
        }
        this.api.setWorkflowActive(row.id, true).subscribe({
          next: () => { this.notice.set('Workflow saved and activated.'); this.ngOnInit(); },
        });
      },
      error: (error: HttpErrorResponse) => this.notice.set(this.failure(error, 'The workflow was not saved. Check the agent, tool, and event name.')),
    });
  }

  test(row: NalvaWorkflow): void {
    this.api.testWorkflow(row.id, '{}').subscribe({
      next: (result) => this.notice.set(row.name + ' dry run: ' + result.status),
      error: (error: HttpErrorResponse) => this.notice.set(this.failure(error, 'The dry run did not start.')),
    });
  }

  private failure(error: HttpErrorResponse, fallback: string): string {
    const body = error.error;
    if (body && typeof body === 'object') {
      const detail = body.detail || body.title;
      if (typeof detail === 'string' && detail.trim()) return detail;
    }
    return fallback;
  }

  private blank(index: number): BuilderStep {
    return {
      key: 'step-' + index,
      kind: 'agent',
      agentKey: 'sales',
      objective: 'Review the records this company already has.',
      tool: 'GetSalesPipeline',
      condition: '',
    };
  }
}
