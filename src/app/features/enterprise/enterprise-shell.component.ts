import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BillingService } from '../../core/services/billing.service';
import { EnterpriseService } from '../../core/services/enterprise.service';
import { ROUTES } from '../../core/constants/route.constants';

type EnterpriseTab =
  | 'hierarchy'
  | 'approvals'
  | 'sso'
  | 'audit'
  | 'reports'
  | 'agents'
  | 'mfa';

@Component({
  selector: 'app-enterprise-shell',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './enterprise-shell.component.html',
  styleUrl: './enterprise-shell.component.scss',
})
export class EnterpriseShellComponent implements OnInit {
  private readonly enterprise = inject(EnterpriseService);
  private readonly billing = inject(BillingService);

  readonly routes = ROUTES;
  readonly tab = signal<EnterpriseTab>('hierarchy');
  readonly unlocked = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly hierarchy = signal<any>(null);
  readonly policies = signal<any[]>([]);
  readonly requests = signal<any[]>([]);
  readonly audit = signal<any>(null);
  readonly ssoConfigs = signal<any[]>([]);
  readonly security = signal<any>(null);
  readonly report = signal<any>(null);
  readonly mfaSetup = signal<{ sharedKey: string; authenticatorUri: string } | null>(null);

  branchName = '';
  branchCode = '';
  policyName = '';
  policyThreshold: number | null = 1000;
  ssoProvider = 'EntraId';
  ssoAuthority = '';
  ssoClientId = '';
  ssoSecret = '';
  requireMfa = false;
  mfaCode = '';
  agentKey = 'finance';
  deniedTools = '';

  ngOnInit(): void {
    this.billing.getCurrentPlan().subscribe({
      next: (plan) => {
        const flags = plan.featureFlags;
        this.unlocked.set(!!flags?.hasAdvancedSecurity);
        if (this.unlocked()) {
          this.loadTab('hierarchy');
        }
      },
      error: () => this.error.set('Unable to resolve subscription entitlements.'),
    });
  }

  setTab(next: EnterpriseTab): void {
    this.tab.set(next);
    if (this.unlocked()) {
      this.loadTab(next);
    }
  }

  loadTab(next: EnterpriseTab): void {
    this.loading.set(true);
    this.error.set(null);
    const done = () => this.loading.set(false);
    if (next === 'hierarchy') {
      this.enterprise.getHierarchy().subscribe({
        next: (data) => {
          this.hierarchy.set(data);
          done();
        },
        error: (err) => this.fail(err, done),
      });
      return;
    }
    if (next === 'approvals') {
      this.enterprise.getApprovalPolicies().subscribe({
        next: (policies) => {
          this.policies.set(policies as any[]);
          this.enterprise.getApprovalRequests('Pending').subscribe({
            next: (requests) => {
              this.requests.set(requests as any[]);
              done();
            },
            error: (err) => this.fail(err, done),
          });
        },
        error: (err) => this.fail(err, done),
      });
      return;
    }
    if (next === 'sso') {
      this.enterprise.getSsoConfigurations().subscribe({
        next: (configs) => {
          this.ssoConfigs.set(configs as any[]);
          this.enterprise.getSecuritySettings().subscribe({
            next: (settings: any) => {
              this.security.set(settings);
              this.requireMfa = !!settings?.requireMfa;
              done();
            },
            error: (err) => this.fail(err, done),
          });
        },
        error: (err) => this.fail(err, done),
      });
      return;
    }
    if (next === 'audit') {
      this.enterprise.getAudit({ page: 1, pageSize: 50 }).subscribe({
        next: (data) => {
          this.audit.set(data);
          done();
        },
        error: (err) => this.fail(err, done),
      });
      return;
    }
    if (next === 'reports') {
      this.enterprise.getBranchReport().subscribe({
        next: (data) => {
          this.report.set(data);
          done();
        },
        error: (err) => this.fail(err, done),
      });
      return;
    }
    if (next === 'agents') {
      this.enterprise.getAgentGovernance(this.agentKey).subscribe({
        next: (data: any) => {
          this.deniedTools = (data?.deniedTools ?? []).join(', ');
          done();
        },
        error: () => done(),
      });
      return;
    }
    if (next === 'mfa') {
      done();
    }
  }

  createBranch(): void {
    this.enterprise
      .saveBranch({
        name: this.branchName,
        code: this.branchCode || null,
        isHeadquarters: false,
        isActive: true,
      })
      .subscribe({
        next: () => {
          this.branchName = '';
          this.branchCode = '';
          this.loadTab('hierarchy');
        },
        error: (err) => this.fail(err),
      });
  }

  createExpensePolicy(): void {
    this.enterprise
      .saveApprovalPolicy({
        name: this.policyName || 'Expense threshold',
        triggerType: 'ExpenseAmount',
        amountThreshold: this.policyThreshold,
        mode: 'Sequential',
        deadlineHours: 72,
        isActive: true,
        steps: [
          {
            stepOrder: 1,
            approverType: 'Role',
            approverRoleName: 'Manager',
            requireDepartmentHead: false,
          },
        ],
      })
      .subscribe({
        next: () => {
          this.policyName = '';
          this.loadTab('approvals');
        },
        error: (err) => this.fail(err),
      });
  }

  decide(id: string, approve: boolean): void {
    this.enterprise.decideApproval(id, approve).subscribe({
      next: () => this.loadTab('approvals'),
      error: (err) => this.fail(err),
    });
  }

  saveOidc(): void {
    this.enterprise
      .saveSsoConfiguration({
        protocol: 'Oidc',
        provider: this.ssoProvider,
        isEnabled: true,
        authority: this.ssoAuthority,
        clientId: this.ssoClientId,
        clientSecret: this.ssoSecret,
        jitProvision: true,
        defaultRoleName: 'Employee',
      })
      .subscribe({
        next: () => {
          this.ssoSecret = '';
          this.loadTab('sso');
        },
        error: (err) => this.fail(err),
      });
  }

  saveSecurity(): void {
    this.enterprise
      .saveSecuritySettings({
        requireMfa: this.requireMfa,
        sessionIdleMinutes: this.security()?.sessionIdleMinutes ?? 60,
        maxConcurrentSessions: this.security()?.maxConcurrentSessions ?? 10,
        auditRetentionDays: this.security()?.auditRetentionDays ?? 365,
        enforceOrgScopeOnQueries: this.security()?.enforceOrgScopeOnQueries ?? true,
      })
      .subscribe({
        next: () => this.loadTab('sso'),
        error: (err) => this.fail(err),
      });
  }

  startMfa(): void {
    this.enterprise.beginMfaSetup().subscribe({
      next: (setup) => this.mfaSetup.set(setup),
      error: (err) => this.fail(err),
    });
  }

  enableMfa(): void {
    this.enterprise.enableMfa(this.mfaCode).subscribe({
      next: () => {
        this.mfaCode = '';
        this.error.set(null);
      },
      error: (err) => this.fail(err),
    });
  }

  saveAgentGovernance(): void {
    this.enterprise
      .saveAgentGovernance(this.agentKey, {
        deniedTools: this.deniedTools
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        sensitiveDataRestrictions: [],
        requireHumanSupervision: true,
      })
      .subscribe({
        next: () => this.loadTab('agents'),
        error: (err) => this.fail(err),
      });
  }

  private fail(err: any, done?: () => void): void {
    this.error.set(err?.error?.detail || err?.error?.message || err?.message || 'Request failed.');
    done?.();
    this.loading.set(false);
  }
}
