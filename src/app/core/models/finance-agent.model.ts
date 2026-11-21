export interface MetricValue {
  available: boolean;
  value?: number | null;
  basis: string;
  limitation?: string | null;
}

export interface FinanceOverview {
  currency: string;
  timeZoneId: string;
  period: string;
  startDate: string;
  endDate: string;
  salesRevenue?: number | null;
  collectedCash?: number | null;
  totalExpenses?: number | null;
  grossProfit?: number | null;
  netProfit?: number | null;
  outstandingReceivables?: number | null;
  outstandingPayables?: number | null;
  overdueInvoiceCount: number;
  cashBalance?: number | null;
  cashBalanceAvailable: boolean;
  dataClassification: string;
  limitations: string[];
  formulas: string[];
}

export interface FinanceIntelligence {
  currency: string;
  timeZoneId: string;
  period: string;
  startDate: string;
  endDate: string;
  salesRevenue: MetricValue;
  collectedCash: MetricValue;
  otherIncome: MetricValue;
  totalExpenses: MetricValue;
  costOfGoodsSold: MetricValue;
  grossProfit: MetricValue;
  netProfit: MetricValue;
  outstandingReceivables: MetricValue;
  outstandingPayables: MetricValue;
  overdueReceivables: MetricValue;
  cashBalance: MetricValue;
  monthlyTrends: Array<{
    periodLabel: string;
    salesRevenue: number;
    collectedCash: number;
    expenses: number;
    grossProfit?: number | null;
    netProfit?: number | null;
  }>;
  profitabilityByProduct: Array<{
    productId?: string | null;
    name: string;
    revenue: number;
    cost?: number | null;
    grossProfit?: number | null;
    confidence: string;
    limitation: string;
  }>;
  limitations: string[];
  formulas: string[];
  dataClassification: string;
}

export interface ExpenseIntelligence {
  currency: string;
  startDate: string;
  endDate: string;
  totalRecognizedExpenses: number;
  priorPeriodTotal: number;
  changePercent?: number | null;
  categories: Array<{
    categoryId?: string | null;
    categoryName: string;
    amount: number;
    priorAmount: number;
    changePercent?: number | null;
    count: number;
    explanation: string;
  }>;
  recurring: Array<{
    expenseId: string;
    title: string;
    amount: number;
    categoryName: string;
    recurrencePattern?: string | null;
    expenseDate: string;
  }>;
  anomalies: Array<{
    expenseId: string;
    title: string;
    categoryName: string;
    amount: number;
    categoryAverage: number;
    variancePercent: number;
    explanation: string;
  }>;
  duplicateHints: Array<{
    expenseId: string;
    possibleDuplicateOfId: string;
    title: string;
    amount: number;
    expenseDate: string;
    reason: string;
  }>;
  categorySuggestions: Array<{
    expenseId: string;
    title: string;
    vendor?: string | null;
    suggestedCategoryId?: string | null;
    suggestedCategoryName: string;
    confidence: string;
    reason: string;
    applied: boolean;
  }>;
  limitations: string[];
}

export interface ReceivablesIntelligence {
  currency: string;
  totalOutstanding: number;
  overdueTotal: number;
  overdueCount: number;
  aging: Array<{ label: string; amount: number; count: number }>;
  items: Array<{
    invoiceId: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    invoiceDate: string;
    dueDate: string;
    grandTotal: number;
    amountPaid: number;
    outstandingAmount: number;
    daysOverdue: number;
    status: string;
    priorityScore: number;
  }>;
  latePayers: Array<{
    customerId: string;
    customerName: string;
    overdueInvoiceCount: number;
    overdueAmount: number;
    timesLate: number;
  }>;
  limitations: string[];
}

export interface PayablesIntelligence {
  currency: string;
  totalOutstanding: number;
  overdueTotal: number;
  dueSoonTotal: number;
  items: Array<{
    purchaseInvoiceId: string;
    invoiceNumber: string;
    supplierId: string;
    supplierName: string;
    issueDate: string;
    dueDate: string;
    total: number;
    amountPaid: number;
    outstanding: number;
    daysUntilDue: number;
    isOverdue: boolean;
    status: string;
    priorityScore: number;
  }>;
  recommendedSchedule: Array<{
    purchaseInvoiceId: string;
    invoiceNumber: string;
    supplierName: string;
    suggestedPayDate: string;
    amount: number;
    rationale: string;
  }>;
  limitations: string[];
}

