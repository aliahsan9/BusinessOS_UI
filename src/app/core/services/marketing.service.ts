import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiService } from './base-api.service';
import { API_ENDPOINTS } from '../constants/api.constants';
import {
  BrandProfile,
  CalendarResponse,
  Campaign,
  ConnectedAccount,
  ContentAsset,
  ContentItem,
  GenerateGraphicRequest,
  MarketingPolicy,
  OverviewStats,
  PerformanceReport,
  PublishJob,
  ResearchReport,
  ScheduleContentRequest,
  SyncAnalyticsResult,
  UpdateContentRequest,
} from '../models/marketing.model';

@Injectable({ providedIn: 'root' })
export class MarketingService extends BaseApiService {
  private readonly api = API_ENDPOINTS.marketing;

  overview(): Observable<OverviewStats> {
    return this.get<OverviewStats>(this.api.overview);
  }

  brand(): Observable<BrandProfile> {
    return this.get<BrandProfile>(this.api.brand);
  }

  saveBrand(body: Partial<BrandProfile>): Observable<BrandProfile> {
    return this.put<BrandProfile>(this.api.brand, body);
  }

  campaigns(status?: string): Observable<Campaign[]> {
    return this.get<Campaign[]>(this.api.campaigns, { status });
  }

  campaign(id: string): Observable<Campaign> {
    return this.get<Campaign>(`${this.api.campaigns}/${id}`);
  }

  createCampaign(body: { title: string; objective?: string; targetAudience?: string; strategyBody?: string }): Observable<Campaign> {
    return this.post<Campaign>(this.api.campaigns, body);
  }

  pauseCampaign(id: string): Observable<Campaign> {
    return this.post<Campaign>(`${this.api.campaigns}/${id}/pause`, {});
  }

  resumeCampaign(id: string): Observable<Campaign> {
    return this.post<Campaign>(`${this.api.campaigns}/${id}/resume`, {});
  }

  content(params?: { status?: string; campaignId?: string }): Observable<ContentItem[]> {
    return this.get<ContentItem[]>(this.api.content, params);
  }

  contentItem(id: string): Observable<ContentItem> {
    return this.get<ContentItem>(`${this.api.content}/${id}`);
  }

  updateContent(id: string, body: UpdateContentRequest): Observable<ContentItem> {
    return this.put<ContentItem>(`${this.api.content}/${id}`, body);
  }

  submitForReview(id: string): Observable<ContentItem> {
    return this.post<ContentItem>(`${this.api.content}/${id}/submit`, {});
  }

  approveContent(id: string, fingerprint?: string | null): Observable<ContentItem> {
    const query = fingerprint ? `?fingerprint=${encodeURIComponent(fingerprint)}` : '';
    return this.post<ContentItem>(`${this.api.content}/${id}/approve${query}`, {});
  }

  rejectContent(id: string, reason?: string): Observable<ContentItem> {
    return this.post<ContentItem>(`${this.api.content}/${id}/reject`, { reason });
  }

  calendar(params: { from: string; to: string; view?: string }): Observable<ContentItem[]> {
    return this.get<CalendarResponse>(this.api.calendar, params).pipe(
      map((response) => response?.items ?? []),
    );
  }

  schedule(id: string, body: ScheduleContentRequest): Observable<PublishJob> {
    return this.post<PublishJob>(`${this.api.content}/${id}/schedule`, body);
  }

  assets(params?: { contentItemId?: string; campaignId?: string }): Observable<ContentAsset[]> {
    return this.get<ContentAsset[]>(this.api.assets, params);
  }

  generateGraphic(body: GenerateGraphicRequest): Observable<ContentAsset> {
    return this.post<ContentAsset>(`${this.api.assets}/graphic`, body);
  }

  research(kind?: string): Observable<ResearchReport[]> {
    return this.get<ResearchReport[]>(this.api.research, { kind });
  }

  syncAnalytics(body?: { contentItemId?: string; campaignId?: string; allowSandbox?: boolean }): Observable<SyncAnalyticsResult> {
    return this.post<SyncAnalyticsResult>(`${this.api.analytics}/sync`, body ?? {});
  }

  policy(): Observable<MarketingPolicy> {
    return this.get<MarketingPolicy>(this.api.policy);
  }

  savePolicy(body: Partial<MarketingPolicy>): Observable<MarketingPolicy> {
    return this.put<MarketingPolicy>(this.api.policy, body);
  }

  accounts(): Observable<ConnectedAccount[]> {
    return this.get<ConnectedAccount[]>(this.api.accounts);
  }

  performanceReport(campaignId?: string): Observable<PerformanceReport> {
    return this.get<PerformanceReport>(`${this.api.reports}/performance`, { campaignId });
  }
}
