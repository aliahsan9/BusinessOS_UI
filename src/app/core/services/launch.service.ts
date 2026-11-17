import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';

export interface LaunchNotice {
  product: string;
  audience: string;
  status: string;
  available: string[];
  limitations: string[];
  notInThisRelease: string[];
  dataHandling: string;
  subscriptionTerms: string;
  support: string;
}

export interface AgencyTemplate {
  key: string;
  name: string;
  description: string;
  modules: string[];
  navigation: string[];
  widgets: string[];
  roles: string[];
  workflows: string[];
  agents: string[];
}

export interface LaunchPlan {
  key: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  trialDays: number;
  maxAiRequests: number;
  maxAgentExecutions: number;
  maxAutomationRuns: number;
  currency: string;
  checkoutNote: string;
}

export interface AgencyWorkspace {
  currentStep: number;
  isCompleted: boolean;
  companySaved: boolean;
  profileSaved: boolean;
  templateKey: string | null;
  services: string | null;
  technologies: string | null;
  teamSize: string | null;
  targetClients: string | null;
  goals: string | null;
  modules: string[];
  invitedEmails: string[];
  roles: string[];
  initialProjectName: string | null;
  agents: string[];
  approvalPreference: string;
  monthlyAiBudgetUsd: number | null;
  selectedPlanKey: string | null;
  firstObjective: string | null;
  firstTaskQueued: boolean;
  invitesCreated: number;
  inviteNote: string | null;
}

export interface AgencySetup {
  notice: LaunchNotice;
  invitationRequired: boolean;
  invitationRedeemed: boolean;
  workspace: AgencyWorkspace;
  templates: AgencyTemplate[];
  plans: LaunchPlan[];
}

export interface CompanyAnalytics {
  agencyOnboardingCompleted: boolean;
  usageEvents: number;
  usageByEvent: { name: string; count: number }[];
  openFeedback: number;
  supportRequests: number;
  agentExecutions: number;
  failedExecutions: number;
  workflowRuns: number;
  agentUsage: { name: string; count: number }[];
}

export interface CompanyDataRequest {
  id: string;
  kind: string;
  status: string;
  summaryJson: string | null;
  procedure: string;
}

@Injectable({ providedIn: 'root' })
export class LaunchService extends BaseApiService {
  notice(): Observable<LaunchNotice> {
    return this.get<LaunchNotice>('/launch/notice');
  }

  setup(): Observable<AgencySetup> {
    return this.get<AgencySetup>('/launch/setup');
  }

  saveCompany(body: unknown): Observable<AgencySetup> {
    return this.put<AgencySetup>('/launch/company', body);
  }

  saveProfile(body: unknown): Observable<AgencySetup> {
    return this.put<AgencySetup>('/launch/profile', body);
  }

  saveWorkspace(body: unknown): Observable<AgencySetup> {
    return this.put<AgencySetup>('/launch/workspace', body);
  }

  saveWorkforce(body: unknown): Observable<AgencySetup> {
    return this.put<AgencySetup>('/launch/workforce', body);
  }

  savePlan(body: unknown): Observable<AgencySetup> {
    return this.put<AgencySetup>('/launch/plan', body);
  }

  saveObjective(body: unknown): Observable<AgencySetup> {
    return this.put<AgencySetup>('/launch/objective', body);
  }

  redeem(code: string): Observable<{ redeemed: boolean; agencyName: string }> {
    return this.post('/launch/invitations/redeem', { code });
  }

  feedback(body: unknown): Observable<unknown> {
    return this.post('/launch/feedback', body);
  }

  analytics(): Observable<CompanyAnalytics> {
    return this.get<CompanyAnalytics>('/launch/analytics');
  }

  exportData(): Observable<CompanyDataRequest> {
    return this.post<CompanyDataRequest>('/launch/data/export', {});
  }

  requestDeletion(): Observable<CompanyDataRequest> {
    return this.post<CompanyDataRequest>('/launch/data/delete', {});
  }
}
