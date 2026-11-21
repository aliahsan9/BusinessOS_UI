import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaOverview, NalvaTask, NalvaApproval, NalvaWorkforceRecommendation } from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-nalva-overview',
  standalone: true,
  imports: [RouterLink, DatePipe, DecimalPipe],
  templateUrl: './overview.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaOverviewComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly routes = ROUTES;
  readonly overview = signal<NalvaOverview | null>(null);
  readonly recommendation = signal<NalvaWorkforceRecommendation | null>(null);
  readonly tasks = signal<NalvaTask[]>([]);
  readonly approvals = signal<NalvaApproval[]>([]);
  readonly loading = signal(true);
  readonly applying = signal(false);
  readonly error = signal<string | null>(null);
  readonly packMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      overview: this.api.overview(),
      recommendation: this.api.workforceRecommendation(),
      tasks: this.api.tasks(undefined, 'Queued'),
      approvals: this.api.approvals('Pending'),
    }).subscribe({
      next: ({ overview, recommendation, tasks, approvals }) => {
        this.overview.set(overview);
        this.recommendation.set(recommendation);
        this.tasks.set(tasks);
        this.approvals.set(approvals);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Navla overview could not be loaded. Check your API connection and permissions.');
        this.loading.set(false);
      },
    });
  }

  recommendedAgents(pack: NalvaWorkforceRecommendation): NalvaWorkforceRecommendation['agents'] {
    return pack.agents.filter((agent) => agent.isRecommended);
  }

  applyPack(): void {
    const pack = this.recommendation();
    if (!pack) return;
    this.applying.set(true);
    this.packMessage.set(null);
    const keys = this.recommendedAgents(pack).map((agent) => agent.key);
    this.api.applyWorkforcePack({
      activateRecommendedAgents: true,
      activateRecommendedWorkflows: false,
      onlyAgentKeys: keys,
    }).subscribe({
      next: (result) => {
        this.packMessage.set(`Activated ${result.activatedAgents.length} recommended agents for ${result.packKey}. Workflows stay inactive until you enable them.`);
        this.applying.set(false);
        this.load();
      },
      error: (err: ApiError) => {
        this.packMessage.set(err.detail || err.title || 'Could not apply the workforce pack.');
        this.applying.set(false);
      },
    });
  }
}
