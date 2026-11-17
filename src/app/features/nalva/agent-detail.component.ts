import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaAgentDetail, NalvaExecution, NalvaMemory } from '../../core/models/nalva.model';

@Component({
  selector: 'app-nalva-agent-detail',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './agent-detail.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaAgentDetailComponent implements OnInit {
  private readonly api = inject(NalvaService);
  private readonly route = inject(ActivatedRoute);
  readonly agent = signal<NalvaAgentDetail | null>(null);
  readonly history = signal<NalvaExecution[]>([]);
  readonly memory = signal<NalvaMemory[]>([]);
  readonly objective = signal('status');
  readonly notice = signal<string | null>(null);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const key = this.route.snapshot.paramMap.get('key') ?? '';
    this.api.agent(key).subscribe({
      next: (value) => this.agent.set(value),
      error: () => this.error.set('This agent could not be loaded.'),
    });
    this.api.executions(key).subscribe({ next: (rows) => this.history.set(rows) });
    this.api.memory(key).subscribe({ next: (rows) => this.memory.set(rows) });
  }

  run(): void {
    const key = this.agent()?.key;
    if (!key) return;
    this.api.run(key, this.objective()).subscribe({
      next: (result) => { this.notice.set(result.summary || result.status); this.reload(); },
      error: () => this.error.set('The run did not start.'),
    });
  }

  setAutonomy(level: number): void {
    const key = this.agent()?.key;
    if (!key) return;
    this.api.configure(key, { autonomyLevel: level }).subscribe({ next: () => this.reload() });
  }
}
