import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../../core/models/api-error.model';
import { Campaign, ContentAsset, ContentItem } from '../../../core/models/marketing.model';
import { MarketingService } from '../../../core/services/marketing.service';

@Component({
  selector: 'app-marketing-studio',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './marketing-studio.component.html',
  styleUrls: ['../nalva.shared.scss', './marketing-studio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketingStudioComponent implements OnInit {
  private readonly api = inject(MarketingService);

  readonly items = signal<ContentItem[]>([]);
  readonly campaigns = signal<Campaign[]>([]);
  readonly assets = signal<ContentAsset[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly draft = signal<ContentItem | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      content: this.api.content(),
      campaigns: this.api.campaigns(),
    }).subscribe({
      next: ({ content, campaigns }) => {
        this.items.set(content ?? []);
        this.campaigns.set(campaigns ?? []);
        const current = this.selectedId();
        const next = current
          ? (content ?? []).find((row) => row.id === current) || (content ?? [])[0]
          : (content ?? [])[0];
        if (next) this.select(next);
        else {
          this.selectedId.set(null);
          this.draft.set(null);
          this.assets.set([]);
        }
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not load content studio.');
        this.loading.set(false);
      },
    });
  }

  select(row: ContentItem): void {
    this.selectedId.set(row.id);
    this.draft.set({ ...row });
    this.api.assets({ contentItemId: row.id }).subscribe({
      next: (rows) => this.assets.set(rows ?? []),
      error: () => this.assets.set([]),
    });
  }

  patchDraft(field: keyof ContentItem, value: string): void {
    const current = this.draft();
    if (!current) return;
    this.draft.set({ ...current, [field]: value });
  }

  save(): void {
    const row = this.draft();
    if (!row || this.saving()) return;
    this.saving.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.updateContent(row.id, {
      title: row.title,
      body: row.body,
      caption: row.caption,
      hashtagsJson: row.hashtagsJson,
      callToAction: row.callToAction,
      suggestedPublishAt: row.suggestedPublishAt || null,
      scheduledPublishAt: row.scheduledPublishAt || null,
    }).subscribe({
      next: (saved) => {
        this.notice.set('Content saved. Material changes after approval require reapproval.');
        this.draft.set(saved);
        this.saving.set(false);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Save failed.');
        this.saving.set(false);
      },
    });
  }

  submitReview(): void {
    const row = this.draft();
    if (!row || this.saving()) return;
    this.saving.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.submitForReview(row.id).subscribe({
      next: () => {
        this.notice.set('Submitted for review.');
        this.saving.set(false);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Submit for review failed.');
        this.saving.set(false);
      },
    });
  }

  approve(): void {
    const row = this.draft();
    if (!row || this.saving()) return;
    this.saving.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.approveContent(row.id, row.approvalFingerprint).subscribe({
      next: () => {
        this.notice.set('Approved. Schedule or publish only through supported connected platforms (Meta Page when connected).');
        this.saving.set(false);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Approve failed.');
        this.saving.set(false);
      },
    });
  }

  regenerateGraphic(): void {
    const row = this.draft();
    if (!row || this.saving()) return;
    this.saving.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.generateGraphic({
      contentItemId: row.id,
      campaignId: row.campaignId,
      platform: row.platform,
      brief: row.caption || row.title,
    }).subscribe({
      next: (asset) => {
        this.notice.set(asset.source === 'BriefOnly'
          ? 'Visual brief stored (OpenAI images unavailable). No fake logo was inserted.'
          : `Graphic generated via ${asset.source}.`);
        this.saving.set(false);
        this.select(row);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Graphic regeneration failed.');
        this.saving.set(false);
      },
    });
  }

  previewImage(): string | null {
    const asset = this.assets().find((item) => !!item.storageUrl);
    return asset?.storageUrl || null;
  }

  campaignTitle(id?: string | null): string {
    if (!id) return 'Unassigned';
    return this.campaigns().find((c) => c.id === id)?.title || id;
  }
}
