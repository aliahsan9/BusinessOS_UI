import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaAgentDetail, NalvaExecution } from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';
import { ROUTES } from '../../core/constants/route.constants';

const AGENT_WORKSPACES: Record<string, { label: string; route: string }> = {
  procurement: { label: 'Open Inventory & Procurement workspace', route: ROUTES.nalva.procurement },
  finance: { label: 'Open Finance Agent workspace', route: ROUTES.nalva.finance },
  support: { label: 'Open Customer Support workspace', route: ROUTES.nalva.support },
  sales: { label: 'Open Sales Agent command center', route: ROUTES.nalva.salesAgent },
};

@Component({
  selector: 'app-nalva-agent-detail',
  standalone: true,
  imports: [DatePipe, RouterLink],
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
  readonly agentKey = signal('');

  readonly workspaceLink = computed(() => AGENT_WORKSPACES[this.agentKey()] ?? null);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const key = this.route.snapshot.paramMap.get('key') ?? '';
    this.agentKey.set(key);
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
