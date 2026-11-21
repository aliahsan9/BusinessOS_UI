export interface SalesResearchProviderStatus {
  providerKey: string;
  displayName: string;
  isAvailable: boolean;
  isFixture: boolean;
  isLiveIntegration: boolean;
  message: string;
}

export interface SalesAgentSettings {
  isPaused: boolean;
  dailyResearchLimit: number;
  maxOutreachPerDay: number;
  allowFixtureResearch: boolean;
  idealCustomerProfileJson: string;
  qualificationCriteriaJson: string;
  qualificationThreshold: number;
  researchProviderKey?: string | null;
  hasResearchApiKey: boolean;
  researchBaseUrl?: string | null;
  requireOutreachApproval: boolean;
  currentObjective?: string | null;
  activeObjectiveId?: string | null;
}

export interface SalesAgentObjective {
  id: string;
  objectiveText: string;
  status: string;
  targetProspectCount: number;
  discoveredCount: number;
  qualifiedCount: number;
  outreachDraftCount: number;
  outreachSentCount: number;
  responseCount: number;
  delegatedByAgentKey?: string | null;
  createdAt: string;
  completedAt?: string | null;
  resultSummary?: string | null;
}

export interface SalesProspect {
  id: string;
  leadId?: string | null;
  companyName: string;
  website?: string | null;
  industry?: string | null;
  country?: string | null;
  companySize?: string | null;
  publicContactEmail?: string | null;
  providerKey: string;
  sourceAttribution: string;
  researchedAt: string;
  leadScore?: number | null;
  scoreExplanation?: string | null;
  scoreIsEstimate: boolean;
  isQualified: boolean;
  isDuplicate: boolean;
  qualityStatus: string;
}

export interface SalesOutreachMessage {
  id: string;
  campaignId: string;
  leadId?: string | null;
  toEmail: string;
  subject: string;
  body: string;
  fitExplanation: string;
  status: string;
  sequenceStep: number;
  createdAt: string;
  sentAt?: string | null;
  usedTestSink: boolean;
}

export interface SalesAgentExecution {
  id: string;
  status: string;
  objective: string;
  summary?: string | null;
  startedAt: string;
  completedAt?: string | null;
  estimatedCostUsd: number;
  error?: string | null;
}

export interface SalesAgentCommandCenter {
  agentStatus: string;
  isPaused: boolean;
  currentObjective?: string | null;
  activeObjectiveId?: string | null;
  currentExecutionSummary?: string | null;
  leadsDiscovered: number;
  qualifiedLeads: number;
  pendingOutreachApprovals: number;
  emailsSent: number;
  responsesReceived: number;
  meetingsScheduled: number;
  failedTasks: number;
  estimatedCostUsd: number;
  costIsEstimate: boolean;
  researchProvider: SalesResearchProviderStatus;
  emailIntegrationConnected: boolean;
  emailIntegrationMessage: string;
  objectives: SalesAgentObjective[];
  recentProspects: SalesProspect[];
  pendingApprovals: SalesOutreachMessage[];
  executionHistory: SalesAgentExecution[];
  settings: SalesAgentSettings;
}

export interface SalesCampaignReport {
  campaignId?: string | null;
  objectiveId?: string | null;
  title: string;
  prospectsResearched: number;
  qualifiedLeads: number;
  outreachDrafts: number;
  emailsSent: number;
  responses: number;
  followUpsScheduled: number;
  failedSends: number;
  estimatedCostUsd: number;
  costIsEstimate: boolean;
  summary: string;
}
