import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  NalvaAgentCard,
  NalvaAuditEntry,
  NalvaAgentDetail,
  NalvaAnalytics,
  NalvaAgentOutcome,
  NalvaApproval,
  NalvaExecution,
  NalvaKnowledge,
  NalvaMemory,
  NalvaModel,
  NalvaOverview,
  NalvaRunResult,
  NalvaSettings,
  NalvaTask,
  NalvaWorkflow,
  NalvaWorkflowRun,
  NalvaWorkforceRecommendation,
} from '../models/nalva.model';
import {
  SupportChannel,
  SupportOverview,
  SupportProcessResult,
  SupportTicketDetail,
  SupportTicketListItem,
} from '../models/support.model';
import {
  SalesAgentCommandCenter,
  SalesAgentObjective,
  SalesAgentSettings,
  SalesCampaignReport,
  SalesOutreachMessage,
  SalesResearchProviderStatus,
} from '../models/sales-agent.model';
import {
  DeliveryTracking,
  DemandInsight,
  InventoryRisk,
  PreparePurchaseOrderRequest,
  PreparedPurchaseOrder,
  ProcurementActivity,
  ProcurementAutomationSettings,
  ProcurementAutomationSettingsWrite,
  ProcurementOverview,
  ProcurementRecommendation,
  ReceiveVerificationRequest,
  ReceiveVerificationResult,
  SubmitPreparedPurchaseRequest,
  SupplierOption,
} from '../models/procurement-agent.model';

@Injectable({ providedIn: 'root' })
export class NalvaService extends BaseApiService {
  overview(): Observable<NalvaOverview> {
    return this.get<NalvaOverview>('/nalva/overview');
  }

  marketplace(): Observable<NalvaAgentCard[]> {
    return this.get<NalvaAgentCard[]>('/nalva/marketplace');
  }

  myAgents(): Observable<NalvaAgentCard[]> {
    return this.get<NalvaAgentCard[]>('/nalva/agents');
  }

  agent(key: string): Observable<NalvaAgentDetail> {
    return this.get<NalvaAgentDetail>(`/nalva/agents/${key}`);
  }

  activate(key: string): Observable<NalvaAgentDetail> {
    return this.post<NalvaAgentDetail>(`/nalva/agents/${key}/activate`, {});
  }

  deactivate(key: string): Observable<NalvaAgentDetail> {
    return this.post<NalvaAgentDetail>(`/nalva/agents/${key}/deactivate`, {});
  }

  configure(key: string, body: Record<string, unknown>): Observable<NalvaAgentDetail> {
    return this.put<NalvaAgentDetail>(`/nalva/agents/${key}`, body);
  }

  run(key: string, objective: string, tools?: string[]): Observable<NalvaRunResult> {
    return this.post<NalvaRunResult>(`/nalva/agents/${key}/run`, { objective, tools });
  }

  tasks(agentKey?: string, status?: string): Observable<NalvaTask[]> {
    return this.get<NalvaTask[]>('/nalva/tasks', { agentKey, status });
  }

  enqueue(key: string, objective: string, options?: { deadline?: string; parentTaskId?: string; priority?: number }): Observable<NalvaTask> {
    return this.post<NalvaTask>(`/nalva/agents/${key}/tasks`, { objective, ...options });
  }

  cancelTask(id: string): Observable<NalvaTask> {
    return this.post<NalvaTask>(`/nalva/tasks/${id}/cancel`, {});
  }

  pauseTask(id: string): Observable<NalvaTask> {
    return this.post<NalvaTask>(`/nalva/tasks/${id}/pause`, {});
  }

  resumeTask(id: string): Observable<NalvaTask> {
    return this.post<NalvaTask>(`/nalva/tasks/${id}/resume`, {});
  }

  retryTask(id: string): Observable<NalvaTask> {
    return this.post<NalvaTask>(`/nalva/tasks/${id}/retry`, {});
  }

