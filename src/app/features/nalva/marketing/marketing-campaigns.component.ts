import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiError } from '../../../core/models/api-error.model';
import { Campaign, PerformanceReport, SyncAnalyticsResult } from '../../../core/models/marketing.model';
import { MarketingService } from '../../../core/services/marketing.service';

@Component({
  selector: 'app-marketing-campaigns',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './marketing-campaigns.component.html',
  styleUrls: ['../nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketingCampaignsComponent implements OnInit {
  private readonly api = inject(MarketingService);

  readonly campaigns = signal<Campaign[]>([]);
  readonly selected = signal<Campaign | null>(null);
  readonly sync = signal<SyncAnalyticsResult | null>(null);
  readonly report = signal<PerformanceReport | null>(null);
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly savingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.campaigns().subscribe({
      next: (rows) => {
        this.campaigns.set(rows ?? []);
        const current = this.selected();
        const next = current
          ? (rows ?? []).find((row) => row.id === current.id) || (rows ?? [])[0]
          : (rows ?? [])[0];
        this.loading.set(false);
        if (next) this.open(next);
        else {
          this.selected.set(null);
          this.sync.set(null);
          this.report.set(null);
        }
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not load campaigns.');
        this.loading.set(false);
      },
    });
  }

  open(row: Campaign): void {
    this.selected.set(row);
    this.detailLoading.set(true);
    this.notice.set(null);
    forkJoin({
      detail: this.api.campaign(row.id).pipe(catchError(() => of(row))),
      report: this.api.performanceReport(row.id).pipe(catchError(() => of(null))),
    }).subscribe({
      next: ({ detail, report }) => {
        this.selected.set(detail);
        this.report.set(report);
        this.detailLoading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not load campaign detail.');
        this.detailLoading.set(false);
      },
    });
  }

  syncAnalytics(row: Campaign): void {
    this.api.syncAnalytics({ campaignId: row.id }).subscribe({
      next: (result) => {
        this.sync.set(result);
        this.notice.set(result.message || `Synced via ${result.dataSource}.`);
        this.open(row);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Analytics sync failed.');
      },
    });
  }

  pause(row: Campaign): void {
    if (this.savingId()) return;
    this.savingId.set(row.id);
    this.notice.set(null);
    this.error.set(null);
    this.api.pauseCampaign(row.id).subscribe({
      next: (updated) => {
        this.notice.set('Campaign paused.');
        this.savingId.set(null);
        this.selected.set(updated);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Pause failed.');
        this.savingId.set(null);
      },
    });
  }

  resume(row: Campaign): void {
    if (this.savingId()) return;
    this.savingId.set(row.id);
    this.notice.set(null);
    this.error.set(null);
    this.api.resumeCampaign(row.id).subscribe({
      next: (updated) => {
        this.notice.set('Campaign resumed.');
        this.savingId.set(null);
        this.selected.set(updated);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Resume failed.');
        this.savingId.set(null);
      },
    });
  }

  isPaused(row: Campaign): boolean {
    return (row.status || '').toLowerCase() === 'paused';
  }

  platforms(row: Campaign): string[] {
    try {
      const parsed = JSON.parse(row.recommendedPlatformsJson || '[]');
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
}
