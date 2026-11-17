import { Routes } from '@angular/router';
import { permissionGuard } from './core/guards/permission.guard';
import { APP_ROUTE_PATHS, NAV_ITEMS } from './shared/constants/nav.constants';
import { ROUTES } from './core/constants/route.constants';

function pathFromRoute(route: string): string {
  return route.replace(/^\//, '');
}

const IMPLEMENTED_PATHS = new Set([
  pathFromRoute(ROUTES.dashboard),
  pathFromRoute(ROUTES.products.base),
  pathFromRoute(ROUTES.inventory.base),
  pathFromRoute(ROUTES.suppliers.base),
  pathFromRoute(ROUTES.purchaseOrders.base),
  pathFromRoute(ROUTES.customers.base),
  pathFromRoute(ROUTES.orders.base),
  pathFromRoute(ROUTES.quotations.base),
  pathFromRoute(ROUTES.invoices.base),
  pathFromRoute(ROUTES.payments.base),
  pathFromRoute(ROUTES.sales.base),
  pathFromRoute(ROUTES.reports),
  pathFromRoute(ROUTES.analytics.base),
  pathFromRoute(ROUTES.expenses.base),
  pathFromRoute(ROUTES.expenseCategories.base),
  pathFromRoute(ROUTES.finance.base),
  pathFromRoute(ROUTES.users.base),
  pathFromRoute(ROUTES.roles.base),
  pathFromRoute(ROUTES.permissions.base),
  pathFromRoute(ROUTES.audit.base),
  pathFromRoute(ROUTES.activity.base),
  pathFromRoute(ROUTES.notifications.base),
  pathFromRoute(ROUTES.settings.base),
  pathFromRoute(ROUTES.admin.base),
  pathFromRoute(ROUTES.team.base),
  pathFromRoute(ROUTES.organization.base),
  pathFromRoute(ROUTES.billing.base),
  pathFromRoute(ROUTES.pricing.base),
  pathFromRoute(ROUTES.people.employees),
  pathFromRoute(ROUTES.people.departments),
  pathFromRoute(ROUTES.people.attendance),
  pathFromRoute(ROUTES.people.leave),
  pathFromRoute(ROUTES.people.announcements),
  pathFromRoute(ROUTES.people.performance),
  pathFromRoute(ROUTES.crm.leads),
  pathFromRoute(ROUTES.crm.deals),
  pathFromRoute(ROUTES.crm.followUps),
  pathFromRoute(ROUTES.crm.segments),
  pathFromRoute(ROUTES.crm.activities),
  pathFromRoute(ROUTES.warehouses),
  pathFromRoute(ROUTES.returns),
  pathFromRoute(ROUTES.finance.income),
  pathFromRoute(ROUTES.finance.purchaseInvoices),
  pathFromRoute(ROUTES.finance.cashFlow),
  pathFromRoute(ROUTES.finance.tax),
  pathFromRoute(ROUTES.finance.subscriptions),
  pathFromRoute(ROUTES.projects.base),
  pathFromRoute(ROUTES.projects.board),
  pathFromRoute(ROUTES.projects.time),
  pathFromRoute(ROUTES.nalva.base),
  pathFromRoute(ROUTES.nalva.command),
  pathFromRoute(ROUTES.nalva.agents),
  pathFromRoute(ROUTES.nalva.tasks),
  pathFromRoute(ROUTES.nalva.automation),
  pathFromRoute(ROUTES.nalva.history),
  pathFromRoute(ROUTES.storefront),
  pathFromRoute(ROUTES.workspaces),
  pathFromRoute(ROUTES.myWork),
  pathFromRoute(ROUTES.supplierAccess),
  pathFromRoute(ROUTES.launch),
]);

export function buildFeatureRoutes(): Routes {
  const placeholderRoutes = NAV_ITEMS.filter(
    (item) => item.route !== APP_ROUTE_PATHS.dashboard && !IMPLEMENTED_PATHS.has(pathFromRoute(item.route)),
  ).map((item) => ({
    path: pathFromRoute(item.route),
    loadComponent: () =>
      import('./shared/pages/feature-page/feature-page.component').then((m) => m.FeaturePageComponent),
    title: `${item.label} | BusinessOS`,
    data: {
      pageTitle: item.label,
      description: item.description,
      icon: item.icon,
    },
    ...(item.permissions?.length
      ? { canActivate: [permissionGuard(item.permissions, false)] }
      : {}),
  }));

  return [
    ...placeholderRoutes,
    {
      path: pathFromRoute(APP_ROUTE_PATHS.profile),
      loadComponent: () =>
        import('./features/profile/profile-page/profile-page.component').then(
          (m) => m.ProfilePageComponent,
        ),
      title: 'Profile | BusinessOS',
    },
  ];
}
