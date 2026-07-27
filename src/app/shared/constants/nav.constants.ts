// nav.constants.ts
import { ROUTES } from '../../core/constants/route.constants';

/** @deprecated Use ROUTES from core/constants/route.constants.ts */
export const APP_ROUTE_PATHS = {
  dashboard: ROUTES.dashboard,
  users: ROUTES.users.base,
  roles: ROUTES.roles.base,
  permissions: ROUTES.permissions.base,
  customers: ROUTES.customers.base,
  products: ROUTES.products.base,
  inventory: ROUTES.inventory.base,
  suppliers: ROUTES.suppliers.base,
  purchaseOrders: ROUTES.purchaseOrders.base,
  orders: ROUTES.orders.base,
  quotations: ROUTES.quotations.base,
  invoices: ROUTES.invoices.base,
  payments: ROUTES.payments.base,
  sales: ROUTES.sales.base,
  reports: ROUTES.reports,
  expenses: ROUTES.expenses.base,
  expenseCategories: ROUTES.expenseCategories.base,
  finance: ROUTES.finance.base,
  audit: ROUTES.audit.base,
  notifications: ROUTES.notifications.base,
  settings: ROUTES.settings.base,
  admin: ROUTES.admin.base,
  profile: ROUTES.profile,
  onboarding: ROUTES.onboarding.base,
  forbidden: ROUTES.forbidden,
  notFound: ROUTES.notFound,
} as const;

export { ROUTES };

export type NavGroupName =
  | 'Home'
  | 'Buying'
  | 'Selling'
  | 'Insights'
  | 'Finance'
  | 'Administration';

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  description: string;
  permissions?: string[];
  group?: NavGroupName;
}

/** Display order for sidebar groups (friendly, non-technical labels). */
export const NAV_GROUP_ORDER: readonly NavGroupName[] = [
  'Home',
  'Buying',
  'Selling',
  'Insights',
  'Finance',
  'Administration',
] as const;

