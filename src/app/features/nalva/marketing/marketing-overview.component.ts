import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTES } from '../../../core/constants/route.constants';
import { ApiError } from '../../../core/models/api-error.model';
import { OverviewStats } from '../../../core/models/marketing.model';
import { MarketingService } from '../../../core/services/marketing.service';

@Component({
  selector: 'app-marketing-overview',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './marketing-overview.component.html',
  styleUrls: ['../nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketingOverviewComponent implements OnInit {
  private readonly api = inject(MarketingService);
  readonly routes = ROUTES;
  readonly stats = signal<OverviewStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.overview().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.status === 403
          ? 'Your account does not have permission to view marketing overview.'
          : err.detail || err.title || 'Could not load marketing overview. Check your connection and try again.');
        this.loading.set(false);
      },
    });
  }
}
