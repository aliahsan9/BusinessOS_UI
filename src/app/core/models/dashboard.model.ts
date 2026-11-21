import type { ActivityDto } from './activity.model';
import type { FinancialDashboard } from './finance.model';
import type { BusinessInsight } from '../services/experience.service';

export interface DateRange {
  startDate: string;
  endDate: string;
  period: string;
}

export interface DashboardOverviewResponse {
  totalProducts: number;
  totalCategories: number;
  /** Catalog customer count. Not limited to customers created in the period. */
  totalCustomers: number;
  newCustomers?: number;
  activeCustomers?: number;
  totalOrders: number;
  totalRevenue: number;
  previousRevenue?: number;
  /** Null when the previous period had no revenue. */
  revenueChangePercent?: number | null;
  previousOrders?: number;
  ordersChangePercent?: number | null;
  totalInventoryValue: number;
  totalActiveUsers: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  currency?: string;
  dateRange: DateRange;
  previousDateRange?: DateRange;
}

export interface SalesAnalyticsResponse {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
  yearlySales: number;
  averageOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
  revenueTrends: RevenueTrend[];
  dateRange: DateRange;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  orderCount: number;
}

export interface CustomerAnalyticsDashboardResponse {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  customerGrowthRate: number;
  customerLifetimeValue?: number;
  averageLifetimeValue: number;
  averageCustomerSpending?: number;
  averageSpending: number;
  topCustomers: TopCustomer[];
  dateRange: DateRange;
}

export interface TopCustomer {
  customerId: string;
  customerName?: string;
  fullName: string;
  email: string;
  totalOrders: number;
  totalSpending: number;
}

export interface ProductPerformanceDto {
  productId: string;
  productName: string;
  sku: string;
  quantitySold?: number;
  totalQuantitySold: number;
  revenue?: number;
  totalRevenue: number;
  orderCount?: number;
  rank?: number;
  currentStock: number;
}

export interface ProductAnalyticsResponse {
  bestSellingProducts: ProductPerformanceDto[];
  worstSellingProducts: ProductPerformanceDto[];
  mostOrderedProducts: ProductPerformanceDto[];
  productRevenue?: ProductPerformanceDto[];
  highestRevenueProducts: ProductPerformanceDto[];
  productPerformanceRanking?: ProductPerformanceDto[];
  productRankings: ProductPerformanceDto[];
  topLimit: number;
  dateRange: DateRange;
}

export interface InventoryAnalyticsDashboardResponse {
  inventoryValue?: number;
  totalInventoryValue: number;
  totalStockQuantity: number;
  lowStockProducts?: number;
  lowStockCount: number;
  outOfStockProducts?: number;
  outOfStockCount: number;
  stockLevels: StockLevel[];
  reorderRecommendations: ReorderRecommendation[];
  stockMovementTrends: StockMovementTrend[];
  dateRange: DateRange;
}

export interface StockLevel {
  productId: string;
  productName: string;
  currentStock: number;
  reorderLevel: number;
  stockStatus?: string;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  currentStock: number;
  reorderLevel?: number;
  suggestedReorderQuantity: number;
}

export interface StockMovementTrend {
  date: string;
  totalIn?: number;
  totalOut?: number;
  inbound: number;
  outbound: number;
}

export interface OrderStatusCount {
  status: string;
  count: number;
  percentage?: number;
}

export interface OrderPeriodCount {
  date?: string;
  period?: string;
  count: number;
}

export interface OrderAnalyticsResponse {
  ordersByStatus: OrderStatusCount[];
  ordersPerDay: OrderPeriodCount[];
  ordersPerMonth: OrderPeriodCount[];
  orderSuccessRate?: number;
  successRate: number;
  cancellationRate: number;
  dateRange: DateRange;
}

export interface ChartDataset {
  label: string;
  data: number[];
  chartStyle: string;
}

export interface ChartDataResponse {
  chartType: string;
  title: string;
  labels: string[];
  datasets: ChartDataset[];
  dateRange: DateRange;
  /** Real period total when the series is a display curve. Tooltips use point values, not this figure. */
  periodTotal?: number | null;
  currency?: string;
}

export interface DashboardQueryParams {
  startDate?: string;
  endDate?: string;
  period?: string;
  top?: 10 | 20;
  [key: string]: unknown;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
  read: boolean;
}

export interface RecentOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  grandTotal: number;
  orderDate: string;
}

export interface DashboardPriority {
  id: string;
  title: string;
  description: string;
  /** high | medium | low */
  priority: string;
  /** recommendation | task */
  source?: string;
  entityLabel?: string | null;
  route?: string | null;
  actionLabel?: string | null;
  dueAt?: string | null;
}

export interface OwnerDashboardSummary {
  currency: string;
  dateRange: DateRange;
  previousDateRange: DateRange;
  overview: DashboardOverviewResponse;
  sales?: SalesAnalyticsResponse | null;
  customers?: CustomerAnalyticsDashboardResponse | null;
  products?: ProductAnalyticsResponse | null;
  inventory?: InventoryAnalyticsDashboardResponse | null;
  orders?: OrderAnalyticsResponse | null;
  revenueChart?: ChartDataResponse | null;
  finance?: FinancialDashboard | null;
  insights: BusinessInsight[];
  priorities: DashboardPriority[];
  recentActivity: ActivityDto[];
}

export function productRevenue(product: ProductPerformanceDto | null | undefined): number {
  if (!product) return 0;
  if (typeof product.totalRevenue === 'number') return product.totalRevenue;
  if (typeof product.revenue === 'number') return product.revenue;
  return 0;
}

export function productQuantitySold(product: ProductPerformanceDto | null | undefined): number {
  if (!product) return 0;
  if (typeof product.totalQuantitySold === 'number') return product.totalQuantitySold;
  if (typeof product.quantitySold === 'number') return product.quantitySold;
  return 0;
}
