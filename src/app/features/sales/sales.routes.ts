import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { PermissionCodes } from '../../core/constants/permission.constants';

export const SALES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./sales-dashboard/sales-dashboard.component').then((m) => m.SalesDashboardComponent),
    title: 'Sales Dashboard | BusinessOS',
    canActivate: [permissionGuard([PermissionCodes.order.view, PermissionCodes.invoice.view])],
  },
];