export interface CashFlowIntelligence {
  currency: string;
  startDate: string;
  endDate: string;
  openingBalanceConfigured: boolean;
  openingBalance?: number | null;
  inflows: number;
  outflows: number;
  closingBalance?: number | null;
  closingBalanceAvailable: boolean;
  expectedReceivableInflows: number;
  expectedPayableOutflows: number;
  projectionAvailable: boolean;
  projectionConfidence: string;
  projection: Array<{
    date: string;
    projectedInflow: number;
    projectedOutflow: number;
    projectedBalance?: number | null;
    confidence: string;
  }>;
  shortageWarnings: string[];
  assumptions: string[];
  limitations: string[];
  dataClassification: string;
}

export interface ReconciliationSummary {
  invoicePaymentMismatches: number;
  purchaseBillPaymentMismatches: number;
  possibleDuplicatePayments: number;
  unmatchedBankLines: number;
  partialPayments: number;
  issues: Array<{
    kind: string;
    summary: string;
    invoiceId?: string | null;
    paymentId?: string | null;
    purchaseInvoiceId?: string | null;
    expenseId?: string | null;
    bankLineId?: string | null;
    amount?: number | null;
    recommendedAction: string;
  }>;
  limitations: string[];
  bankSyncClassification: string;
}

export interface FinanceReport {
  reportType: string;
  currency: string;
  timeZoneId: string;
  startDate: string;
  endDate: string;
  calculationBasis: string;
  bodyMarkdown: string;
  payload: unknown;
  limitations: string[];
  disclaimer: string;
}

export interface FinanceBudget {
  id: string;
  name: string;
  expenseCategoryId?: string | null;
  categoryName?: string | null;
  amount: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  actualSpend: number;
  remaining: number;
  utilizationPercent: number;
  isOverBudget: boolean;
  isRecommendation: boolean;
  status: string;
}

export interface BudgetAlert {
  budgetId: string;
  budgetName: string;
  severity: string;
  message: string;
  amount: number;
  actualSpend: number;
  utilizationPercent: number;
}

export interface FinanceAlert {
  id: string;
  kind: string;
  title: string;
  summary: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface PreparedReminder {
  reminderId: string;
  invoiceId: string;
  status: string;
  approvalFingerprint: string;
  requiresApproval: boolean;
  created: boolean;
  duplicatePrevented: boolean;
  subject: string;
  body: string;
  channel: string;
  outstandingAmount: number;
  daysOverdue: number;
  summary: string;
  integrationClassification: string;
}

export interface FinanceReminder {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  channel: string;
  status: string;
  subject: string;
  outstandingAmount: number;
  daysOverdue: number;
  createdAt: string;
  sentAt?: string | null;
}

export interface FinanceAutomationSettings {
  dailyFinanceSummary: boolean;
  weeklyFinancialReport: boolean;
  overdueInvoiceMonitoring: boolean;
  paymentReminderPreparation: boolean;
  upcomingPayableAlerts: boolean;
  expenseAnomalyDetection: boolean;
  cashFlowAnalysis: boolean;
  budgetMonitoring: boolean;
  reconciliationChecks: boolean;
  reminderScheduleDays: string;
  reminderChannel: string;
  autoSendReminders: boolean;
  anomalyVariancePercent: number;
  payableAlertDays: number;
  minimumCashFlowHistoryMonths: number;
  timeZoneId: string;
  reportingBasis: string;
  updatedAt?: string | null;
  lastMonitorRunAt?: string | null;
}

export interface FinanceActivity {
  id: string;
  kind: string;
  title: string;
  summary: string;
  severity: string;
  status: string;
  createdAt: string;
}

export interface FinanceBudgetWrite {
  id?: string;
  name: string;
  expenseCategoryId?: string | null;
  categoryName?: string | null;
  amount: number;
  periodStart: string;
  periodEnd: string;
  isRecommendation?: boolean;
}

export type FinanceAutomationSettingsWrite = Partial<FinanceAutomationSettings>;
