import { CashFlowIntelligence, FinanceIntelligence } from './finance-agent.model';

export interface BiMetric {
  value: number | null;
  available: boolean;
  isPrediction: boolean;
  confidence: string;
  basis?: string | null;
}

export interface HistoricalPoint {
  periodStart: string;
  actualValue: number;
}

export interface ForecastHorizonPoint {
  periodStart: string;
  periodEnd: string;
  predictedValue: number;
  confidence: string;
  isPrediction: boolean;
}

export interface RevenueForecast {
  currency: string;
  available: boolean;
  confidence: string;
  method: string;
  nextPeriodPredicted: number | null;
  history: HistoricalPoint[];
  horizon: ForecastHorizonPoint[];
  backtestMapePercent: number | null;
  assumptions: string[];
  limitations: string[];
  dataClassification: string;
  isPrediction: boolean;
}

export interface PeriodComparison {
  currency: string;
  currentStart: string;
  currentEnd: string;
  priorStart: string;
  priorEnd: string;
  currentRevenue: number;
  priorRevenue: number;
  revenueChangePercent: number | null;
  currentOrderCount: number;
  priorOrderCount: number;
  currentExpenses: number;
  priorExpenses: number;
  expenseChangePercent: number | null;
  dataClassification: string;
}

export interface BusinessRisk {
  category: string;
  severity: string;
  title: string;
  explanation: string;
  supportingMetrics: string[];
  suggestedAgentKey?: string | null;
  isPrediction: boolean;
}

export interface BiRecommendation {
  id: string;
  category: string;
  title: string;
  explanation: string;
  supportingMetrics: string[];
  suggestedAgentKey?: string | null;
  suggestedObjective?: string | null;
  requiresHumanApproval: boolean;
  isPrediction: boolean;
  confidence: string;
}

export interface BusinessHealthOverview {
  currency: string;
  period: string;
  startDate: string;
  endDate: string;
  salesRevenue: BiMetric;
  collectedCash: BiMetric;
  expenses: BiMetric;
  grossProfit: BiMetric;
  outstandingReceivables: BiMetric;
  outstandingPayables: BiMetric;
  lowStockCount: number;
  churnRiskCount: number;
  overdueInvoiceCount: number;
  overallHealthLabel: string;
  formulas: string[];
  limitations: string[];
  dataClassification: string;
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  priorPeriodRevenue: number | null;
  changePercent: number | null;
  trend: string;
  confidence: string;
}

export interface DecliningProduct {
  productId: string;
  productName: string;
  sku: string;
  currentRevenue: number;
  priorRevenue: number;
  declinePercent: number;
  explanation: string;
}

export interface ConversionAnalytics {
  totalLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  completedOrders: number;
  cancelledOrders: number;
  orderCompletionRate: number;
  dataClassification: string;
  limitations: string[];
}

export interface SalesIntelligence {
  currency: string;
  period: string;
  startDate: string;
  endDate: string;
  salesRevenue: number;
  averageOrderValue: number;
  completedOrders: number;
  forecast: RevenueForecast;
  topProducts: ProductPerformance[];
  decliningProducts: DecliningProduct[];
  conversion: ConversionAnalytics;
  opportunities: BiRecommendation[];
  assumptions: string[];
  limitations: string[];
  dataClassification: string;
}

export interface CustomerSegmentInsight {
  segmentKey: string;
  label: string;
  customerCount: number;
  totalRevenue: number;
  explanation: string;
}

export interface ChurnRiskCustomer {
  customerId: string;
  customerName: string;
  email: string;
  lastOrderDate: string | null;
  daysSinceLastOrder: number;
  lifetimeOrders: number;
  lifetimeRevenue: number;
  riskLevel: string;
  explanation: string;
  isPrediction: boolean;
}

export interface CustomerRetention {
  activeCustomers: number;
  repeatCustomers: number;
  repeatRate: number;
  atRiskCustomers: number;
  lostCustomers: number;
  retentionEstimatePercent: number | null;
  confidence: string;
  assumptions: string[];
  limitations: string[];
  isPrediction: boolean;
}

export interface CustomerIntelligence {
  retention: CustomerRetention;
  segments: CustomerSegmentInsight[];
  churnRisks: ChurnRiskCustomer[];
  retentionStrategies: BiRecommendation[];
  dataClassification: string;
}

export interface InventoryTurnover {
  productId: string;
  productName: string;
  sku: string;
  unitsSold90Days: number;
  averageStock: number;
  turnoverRatio: number | null;
  daysOfInventory: number | null;
  estimatedLeadTimeDays: number | null;
  confidence: string;
  explanation: string;
}

export interface DecisionBrief {
  questionKey: string;
  question: string;
  answer: string;
  supportingMetrics: string[];
  recommendedActions: BiRecommendation[];
  assumptions: string[];
  limitations: string[];
  confidence: string;
  containsPredictions: boolean;
  dataClassification: string;
}

export interface RecommendedTaskResult {
  created: boolean;
  taskId: string | null;
  status: string;
  message: string;
  requiresHumanApproval: boolean;
}

export interface PredictionAccuracyRow {
  id: string;
  metricKey: string;
  method: string;
  predictedValue: number;
  actualValue: number | null;
  absolutePercentError: number | null;
  confidence: string;
  targetPeriodStart: string;
  targetPeriodEnd: string;
  evaluatedAt: string | null;
  status: string;
}

export interface PredictionAccuracySummary {
  totalRecorded: number;
  evaluated: number;
  pending: number;
  averageAbsolutePercentError: number | null;
  recent: PredictionAccuracyRow[];
  dataClassification: string;
}

export interface DemandInsight {
  productId: string;
  productName: string;
  sku: string;
  unitsLast30Days: number;
  unitsLast90Days: number;
  averageDailyDemand: number | null;
  averageMonthlyDemand: number | null;
  currentStock: number;
  daysOfCover: number | null;
  estimatedStockoutDate: string | null;
  suggestedReorderQuantity: number;
  confidence: string;
  assumptions: string;
  forecastAvailable: boolean;
}

export interface InventoryRisk {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  maximumStockLevel: number;
  incomingQuantity: number;
  effectiveAvailable: number;
  riskKind: string;
  averageDailyDemand: number | null;
  daysOfCover: number | null;
  estimatedStockoutDate: string | null;
  suggestedReorderQuantity: number;
  confidence: string;
  explanation: string;
}

export interface ExecutiveDashboard {
  health: BusinessHealthOverview;
  revenueForecast: RevenueForecast;
  periodComparison: PeriodComparison;
  sales: SalesIntelligence;
  customers: CustomerIntelligence;
  inventoryRisks: InventoryRisk[];
  inventoryDemand: DemandInsight[];
  inventoryTurnover: InventoryTurnover[];
  cashFlow: CashFlowIntelligence | null;
  finance: FinanceIntelligence | null;
  risks: BusinessRisk[];
  recommendations: BiRecommendation[];
  predictionAccuracy: PredictionAccuracySummary;
  dataClassification: string;
  globalLimitations: string[];
}
