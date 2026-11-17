import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseApiService } from './base-api.service';
import {
  NalvaAgentCard,
  NalvaAgentDetail,
  NalvaAnalytics,
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
} from '../models/nalva.model';

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

  analytics(agentKey?: string, category?: string): Observable<NalvaAnalytics> {
    return this.get<NalvaAnalytics>('/nalva/analytics', { agentKey, category });
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
