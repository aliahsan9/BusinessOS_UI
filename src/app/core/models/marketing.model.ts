/** Approval lifecycle for marketing content. */
export type ApprovalStatus =
  | 'Draft'
  | 'Review'
  | 'Approved'
  | 'Scheduled'
  | 'Publishing'
  | 'Published'
  | 'Rejected'
  | 'Failed'
  | 'Cancelled'
  | 'Expired'
  | string;

export interface BrandProfile {
  id: string;
  businessName: string;
  industry?: string | null;
  productsServicesJson?: string;
  targetAudience?: string | null;
  brandDescription?: string | null;
  brandVoice?: string | null;
  brandColorsJson?: string;
  logoUrl?: string | null;
  website?: string | null;
  socialAccountsJson?: string;
  marketingObjectivesJson?: string;
  preferredLanguagesJson?: string;
  contentRestrictions?: string | null;
  competitorsJson?: string;
  marketingPreferencesJson?: string;
  sourceNotes?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface Campaign {
  id: string;
  title: string;
  objective: string;
  targetAudience?: string | null;
  contentThemesJson?: string;
  recommendedPlatformsJson?: string;
  publishingFrequency?: string | null;
  contentFormatsJson?: string;
  startDate?: string | null;
  endDate?: string | null;
  successMetricsJson?: string;
  estimatedAiCostUsd?: number;
  status: string;
  strategyBody?: string | null;
  strategyApproved?: boolean;
  strategyApprovedAt?: string | null;
  agentKey?: string | null;
  createdAt?: string;
}

export interface ContentAsset {
  id: string;
  contentItemId?: string | null;
  campaignId?: string | null;
  kind: string;
  platform?: string | null;
  width?: number | null;
  height?: number | null;
  prompt?: string | null;
  brief?: string | null;
  storageUrl?: string | null;
  storagePath?: string | null;
  mimeType?: string | null;
  source: string;
  brandCompliant: boolean;
  status: string;
  createdAt?: string;
}

export interface ContentItem {
  id: string;
  campaignId?: string | null;
  title: string;
  body: string;
  platform: string;
  contentType: string;
  caption?: string | null;
  hashtagsJson?: string;
  callToAction?: string | null;
  suggestedPublishAt?: string | null;
  scheduledPublishAt?: string | null;
  imageAssetIdsJson?: string;
  approvalStatus: ApprovalStatus;
  approvalFingerprint?: string | null;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  connectedAccountProvider?: string | null;
  connectedAccountExternalId?: string | null;
  externalPostId?: string | null;
  lastError?: string | null;
  agentKey?: string | null;
  createdAt?: string;
}

export interface ResearchReport {
  id: string;
  kind: string;
  title: string;
  body: string;
  sourcesJson?: string;
  competitorNamesJson?: string;
  themesJson?: string;
  keywordsJson?: string;
  opportunitiesJson?: string;
  generatedAt?: string;
  agentKey?: string | null;
  fabricated: boolean;
}

export interface OverviewStats {
  campaigns: number;
  activeCampaigns: number;
  contentDrafts: number;
  contentInReview: number;
  contentApproved: number;
  contentScheduled: number;
  contentPublished: number;
  researchReports: number;
  publishJobsPending: number;
  analyticsSnapshots: number;
  hasBrandProfile: boolean;
  dataClassification: string;
}

/** Connected social account — never includes OAuth tokens. */
export interface ConnectedAccount {
  provider: string;
  connectionId?: string | null;
  status: string;
  externalAccountId?: string | null;
  externalAccountLabel?: string | null;
  publishAvailable: boolean;
  notes: string;
}

export interface AnalyticsSnapshot {
  id: string;
  contentItemId?: string | null;
  campaignId?: string | null;
  provider: string;
  externalPostId?: string | null;
  metricsJson?: string | null;
  syncedAt: string;
  dataSource: string;
  unavailableMetricsJson?: string;
}

export interface CalendarResponse {
  from: string;
  to: string;
  view: string;
  items: ContentItem[];
}

export interface MarketingPolicy {
  id: string;
  requireApprovalBeforePublish: boolean;
  dailyPublishLimit: number;
  weeklyAiBudgetUsd: number;
  monthlyAiBudgetUsd: number;
  timeZoneId: string;
  dailyCronEnabled: boolean;
  weeklyCronEnabled: boolean;
  monthlyCronEnabled: boolean;
  pausedReason?: string | null;
  isPaused: boolean;
}

export interface PerformanceReport {
  title: string;
  body: string;
  verifiedMetricsJson?: string;
  unavailableMetricsJson?: string;
  dataSourcesJson?: string;
  generatedAt: string;
  fabricated: boolean;
}

export interface SyncAnalyticsResult {
  snapshotsCreated: number;
  dataSource: string;
  message: string;
  snapshots?: AnalyticsSnapshot[];
}

export interface PublishJob {
  id: string;
  contentItemId: string;
  provider: string;
  accountExternalId: string;
  runAtUtc: string;
  status: string;
  attempt: number;
  idempotencyKey: string;
  lastError?: string | null;
  externalPostId?: string | null;
}

export interface ScheduleContentRequest {
  runAtUtc?: string | null;
  connectedAccountProvider?: string | null;
  connectedAccountExternalId?: string | null;
  idempotencyKey?: string | null;
}

export interface UpdateContentRequest {
  title?: string;
  body?: string;
  caption?: string | null;
  hashtagsJson?: string;
  callToAction?: string | null;
  suggestedPublishAt?: string | null;
  scheduledPublishAt?: string | null;
  imageAssetIdsJson?: string;
  connectedAccountProvider?: string | null;
  connectedAccountExternalId?: string | null;
}

export interface GenerateGraphicRequest {
  contentItemId?: string;
  campaignId?: string | null;
  platform?: string;
  prompt?: string;
  brief?: string;
}
