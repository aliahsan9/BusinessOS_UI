export enum ReportType {
  BusinessSummary = 'business-summary',
  Revenue = 'revenue',
  Expenses = 'expenses',
  ProfitLoss = 'profit-loss',
  Customers = 'customers',
  Projects = 'projects',
  Tasks = 'tasks',
  Invoice = 'invoice',
}

export interface ReportQueryParams {
  period?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  projectId?: string;
}

export interface ReportHistoryItem {
  id: string;
  reportName: string;
  reportType: string;
  generatedBy: string;
  generatedAt: string;
  fileType: string;
  fileName: string;
}

export interface ReportHistoryResponse {
  items: ReportHistoryItem[];
}

export interface ReportDefinition {
  type: ReportType;
  label: string;
  description: string;
  icon: string;
  requiresProjectId?: boolean;
}

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    type: ReportType.BusinessSummary,
    label: 'Business Summary',
    description: 'Overview of customers, projects, tasks, revenue, and profit.',
    icon: 'bi bi-speedometer2',
  },
  {
    type: ReportType.Revenue,
    label: 'Revenue Report',
    description: 'Revenue by month, customer, and project.',
    icon: 'bi bi-cash-stack',
  },
  {
    type: ReportType.Expenses,
    label: 'Expense Report',
    description: 'Expense categories, monthly totals, and trends.',
    icon: 'bi bi-wallet2',
  },
  {
    type: ReportType.ProfitLoss,
    label: 'Profit & Loss',
    description: 'Professional P&L statement with profit margin.',
    icon: 'bi bi-graph-up-arrow',
  },
  {
    type: ReportType.Customers,
    label: 'Customer Report',
    description: 'Customer details, revenue, and outstanding invoices.',
    icon: 'bi bi-people-fill',
  },
  {
    type: ReportType.Projects,
    label: 'Project Report',
    description: 'Project status, tasks, budget, and revenue.',
    icon: 'bi bi-kanban',
    requiresProjectId: true,
  },
  {
    type: ReportType.Tasks,
    label: 'Task Productivity',
    description: 'Completed, pending, overdue tasks and completion rate.',
    icon: 'bi bi-check2-circle',
  },
];
