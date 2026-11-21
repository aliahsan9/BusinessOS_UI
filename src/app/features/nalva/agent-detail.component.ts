import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaAgentDetail, NalvaExecution } from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';

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
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const key = this.route.snapshot.paramMap.get('key') ?? '';
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      agent: this.api.agent(key),
      history: this.api.executions(key),
    }).subscribe({
      next: ({ agent, history }) => {
        this.agent.set(agent);
        this.history.set(history);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.status === 404
          ? 'This Navla agent was not found for the current company.'
          : err.detail || err.title || 'The agent could not be loaded.');
        this.loading.set(false);
      },
    });
  }
}
