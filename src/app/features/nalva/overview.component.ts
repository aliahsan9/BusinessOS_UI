import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaOverview, NalvaTask, NalvaApproval } from '../../core/models/nalva.model';
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
  readonly tasks = signal<NalvaTask[]>([]);
  readonly approvals = signal<NalvaApproval[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      overview: this.api.overview(),
      tasks: this.api.tasks(undefined, 'Queued'),
      approvals: this.api.approvals('Pending'),
    }).subscribe({
      next: ({ overview, tasks, approvals }) => {
        this.overview.set(overview);
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
}
