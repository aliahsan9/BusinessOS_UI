import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiError } from '../../../core/models/api-error.model';
import { ContentItem } from '../../../core/models/marketing.model';
import { MarketingService } from '../../../core/services/marketing.service';

@Component({
  selector: 'app-marketing-calendar',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './marketing-calendar.component.html',
  styleUrls: ['../nalva.shared.scss', './marketing-calendar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketingCalendarComponent implements OnInit {
  private readonly api = inject(MarketingService);

  readonly view = signal<'month' | 'week'>('month');
  readonly layout = signal<'list' | 'grid'>('list');
  readonly items = signal<ContentItem[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly savingId = signal<string | null>(null);
  readonly rescheduleDrafts = signal<Record<string, string>>({});

  readonly filtered = computed(() => {
    const rows = [...this.items()];
    const now = new Date();
    const start = this.rangeStart(now);
    const end = this.rangeEnd(now);
    return rows
      .filter((row) => {
        const when = this.publishAt(row);
        if (!when) return true;
        const date = new Date(when);
        return date >= start && date <= end;
      })
      .sort((a, b) => {
        const aAt = this.publishAt(a) || '';
        const bAt = this.publishAt(b) || '';
        return aAt.localeCompare(bAt);
      });
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const now = new Date();
    this.api.calendar({
      view: this.view(),
      from: this.rangeStart(now).toISOString(),
      to: this.rangeEnd(now).toISOString(),
    }).subscribe({
      next: (rows) => {
        this.items.set(rows ?? []);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not load the content calendar.');
        this.loading.set(false);
      },
    });
  }

  setView(value: 'month' | 'week'): void {
    if (this.view() === value) return;
    this.view.set(value);
    this.load();
  }

  setLayout(value: 'list' | 'grid'): void {
    this.layout.set(value);
  }

  publishAt(row: ContentItem): string | undefined {
    return row.scheduledPublishAt || row.suggestedPublishAt || undefined;
  }

  setReschedule(id: string, value: string): void {
    this.rescheduleDrafts.update((drafts) => ({ ...drafts, [id]: value }));
  }

  reschedule(row: ContentItem): void {
    const when = this.rescheduleDrafts()[row.id]?.trim();
    if (!when || this.savingId()) return;
    this.savingId.set(row.id);
    this.notice.set(null);
    this.error.set(null);
    const iso = new Date(when).toISOString();
    this.api.updateContent(row.id, { scheduledPublishAt: iso }).subscribe({
      next: () => {
        this.notice.set('Publish time updated. Material schedule changes after approval require reapproval.');
        this.savingId.set(null);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Reschedule failed.');
        this.savingId.set(null);
      },
    });
  }

  approve(row: ContentItem): void {
    if (this.savingId()) return;
    this.savingId.set(row.id);
    this.notice.set(null);
    this.error.set(null);
    this.api.approveContent(row.id, row.approvalFingerprint).subscribe({
      next: () => {
        this.notice.set('Content approved. Publishing still requires a connected supported account and schedule.');
        this.savingId.set(null);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Approve failed.');
        this.savingId.set(null);
      },
    });
  }

  reject(row: ContentItem): void {
    if (this.savingId()) return;
    this.savingId.set(row.id);
    this.notice.set(null);
    this.error.set(null);
    this.api.rejectContent(row.id).subscribe({
      next: () => {
        this.notice.set('Content rejected.');
        this.savingId.set(null);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Reject failed.');
        this.savingId.set(null);
      },
    });
  }

  canDecide(row: ContentItem): boolean {
    const status = (row.approvalStatus || '').toLowerCase();
    return status === 'review' || status === 'draft' || status === 'pending';
  }

  platformLabel(platform?: string): string {
    return platform?.trim() || 'Unspecified platform';
  }

  private rangeStart(now: Date): Date {
    if (this.view() === 'week') {
      const day = now.getDay();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - day);
      return start;
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private rangeEnd(now: Date): Date {
    if (this.view() === 'week') {
      const start = this.rangeStart(now);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return end;
    }
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
}
