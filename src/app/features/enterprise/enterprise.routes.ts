import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';

export const ENTERPRISE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./enterprise-shell.component').then((m) => m.EnterpriseShellComponent),
    title: 'Enterprise | BusinessOS',
    canActivate: [permissionGuard(['Enterprise.View', 'Enterprise.Manage', 'Organization.Manage'])],
  },
];
