import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { API_ENDPOINTS } from '../constants/api.constants';

export interface MarketingLeadWrite {
  fullName: string;
  email: string;
  company?: string;
  kind: 'Contact' | 'Demo' | 'Waitlist' | 'Support';
  topic: string;
  subject: string;
  message: string;
  sourcePath?: string;
  referralCode?: string;
  marketingOptIn: boolean;
}

export interface MarketingLeadDto {
  id: string;
  fullName: string;
  email: string;
  company?: string;
  kind: string;
  topic: string;
  subject: string;
  message: string;
  status: string;
  sourcePath?: string;
  referralCode?: string;
  marketingOptIn: boolean;
  createdAt: string;
}

export interface PlatformSupportTicketWrite {
  requesterName?: string;
  requesterEmail?: string;
  category: string;
  subject: string;
  message: string;
  priority?: string;
}

export interface PlatformSupportTicketDto {
  id: string;
  requesterName: string;
  requesterEmail: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  agentReply?: string;
  escalatedToHuman: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface ReferralCodeDto {
  id: string;
  code: string;
  isActive: boolean;
  redemptionCount: number;
  maxRedemptions: number;
  sharePath: string;
}

export interface SaaSAnalyticsDto {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  failedPayments: number;
  newSubscriptionsThisMonth: number;
  churnedThisMonth: number;
  activeAfterTrial: number;
  openSupportTickets: number;
  newMarketingLeadsThisMonth: number;
  averageRevenuePerTenant?: number | null;
  trialToPaidConversionRate?: number | null;
  monthlyChurnRate?: number | null;
  estimatedAiCostPerTenantUsd?: number | null;
  estimatedGrossMarginUsd?: number | null;
  customerLifetimeValue?: number | null;
  customerAcquisitionCost?: number | null;
  measuredMetrics: string[];
  estimatedMetrics: string[];
  unavailableMetrics: string[];
  note: string;
}

export interface CompanySummaryDto {
  id: string;
  name: string;
  businessType: string;
  status: string;
  isActive: boolean;
  email: string;
  subscriptionPlan: string;
  subscriptionStatus?: string;
  createdAt: string;
  memberCount: number;
}

export interface PlatformRevenueDto {
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  cancelledSubscriptions: number;
  failedPayments: number;
  collectedRevenue: number;
  bookedRevenue: number;
  trialPipelineMonthly: number;
  atRiskMonthly: number;
  estimatedCopilotCostUsd: number;
  estimatedAgentCostUsd: number;
  newSubscriptionsThisMonth: number;
  churnedThisMonth: number;
  note: string;
}

@Injectable({ providedIn: 'root' })
export class GrowthService extends BaseApiService {
  submitLead(body: MarketingLeadWrite): Observable<MarketingLeadDto> {
    return this.post<MarketingLeadDto>(API_ENDPOINTS.growth.leads, body);
  }

  createSupportTicket(body: PlatformSupportTicketWrite): Observable<PlatformSupportTicketDto> {
    return this.post<PlatformSupportTicketDto>(API_ENDPOINTS.growth.support, body);
  }

  listMySupportTickets(): Observable<PlatformSupportTicketDto[]> {
    return this.get<PlatformSupportTicketDto[]>(API_ENDPOINTS.growth.mySupport);
  }

  getMyReferralCode(): Observable<ReferralCodeDto> {
    return this.get<ReferralCodeDto>(API_ENDPOINTS.growth.myReferral);
  }

  validateReferral(code: string): Observable<{ valid: boolean; code?: string; message?: string }> {
    return this.get(API_ENDPOINTS.growth.validateReferral, { code });
  }

  listLeads(status?: string, kind?: string): Observable<MarketingLeadDto[]> {
    return this.get<MarketingLeadDto[]>(API_ENDPOINTS.platform.leads, { status, kind });
  }

  listPlatformSupport(status?: string): Observable<PlatformSupportTicketDto[]> {
    return this.get<PlatformSupportTicketDto[]>(API_ENDPOINTS.platform.support, { status });
  }

  getSaaSAnalytics(): Observable<SaaSAnalyticsDto> {
    return this.get<SaaSAnalyticsDto>(API_ENDPOINTS.platform.saasAnalytics);
  }

  listCompanies(search?: string): Observable<{ items: CompanySummaryDto[]; totalCount: number }> {
    return this.get(API_ENDPOINTS.platform.companies, { search, page: 1, pageSize: 50 });
  }

  getRevenue(): Observable<PlatformRevenueDto> {
    return this.get<PlatformRevenueDto>(API_ENDPOINTS.platform.revenue);
  }

  getPlatformHealth(): Observable<{ status: string; databaseConnected: boolean; aiProviderConfigured: boolean; checkedAt: string }> {
    return this.get(API_ENDPOINTS.platform.health);
  }
}
