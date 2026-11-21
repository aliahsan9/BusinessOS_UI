import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { onboardingRedirectGuard } from './core/guards/onboarding.guard';
import { themeGuard } from './core/theme/theme.guard';
import { buildFeatureRoutes } from './app-feature.routes';
import { ROUTES } from './core/constants/route.constants';
import { CRM_ROUTES, PEOPLE_ROUTES, PROJECT_OPS_ROUTES, RETURN_ROUTES, WAREHOUSE_ROUTES } from './features/workspace/workspace.routes';

export const routes: Routes = [
  {
    path: 'about',
    loadComponent: () => import('./features/about/about.component').then((m) => m.AboutComponent),
    title: 'About | BusinessOS',
  },
  {
    path: 'services',
    loadComponent: () => import('./features/services/services.component').then((m) => m.ServicesComponent),
    title: 'Services | BusinessOS',
  },
  {
    path: 'contact',
    loadComponent: () => import('./features/contact/contact.component').then((m) => m.ContactComponent),
    title: 'Contact | BusinessOS',
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/marketing/public-pricing/public-pricing.component').then((m) => m.PublicPricingComponent),
    title: 'Pricing | BusinessOS',
  },
  {
    path: 'demo',
    loadComponent: () =>
      import('./features/marketing/demo-request/demo-request.component').then((m) => m.DemoRequestComponent),
    title: 'Book a demo | BusinessOS',
  },
  {
    path: 'security',
    loadComponent: () =>
      import('./features/marketing/security-page/security-page.component').then((m) => m.SecurityPageComponent),
    title: 'Security | BusinessOS',
  },
  {
    path: 'faq',
    loadComponent: () => import('./features/faq/faq.component').then((m) => m.FaqComponent),
    title: 'FAQ | BusinessOS',
  },
  {
    path: 'privacy',
    loadComponent: () => import('./features/legal/legal-page.component').then((m) => m.LegalPageComponent),
    title: 'Privacy Policy | BusinessOS',
    data: { document: 'privacy' },
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/legal/legal-page.component').then((m) => m.LegalPageComponent),
    title: 'Terms of Service | BusinessOS',
    data: { document: 'terms' },
  },
  {
    path: 'refunds',
    loadComponent: () => import('./features/legal/legal-page.component').then((m) => m.LegalPageComponent),
    title: 'Refund Policy | BusinessOS',
    data: { document: 'refunds' },
  },
  {
    path: 'dpa',
    loadComponent: () => import('./features/legal/legal-page.component').then((m) => m.LegalPageComponent),
    title: 'Data Processing Agreement | BusinessOS',
    data: { document: 'dpa' },
  },
  {
    path: 'aup',
    loadComponent: () => import('./features/legal/legal-page.component').then((m) => m.LegalPageComponent),
    title: 'Acceptable Use Policy | BusinessOS',
    data: { document: 'aup' },
  },
  {
    path: 'insights',
    loadChildren: () => import('./features/insights/insights.routes').then((m) => m.INSIGHTS_ROUTES),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'BusinessOS | Business Management Platform',
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'register-business',
    loadComponent: () =>
      import('./features/tenant/business-registration/business-registration.component').then(
        (m) => m.BusinessRegistrationComponent,
      ),
    canActivate: [guestGuard],
    title: 'Register Business | BusinessOS',
  },
  {
    path: 'early-access',
    loadComponent: () =>
      import('./features/launch/early-access.component').then((m) => m.EarlyAccessComponent),
    title: 'Early access | BusinessOS',
  },
  {
    path: 'onboarding',
    loadChildren: () => import('./features/onboarding/onboarding.routes').then((m) => m.ONBOARDING_ROUTES),
  },
  {
    path: 'company/:slug',
    loadComponent: () =>
      import('./features/experience/public-company.component').then((m) => m.PublicCompanyComponent),
    title: 'Company | BusinessOS',
  },
  {
    path: 'supplier-portal/:token',
    loadComponent: () =>
      import('./features/experience/supplier-portal.component').then((m) => m.SupplierPortalComponent),
    title: 'Supplier portal | BusinessOS',
  },
  {
    path: 'portal/:token',
    loadComponent: () =>
      import('./features/workspace/portal/portal-page.component').then((m) => m.PortalPageComponent),
    title: 'Client portal | BusinessOS',
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./shared/pages/forbidden-page/forbidden-page.component').then((m) => m.ForbiddenPageComponent),
    title: 'Access Denied | BusinessOS',
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./shared/pages/not-found-page/not-found-page.component').then((m) => m.NotFoundPageComponent),
    title: 'Page Not Found | BusinessOS',
  },
  {
    path: '',
    loadComponent: () =>
      import('./shared/layouts/dashboard-layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    canActivate: [authGuard, themeGuard, onboardingRedirectGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'products',
        loadChildren: () => import('./features/products/products.routes').then((m) => m.PRODUCT_ROUTES),
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.routes').then((m) => m.INVENTORY_ROUTES),
      },
      {
        path: 'suppliers',
        loadChildren: () => import('./features/suppliers/suppliers.routes').then((m) => m.SUPPLIER_ROUTES),
      },
      {
        path: 'purchase-orders',
        loadChildren: () => import('./features/purchase-orders/purchase-orders.routes').then((m) => m.PURCHASE_ORDER_ROUTES),
      },
      {
        path: 'customers',
        loadChildren: () => import('./features/customers/customers.routes').then((m) => m.CUSTOMER_ROUTES),
      },
      {
        path: 'orders',
        loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDER_ROUTES),
      },
      {
        path: 'quotations',
        loadChildren: () => import('./features/quotations/quotations.routes').then((m) => m.QUOTATION_ROUTES),
      },
      {
        path: 'invoices',
        loadChildren: () => import('./features/invoices/invoices.routes').then((m) => m.INVOICE_ROUTES),
      },
      {
        path: 'payments',
        loadChildren: () => import('./features/payments/payments.routes').then((m) => m.PAYMENT_ROUTES),
      },
      {
        path: 'sales',
        loadChildren: () => import('./features/sales/sales.routes').then((m) => m.SALES_ROUTES),
      },
      {
        path: 'reports',
        loadChildren: () => import('./features/reports/reports.routes').then((m) => m.REPORT_ROUTES),
      },
      {
        path: 'analytics',
        loadChildren: () => import('./features/analytics/analytics.routes').then((m) => m.ANALYTICS_ROUTES),
      },
      {
        path: 'expenses',
        loadChildren: () => import('./features/expenses/expenses.routes').then((m) => m.EXPENSE_ROUTES),
      },
      {
        path: 'expense-categories',
        loadChildren: () =>
          import('./features/expense-categories/expense-categories.routes').then((m) => m.EXPENSE_CATEGORY_ROUTES),
      },
      {
        path: 'finance',
        loadChildren: () => import('./features/finance/finance.routes').then((m) => m.FINANCE_ROUTES),
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then((m) => m.USER_ROUTES),
      },
      {
        path: 'roles',
        loadChildren: () => import('./features/roles/roles.routes').then((m) => m.ROLE_ROUTES),
      },
      {
        path: 'permissions',
        loadChildren: () => import('./features/permissions/permissions.routes').then((m) => m.PERMISSION_ROUTES),
      },
      {
        path: 'audit-logs',
        loadChildren: () => import('./features/audit/audit.routes').then((m) => m.AUDIT_ROUTES),
      },
      {
        path: 'audit',
        redirectTo: 'audit-logs',
        pathMatch: 'full',
      },
      {
        path: 'notifications',
        loadChildren: () => import('./features/notifications/notifications.routes').then((m) => m.NOTIFICATION_ROUTES),
      },
      {
        path: 'activity',
        loadChildren: () => import('./features/activity/activity.routes').then((m) => m.ACTIVITY_ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        path: 'help',
        loadChildren: () => import('./features/help/help.routes').then((m) => m.HELP_ROUTES),
      },
      {
        path: 'ai',
        loadChildren: () => import('./features/ai/ai.routes').then((m) => m.AI_ROUTES),
      },
      {
        path: 'nalva',
        loadChildren: () => import('./features/nalva/nalva.routes').then((m) => m.NALVA_ROUTES),
      },
      {
        path: 'subscription',
        loadChildren: () => import('./features/subscription/subscription.routes').then((m) => m.SUBSCRIPTION_ROUTES),
      },
      {
        path: 'billing',
        loadChildren: () => import('./features/billing/billing.routes').then((m) => m.BILLING_ROUTES),
      },
      {
        path: 'pricing',
        loadChildren: () => import('./features/billing/billing.routes').then((m) => m.PRICING_ROUTES),
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: 'team',
        loadChildren: () => import('./features/team/team.routes').then((m) => m.TEAM_ROUTES),
      },
      {
        path: 'organization',
        loadChildren: () => import('./features/organization/organization.routes').then((m) => m.ORGANIZATION_ROUTES),
      },
      {
        path: 'enterprise',
        loadChildren: () => import('./features/enterprise/enterprise.routes').then((m) => m.ENTERPRISE_ROUTES),
      },
      {
        path: 'tenant-settings',
        redirectTo: 'tenant/settings',
        pathMatch: 'full',
      },
      {
        path: 'tenant',
        loadChildren: () => import('./features/tenant/tenant.routes').then((m) => m.TENANT_ROUTES),
      },
      {
        path: 'people',
        children: PEOPLE_ROUTES,
      },
      {
        path: 'crm',
        children: CRM_ROUTES,
      },
      {
        path: 'warehouses',
        children: WAREHOUSE_ROUTES,
      },
      {
        path: 'returns',
        children: RETURN_ROUTES,
      },
      {
        path: 'projects',
        children: PROJECT_OPS_ROUTES,
      },
      {
        path: 'storefront',
        loadComponent: () =>
          import('./features/experience/storefront-admin.component').then((m) => m.StorefrontAdminComponent),
        title: 'Storefront | BusinessOS',
      },
      {
        path: 'workspaces',
        loadComponent: () =>
          import('./features/experience/workspace-hub.component').then((m) => m.WorkspaceHubComponent),
        title: 'Workspace | BusinessOS',
      },
      {
        path: 'my-work',
        loadComponent: () =>
          import('./features/experience/employee-portal.component').then((m) => m.EmployeePortalComponent),
        title: 'My work | BusinessOS',
      },
      {
        path: 'launch',
        loadComponent: () =>
          import('./features/launch/launch-desk.component').then((m) => m.LaunchDeskComponent),
        title: 'Feedback | BusinessOS',
      },
      {
        path: 'supplier-access',
        loadComponent: () =>
          import('./features/experience/supplier-access.component').then((m) => m.SupplierAccessComponent),
        title: 'Supplier access | BusinessOS',
      },
      ...buildFeatureRoutes(),
    ],
  },
  { path: '**', redirectTo: ROUTES.notFound.replace(/^\//, '') },
];
