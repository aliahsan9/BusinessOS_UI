import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { PermissionCodes } from '../../core/constants/permission.constants';

const view = permissionGuard([PermissionCodes.nalva.view], false);

export const NALVA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./nalva-shell.component').then((m) => m.NalvaShellComponent),
    canActivate: [view],
    children: [
      { path: '', loadComponent: () => import('./overview.component').then((m) => m.NalvaOverviewComponent), title: 'Nalva.ai | BusinessOS' },
      { path: 'workforce', loadComponent: () => import('./workforce.component').then((m) => m.NalvaWorkforceComponent), title: 'AI Workforce | BusinessOS' },
      { path: 'command', loadComponent: () => import('../experience/command-center.component').then((m) => m.CommandCenterComponent), title: 'AI Command Center | BusinessOS' },
      { path: 'marketplace', loadComponent: () => import('./marketplace.component').then((m) => m.NalvaMarketplaceComponent), title: 'Agent marketplace | BusinessOS' },
      { path: 'agents', loadComponent: () => import('./marketplace.component').then((m) => m.NalvaMarketplaceComponent), data: { mine: true }, title: 'My agents | BusinessOS' },
      { path: 'agents/procurement', redirectTo: 'procurement', pathMatch: 'full' },
      { path: 'agents/finance', redirectTo: 'finance', pathMatch: 'full' },
      { path: 'agents/:key', loadComponent: () => import('./agent-detail.component').then((m) => m.NalvaAgentDetailComponent), title: 'Agent | BusinessOS' },
      { path: 'procurement', loadComponent: () => import('./procurement-workspace.component').then((m) => m.NalvaProcurementWorkspaceComponent), title: 'Inventory & Procurement Agent | BusinessOS' },
      { path: 'finance', loadComponent: () => import('./finance-workspace.component').then((m) => m.NalvaFinanceWorkspaceComponent), title: 'Finance Agent | BusinessOS' },
      { path: 'executive-intelligence', loadComponent: () => import('./executive-intelligence.component').then((m) => m.NalvaExecutiveIntelligenceComponent), title: 'Executive Intelligence | BusinessOS' },
      { path: 'tasks', loadComponent: () => import('./tasks.component').then((m) => m.NalvaTasksComponent), title: 'Agent tasks | BusinessOS' },
      { path: 'workflows', loadComponent: () => import('./workflows.component').then((m) => m.NalvaWorkflowsComponent), title: 'Workflows | BusinessOS' },
      { path: 'builder', loadComponent: () => import('./workflow-builder.component').then((m) => m.NalvaWorkflowBuilderComponent), title: 'Workflow builder | BusinessOS' },
      { path: 'automation', loadComponent: () => import('./automation.component').then((m) => m.NalvaAutomationComponent), title: 'Automation | BusinessOS' },
      {
        path: 'marketing',
        loadComponent: () => import('./marketing/marketing-shell.component').then((m) => m.MarketingShellComponent),
        title: 'Marketing Agent | BusinessOS',
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'overview' },
          { path: 'overview', loadComponent: () => import('./marketing/marketing-overview.component').then((m) => m.MarketingOverviewComponent), title: 'Marketing overview | BusinessOS' },
          { path: 'calendar', loadComponent: () => import('./marketing/marketing-calendar.component').then((m) => m.MarketingCalendarComponent), title: 'Content calendar | BusinessOS' },
          { path: 'studio', loadComponent: () => import('./marketing/marketing-studio.component').then((m) => m.MarketingStudioComponent), title: 'Content studio | BusinessOS' },
          { path: 'campaigns', loadComponent: () => import('./marketing/marketing-campaigns.component').then((m) => m.MarketingCampaignsComponent), title: 'Campaigns | BusinessOS' },
          { path: 'accounts', loadComponent: () => import('./marketing/marketing-accounts.component').then((m) => m.MarketingAccountsComponent), title: 'Marketing accounts | BusinessOS' },
        ],
      },
      { path: 'integrations', loadComponent: () => import('./integrations.component').then((m) => m.NalvaIntegrationsComponent), title: 'Integrations | BusinessOS' },

      { path: 'integrations/callback', loadComponent: () => import('./integrations.component').then((m) => m.NalvaIntegrationsComponent), title: 'Integration callback | BusinessOS' },
      { path: 'approvals', loadComponent: () => import('./approvals.component').then((m) => m.NalvaApprovalsComponent), title: 'Approvals | BusinessOS' },
      { path: 'support', loadComponent: () => import('./support-workspace.component').then((m) => m.NalvaSupportWorkspaceComponent), title: 'Customer Support Agent | BusinessOS' },
      { path: 'sales-agent', loadComponent: () => import('./sales-agent-command-center.component').then((m) => m.NalvaSalesAgentCommandCenterComponent), title: 'Sales Agent | BusinessOS' },
      { path: 'knowledge', loadComponent: () => import('./knowledge.component').then((m) => m.NalvaKnowledgeComponent), title: 'Knowledge | BusinessOS' },
      { path: 'history', loadComponent: () => import('./history.component').then((m) => m.NalvaHistoryComponent), title: 'Execution history | BusinessOS' },
      { path: 'audit-history', loadComponent: () => import('./audit-history.component').then((m) => m.NalvaAuditHistoryComponent), title: 'Audit history | BusinessOS' },
      { path: 'analytics', loadComponent: () => import('./analytics.component').then((m) => m.NalvaAnalyticsComponent), title: 'AI analytics | BusinessOS' },
      { path: 'settings', loadComponent: () => import('./settings.component').then((m) => m.NalvaSettingsComponent), title: 'AI settings | BusinessOS' },
    ],
  },
];