  workflows(): Observable<NalvaWorkflow[]> {
    return this.get<NalvaWorkflow[]>('/nalva/workflows');
  }

  saveWorkflow(body: Record<string, unknown>): Observable<NalvaWorkflow> {
    return this.post<NalvaWorkflow>('/nalva/workflows', body);
  }

  setWorkflowActive(id: string, active: boolean): Observable<NalvaWorkflow> {
    return this.post<NalvaWorkflow>(`/nalva/workflows/${id}/${active ? 'activate' : 'deactivate'}`, {});
  }

  runWorkflow(id: string): Observable<NalvaWorkflowRun> {
    return this.post<NalvaWorkflowRun>(`/nalva/workflows/${id}/run`, {});
  }

  testWorkflow(id: string, argumentsJson = '{}'): Observable<NalvaWorkflowRun> {
    return this.post<NalvaWorkflowRun>(`/nalva/workflows/${id}/test`, { argumentsJson });
  }

  workflowRuns(): Observable<NalvaWorkflowRun[]> {
    return this.get<NalvaWorkflowRun[]>('/nalva/workflows/runs');
  }

  approvals(status?: string): Observable<NalvaApproval[]> {
    return this.get<NalvaApproval[]>('/nalva/approvals', { status });
  }

  decide(id: string, decision: 'approve' | 'reject' | 'changes', note?: string): Observable<NalvaRunResult> {
    return this.post<NalvaRunResult>(`/nalva/approvals/${id}/${decision}`, { note });
  }

  knowledge(agentKey?: string): Observable<NalvaKnowledge[]> {
    return this.get<NalvaKnowledge[]>('/nalva/knowledge', { agentKey });
  }

  addKnowledge(title: string, content: string, agentKey?: string): Observable<NalvaKnowledge> {
    return this.post<NalvaKnowledge>('/nalva/knowledge', { title, content, agentKey });
  }

  deleteKnowledge(id: string): Observable<void> {
    return this.delete<void>(`/nalva/knowledge/${id}`);
  }

  memory(agentKey: string): Observable<NalvaMemory[]> {
    return this.get<NalvaMemory[]>(`/nalva/agents/${agentKey}/memory`);
  }

  deleteMemory(id: string): Observable<void> {
    return this.delete<void>(`/nalva/memory/${id}`);
  }

  executions(agentKey?: string, status?: string): Observable<NalvaExecution[]> {
    return this.get<NalvaExecution[]>('/nalva/executions', { agentKey, status });
  }

  /**
   * @deprecated Dedicated /agents/audit-history is not implemented.
   * Prefer executions() for the verified tenant-scoped audit trail.
   */
  agentAuditHistory(limit = 50): Observable<NalvaAuditEntry[]> {
    return this.get<NalvaAuditEntry[]>('/agents/audit-history', { limit });
  }

  analytics(agentKey?: string, category?: string): Observable<NalvaAnalytics> {
    return this.get<NalvaAnalytics>('/nalva/analytics', { agentKey, category });
  }

  outcomes(agentKey?: string): Observable<NalvaAgentOutcome[]> {
    return this.get<NalvaAgentOutcome[]>('/nalva/outcomes', { agentKey });
  }

  workforceRecommendation(): Observable<NalvaWorkforceRecommendation> {
    return this.get<NalvaWorkforceRecommendation>('/nalva/workforce/recommendation');
  }

  applyWorkforcePack(body?: {
    activateRecommendedAgents?: boolean;
    activateRecommendedWorkflows?: boolean;
    onlyAgentKeys?: string[];
  }): Observable<{ packKey: string; activatedAgents: string[]; activatedWorkflows: string[]; skipped: string[] }> {
    return this.post('/nalva/workforce/apply', body ?? { activateRecommendedAgents: true, activateRecommendedWorkflows: false });
  }

