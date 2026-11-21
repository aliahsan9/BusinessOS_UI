import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EnterpriseService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/enterprise`;

  getHierarchy(): Observable<unknown> {
    return this.http.get(`${this.base}/hierarchy`);
  }

  getBranches(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/branches`);
  }

  saveBranch(body: unknown, id?: string): Observable<unknown> {
    return id
      ? this.http.put(`${this.base}/branches/${id}`, body)
      : this.http.post(`${this.base}/branches`, body);
  }

  getPermissionGroups(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/permission-groups`);
  }

  getApprovalPolicies(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/approval-policies`);
  }

  saveApprovalPolicy(body: unknown, id?: string): Observable<unknown> {
    return id
      ? this.http.put(`${this.base}/approval-policies/${id}`, body)
      : this.http.post(`${this.base}/approval-policies`, body);
  }

  getApprovalRequests(status?: string): Observable<unknown[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<unknown[]>(`${this.base}/approval-requests`, { params });
  }

  decideApproval(id: string, approve: boolean, note?: string, rejectionReason?: string): Observable<unknown> {
    return this.http.post(`${this.base}/approval-requests/${id}/decide`, {
      approve,
      note,
      rejectionReason,
    });
  }

  getAudit(query: Record<string, string | number | undefined> = {}): Observable<unknown> {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.length > 0) {
        params = params.set(key, String(value));
      }
    });
    return this.http.get(`${this.base}/audit`, { params });
  }

  getSsoConfigurations(): Observable<unknown[]> {
    return this.http.get<unknown[]>(`${this.base}/sso/configurations`);
  }

  saveSsoConfiguration(body: unknown, id?: string): Observable<unknown> {
    return id
      ? this.http.put(`${this.base}/sso/configurations/${id}`, body)
      : this.http.post(`${this.base}/sso/configurations`, body);
  }

  getSecuritySettings(): Observable<unknown> {
    return this.http.get(`${this.base}/security-settings`);
  }

  saveSecuritySettings(body: unknown): Observable<unknown> {
    return this.http.put(`${this.base}/security-settings`, body);
  }

  getBranchReport(): Observable<unknown> {
    return this.http.get(`${this.base}/reports/branches`);
  }

  getAgentGovernance(key: string): Observable<unknown> {
    return this.http.get(`${this.base}/agents/${encodeURIComponent(key)}/governance`);
  }

  saveAgentGovernance(key: string, body: unknown): Observable<unknown> {
    return this.http.put(`${this.base}/agents/${encodeURIComponent(key)}/governance`, body);
  }

  beginMfaSetup(): Observable<{ sharedKey: string; authenticatorUri: string }> {
    return this.http.post<{ sharedKey: string; authenticatorUri: string }>(`${this.base}/mfa/setup`, {});
  }

  enableMfa(code: string): Observable<void> {
    return this.http.post<void>(`${this.base}/mfa/enable`, { code });
  }
}
