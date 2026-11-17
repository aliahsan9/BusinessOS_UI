import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { PermissionCodes } from '../../core/constants/permission.constants';

const people = () => import('./people/people-page.component').then((m) => m.PeoplePageComponent);
const crm = () => import('./crm/crm-page.component').then((m) => m.CrmPageComponent);
const commerce = () => import('./commerce/commerce-page.component').then((m) => m.CommercePageComponent);
const finance = () => import('./finance/finance-ops-page.component').then((m) => m.FinanceOpsPageComponent);
const projects = () => import('./projects/project-ops-page.component').then((m) => m.ProjectOpsPageComponent);

export const PEOPLE_ROUTES: Routes = [
  { path: 'employees', loadComponent: people, data: { screen: 'employees' }, title: 'Employees | BusinessOS', canActivate: [permissionGuard([PermissionCodes.employee.view])] },
  { path: 'departments', loadComponent: people, data: { screen: 'departments' }, title: 'Departments | BusinessOS', canActivate: [permissionGuard([PermissionCodes.employee.view])] },
  { path: 'attendance', loadComponent: people, data: { screen: 'attendance' }, title: 'Attendance | BusinessOS', canActivate: [permissionGuard([PermissionCodes.employee.view, PermissionCodes.attendance.manage])] },
  { path: 'leave', loadComponent: people, data: { screen: 'leave' }, title: 'Leave | BusinessOS', canActivate: [permissionGuard([PermissionCodes.employee.view, PermissionCodes.leave.manage])] },
  { path: 'announcements', loadComponent: people, data: { screen: 'announcements' }, title: 'Announcements | BusinessOS', canActivate: [permissionGuard([PermissionCodes.announcement.view])] },
  { path: 'performance', loadComponent: people, data: { screen: 'performance' }, title: 'Performance | BusinessOS', canActivate: [permissionGuard([PermissionCodes.performance.view])] },
];

export const CRM_ROUTES: Routes = [
  { path: 'leads', loadComponent: crm, data: { screen: 'leads' }, title: 'Leads | BusinessOS', canActivate: [permissionGuard([PermissionCodes.lead.view])] },
  { path: 'pipeline', loadComponent: crm, data: { screen: 'leads' }, title: 'Pipeline | BusinessOS', canActivate: [permissionGuard([PermissionCodes.lead.view])] },
  { path: 'deals', loadComponent: crm, data: { screen: 'deals' }, title: 'Deals | BusinessOS', canActivate: [permissionGuard([PermissionCodes.deal.view])] },
  { path: 'follow-ups', loadComponent: crm, data: { screen: 'followups' }, title: 'Follow-ups | BusinessOS', canActivate: [permissionGuard([PermissionCodes.lead.view])] },
  { path: 'segments', loadComponent: crm, data: { screen: 'segments' }, title: 'Segments | BusinessOS', canActivate: [permissionGuard([PermissionCodes.customer.view])] },
  { path: 'activities', loadComponent: crm, data: { screen: 'analytics' }, title: 'CRM analytics | BusinessOS', canActivate: [permissionGuard([PermissionCodes.lead.view])] },
];

export const WAREHOUSE_ROUTES: Routes = [
  { path: '', loadComponent: commerce, data: { screen: 'warehouses' }, title: 'Warehouses | BusinessOS', canActivate: [permissionGuard([PermissionCodes.warehouse.view])] },
];

export const RETURN_ROUTES: Routes = [
  { path: '', loadComponent: commerce, data: { screen: 'returns' }, title: 'Returns | BusinessOS', canActivate: [permissionGuard([PermissionCodes.order.view, PermissionCodes.return.manage])] },
];

export const FINANCE_OPS_ROUTES: Routes = [
  { path: 'income', loadComponent: finance, data: { screen: 'income' }, title: 'Income | BusinessOS', canActivate: [permissionGuard([PermissionCodes.finance.view])] },
  { path: 'purchase-invoices', loadComponent: finance, data: { screen: 'purchase-invoices' }, title: 'Purchase invoices | BusinessOS', canActivate: [permissionGuard([PermissionCodes.finance.view])] },
  { path: 'cash-flow', loadComponent: finance, data: { screen: 'cash-flow' }, title: 'Cash flow | BusinessOS', canActivate: [permissionGuard([PermissionCodes.finance.view])] },
  { path: 'tax', loadComponent: finance, data: { screen: 'tax' }, title: 'Tax rates | BusinessOS', canActivate: [permissionGuard([PermissionCodes.finance.view])] },
  { path: 'subscriptions', loadComponent: finance, data: { screen: 'subscriptions' }, title: 'Subscriptions | BusinessOS', canActivate: [permissionGuard([PermissionCodes.finance.view])] },
];

export const PROJECT_OPS_ROUTES: Routes = [
  { path: '', loadComponent: projects, data: { screen: 'projects' }, title: 'Projects | BusinessOS', canActivate: [permissionGuard([PermissionCodes.project.view])] },
  { path: 'tasks', loadComponent: projects, data: { screen: 'tasks' }, title: 'Tasks | BusinessOS', canActivate: [permissionGuard([PermissionCodes.task.view])] },
  { path: 'board', loadComponent: projects, data: { screen: 'tasks' }, title: 'Kanban | BusinessOS', canActivate: [permissionGuard([PermissionCodes.task.view])] },
  { path: 'time', loadComponent: projects, data: { screen: 'time' }, title: 'Timesheets | BusinessOS', canActivate: [permissionGuard([PermissionCodes.time.view])] },
];