  settings(): Observable<NalvaSettings> {
    return this.get<NalvaSettings>('/nalva/settings');
  }

  saveSettings(body: Record<string, unknown>): Observable<NalvaSettings> {
    return this.put<NalvaSettings>('/nalva/settings', body);
  }

  models(): Observable<NalvaModel[]> {
    return this.get<NalvaModel[]>('/nalva/models');
  }

  integrationMarketplace(): Observable<IntegrationProviderCard[]> {
    return this.get<IntegrationProviderCard[]>('/integrations/marketplace');
  }

  beginIntegration(provider: string, redirectUri: string, shopDomain?: string): Observable<{ serverConfigured: boolean; authorizationUrl?: string; message: string }> {
    return this.post('/integrations/' + provider + '/authorize', { redirectUri, shopDomain });
  }

  completeIntegration(provider: string, code: string, state: string): Observable<unknown> {
    return this.post('/integrations/' + provider + '/callback', { code, state });
  }

  disconnectIntegration(id: string): Observable<unknown> {
    return this.post(`/integrations/connections/${id}/disconnect`, {});
  }

  testIntegration(id: string): Observable<{ performed: boolean; status: string; message: string }> {
    return this.post(`/integrations/connections/${id}/test`, {});
  }

  supportOverview(): Observable<SupportOverview> {
    return this.get<SupportOverview>('/nalva/support/overview');
  }

  supportChannels(): Observable<SupportChannel[]> {
    return this.get<SupportChannel[]>('/nalva/support/channels');
  }

  supportTickets(status?: string, priority?: string): Observable<SupportTicketListItem[]> {
    return this.get<SupportTicketListItem[]>('/nalva/support/tickets', { status, priority });
  }

  supportTicket(id: string): Observable<SupportTicketDetail> {
    return this.get<SupportTicketDetail>(`/nalva/support/tickets/${id}`);
  }

  supportInbound(body: Record<string, unknown>): Observable<SupportProcessResult> {
    return this.post<SupportProcessResult>('/nalva/support/inbound', body);
  }

  supportReply(id: string, body: string, options?: { sendToCustomer?: boolean; isInternalNote?: boolean; channel?: string }): Observable<unknown> {
    return this.post(`/nalva/support/tickets/${id}/reply`, { body, ...options });
  }

  supportEscalate(id: string, reason: string, recommendedAction?: string): Observable<SupportTicketDetail> {
    return this.post<SupportTicketDetail>(`/nalva/support/tickets/${id}/escalate`, { reason, recommendedAction });
  }

  supportResolve(id: string, resolution: string, close = false): Observable<SupportTicketDetail> {
    return this.post<SupportTicketDetail>(`/nalva/support/tickets/${id}/resolve`, { resolution, close, scheduleFollowUp: true });
  }

  supportTakeover(id: string, enabled = true, note?: string): Observable<SupportTicketDetail> {
    return this.post<SupportTicketDetail>(`/nalva/support/tickets/${id}/takeover`, { enabled, note });
  }

  supportReopen(id: string, reason?: string): Observable<SupportTicketDetail> {
    return this.post<SupportTicketDetail>(`/nalva/support/tickets/${id}/reopen`, { reason });
  }

  salesCommandCenter(): Observable<SalesAgentCommandCenter> {
    return this.get<SalesAgentCommandCenter>('/nalva/sales-agent/command-center');
  }

  salesSettings(): Observable<SalesAgentSettings> {
    return this.get<SalesAgentSettings>('/nalva/sales-agent/settings');
  }

  saveSalesSettings(body: Record<string, unknown>): Observable<SalesAgentSettings> {
    return this.put<SalesAgentSettings>('/nalva/sales-agent/settings', body);
  }

  assignSalesObjective(body: {
    objective: string;
    targetProspectCount?: number;
    idealCustomerProfileJson?: string;
    queueExecution?: boolean;
    delegatedByAgentKey?: string;
  }): Observable<SalesAgentObjective> {
    return this.post<SalesAgentObjective>('/nalva/sales-agent/objectives', body);
  }