/** Compact quick links shown in the top navbar (sidebar holds full navigation). */
export const TOP_NAV_ITEMS: NavItem[] = [
  {
    label: 'Sales',
    icon: 'bi-graph-up',
    route: ROUTES.sales.dashboard,
    description: 'See sales, top products, and how money is coming in.',
    permissions: ['Order.View'],
  },
  {
    label: 'Reports',
    icon: 'bi-bar-chart',
    route: ROUTES.reports,
    description: 'Simple reports on how your business is doing.',
    permissions: ['Report.View'],
  },
  {
    label: 'Money',
    icon: 'bi-coin',
    route: ROUTES.finance.dashboard,
    description: 'Income, expenses, and overall financial health.',
    permissions: ['Finance.View'],
  },
];

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Home',
    icon: 'bi-house-door',
    route: ROUTES.dashboard,
    description: 'See how your business is doing at a glance.',
    group: 'Home',
  },
  {
    label: 'Products',
    icon: 'bi-box',
    route: ROUTES.products.base,
    description: 'Your product catalog and prices.',
    permissions: ['Product.View'],
    group: 'Buying',
  },
  {
    label: 'Stock',
    icon: 'bi-box-seam',
    route: ROUTES.inventory.base,
    description: 'See what you have in stock.',
    permissions: ['Inventory.View'],
    group: 'Buying',
  },
  {
    label: 'Suppliers',
    icon: 'bi-truck',
    route: ROUTES.suppliers.base,
    description: 'People you buy from.',
    permissions: ['Supplier.View'],
    group: 'Buying',
  },
  {
    label: 'Buy orders',
    icon: 'bi-clipboard-check',
    route: ROUTES.purchaseOrders.base,
    description: 'Orders you place with suppliers.',
    permissions: ['PurchaseOrder.View'],
    group: 'Buying',
  },
  {
    label: 'Customers',
    icon: 'bi-person-badge',
    route: ROUTES.customers.base,
    description: 'People who buy from you.',
    permissions: ['Customer.View'],
    group: 'Selling',
  },
  {
    label: 'Orders',
    icon: 'bi-cart3',
    route: ROUTES.orders.base,
    description: 'Customer orders to fulfill.',
    permissions: ['Order.View'],
    group: 'Selling',
  },
  {
    label: 'Quotes',
    icon: 'bi-file-earmark-text',
    route: ROUTES.quotations.base,
    description: 'Price quotes for customers.',
    permissions: ['Quotation.View'],
    group: 'Selling',
  },
  {
    label: 'Invoices',
    icon: 'bi-receipt',
    route: ROUTES.invoices.base,
    description: 'Bills you send to customers.',
    permissions: ['Invoice.View'],
    group: 'Selling',
  },
  {
    label: 'Payments',
    icon: 'bi-credit-card',
    route: ROUTES.payments.base,
    description: 'Money received from customers.',
    permissions: ['Payment.View'],
    group: 'Selling',
  },
  {
    label: 'Sales overview',
    icon: 'bi-graph-up',
    route: ROUTES.sales.dashboard,
    description: 'Sales numbers and top products.',
    permissions: ['Order.View'],
    group: 'Insights',
  },
  {
    label: 'Reports',
    icon: 'bi-bar-chart',
    route: ROUTES.reports,
    description: 'Simple reports on how you are doing.',
    permissions: ['Report.View'],
    group: 'Insights',
  },
  {
    label: 'Deeper charts',
    icon: 'bi-graph-up-arrow',
    route: ROUTES.analytics.base,
    description: 'Deeper charts across your business.',
    permissions: ['Analytics.View'],
    group: 'Insights',
  },
  {
    label: 'Money overview',
    icon: 'bi-coin',
    route: ROUTES.finance.dashboard,
    description: 'Income, expenses, and financial health.',
    permissions: ['Finance.View'],
    group: 'Finance',
  },
  {
    label: 'Expenses',
    icon: 'bi-graph-up-arrow',
    route: ROUTES.expenses.base,
    description: 'Track money your business spends.',
    permissions: ['Expense.View'],
    group: 'Finance',
  },
  {
    label: 'Expense groups',
    icon: 'bi-tags',
    route: ROUTES.expenseCategories.base,
    description: 'Organize expenses into groups.',
    permissions: ['ExpenseCategory.View'],
    group: 'Finance',
  },
  {
    label: 'Profit & loss',
    icon: 'bi-bullseye',
    route: ROUTES.finance.profitLoss,
    description: 'See if you are making or losing money.',
    permissions: ['Finance.View'],
    group: 'Finance',
  },
  {
    label: 'Team',
    icon: 'bi-people',
    route: ROUTES.team.base,
    description: 'Manage team members, roles, and collaboration.',
    permissions: ['Team.View'],
    group: 'Administration',
  },
  {
    label: 'Tenant',
    icon: 'bi-building',
    route: ROUTES.tenant.dashboard,
    description: 'Tenant dashboard, plan, and resource usage.',
    permissions: ['Tenant.View'],
    group: 'Administration',
  },
  {
    label: 'Organization',
    icon: 'bi-buildings',
    route: ROUTES.organization.base,
    description: 'Organization profile, logo, timezone, and currency.',
    permissions: ['Organization.View'],
    group: 'Administration',
  },
  {
    label: 'Users',
    icon: 'bi-people',
    route: ROUTES.users.base,
    description: 'Manage user accounts and access.',
    permissions: ['User.View'],
    group: 'Administration',
  },
  {
    label: 'Roles',
    icon: 'bi-shield-check',
    route: ROUTES.roles.base,
    description: 'Configure roles and assign permissions.',
    permissions: ['Role.View'],
    group: 'Administration',
  },
  {
    label: 'Permissions',
    icon: 'bi-key',
    route: ROUTES.permissions.base,
    description: 'Review permission definitions across the system.',
    permissions: ['Role.View'],
    group: 'Administration',
  },
  {
    label: 'Audit Logs',
    icon: 'bi-clipboard',
    route: ROUTES.audit.base,
    description: 'Review system audit trail and entity changes.',
    permissions: ['Audit.View'],
    group: 'Administration',
  },
  {
    label: 'Activity',
    icon: 'bi-clock',
    route: ROUTES.activity.base,
    description: 'View business activity timeline.',
    permissions: ['Activity.View'],
    group: 'Administration',
  },
  {
    label: 'Notifications',
    icon: 'bi-bell',
    route: ROUTES.notifications.base,
    description: 'View and manage notifications.',
    permissions: ['Notification.View'],
    group: 'Administration',
  },
  {
    label: 'Billing',
    icon: 'bi-receipt',
    route: ROUTES.billing.base,
    description: 'Manage subscription, usage, and invoices.',
    permissions: ['Subscription.View'],
    group: 'Administration',
  },
  {
    label: 'Pricing',
    icon: 'bi-tag',
    route: ROUTES.pricing.base,
    description: 'Compare plans and upgrade your subscription.',
    permissions: ['Subscription.View'],
    group: 'Administration',
  },
  {
    label: 'Settings',
    icon: 'bi-gear',
    route: ROUTES.settings.base,
    description: 'Configure application and tenant settings.',
    permissions: ['Settings.View'],
    group: 'Administration',
  },
  {
    label: 'System Admin',
    icon: 'bi-hdd-stack',
    route: ROUTES.admin.base,
    description: 'Monitor system health, stats, and environment.',
    permissions: ['SystemAdmin.View'],
    group: 'Administration',
  },
];