  pauseSalesAgent(): Observable<SalesAgentSettings> {
    return this.post<SalesAgentSettings>('/nalva/sales-agent/pause', {});
  }

  resumeSalesAgent(): Observable<SalesAgentSettings> {
    return this.post<SalesAgentSettings>('/nalva/sales-agent/resume', {});
  }

  salesResearchProviders(): Observable<SalesResearchProviderStatus[]> {
    return this.get<SalesResearchProviderStatus[]>('/nalva/sales-agent/research-providers');
  }

  salesCampaignReport(objectiveId?: string, campaignId?: string): Observable<SalesCampaignReport> {
    return this.get<SalesCampaignReport>('/nalva/sales-agent/reports/campaign', { objectiveId, campaignId });
  }

  simulateSalesReply(body: {
    outreachMessageId: string;
    replySummary: string;
    scheduleFollowUp?: boolean;
    followUpDays?: number;
  }): Observable<SalesOutreachMessage> {
    return this.post<SalesOutreachMessage>('/nalva/sales-agent/replies/simulate', body);
  }

  procurementOverview(): Observable<ProcurementOverview> {
    return this.get<ProcurementOverview>('/nalva/procurement/overview');
  }

  procurementRisks(): Observable<InventoryRisk[]> {
    return this.get<InventoryRisk[]>('/nalva/procurement/risks');
  }

  procurementDemand(productId?: string): Observable<DemandInsight[]> {
    return this.get<DemandInsight[]>('/nalva/procurement/demand', { productId });
  }

  procurementRecommendations(): Observable<ProcurementRecommendation[]> {
    return this.get<ProcurementRecommendation[]>('/nalva/procurement/recommendations');
  }

  procurementCompareSuppliers(productId: string, quantity: number): Observable<SupplierOption[]> {
    return this.get<SupplierOption[]>('/nalva/procurement/suppliers/compare', { productId, quantity });
  }

  procurementPrepare(body: PreparePurchaseOrderRequest): Observable<PreparedPurchaseOrder> {
    return this.post<PreparedPurchaseOrder>('/nalva/procurement/prepare', body);
  }

  procurementSubmit(recommendationId: string, body: SubmitPreparedPurchaseRequest): Observable<PreparedPurchaseOrder> {
    return this.post<PreparedPurchaseOrder>(`/nalva/procurement/submit/${recommendationId}`, body);
  }

  procurementDeliveries(): Observable<DeliveryTracking[]> {
    return this.get<DeliveryTracking[]>('/nalva/procurement/deliveries');
  }

  procurementReceive(body: ReceiveVerificationRequest): Observable<ReceiveVerificationResult> {
    return this.post<ReceiveVerificationResult>('/nalva/procurement/receive', body);
  }

  procurementActivity(): Observable<ProcurementActivity[]> {
    return this.get<ProcurementActivity[]>('/nalva/procurement/activity');
  }

  procurementAutomation(): Observable<ProcurementAutomationSettings> {
    return this.get<ProcurementAutomationSettings>('/nalva/procurement/automation');
  }

  saveProcurementAutomation(body: ProcurementAutomationSettingsWrite): Observable<ProcurementAutomationSettings> {
    return this.put<ProcurementAutomationSettings>('/nalva/procurement/automation', body);
  }

  procurementMonitorRun(): Observable<{ ran: boolean }> {
    return this.post<{ ran: boolean }>('/nalva/procurement/monitor/run', {});
  }
}

export interface IntegrationProviderCard {
  key: string;
  name: string;
  category: string;
  description: string;
  implementationStatus: string;
  serverConfigured: boolean;
  providerVerified: boolean;
  readOperations: string[];
  writeOperations: string[];
  connectionStatus: string;
  connectionId?: string;
}
