import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { DashboardStateService } from '../../state/dashboard.state';
import { OrderService } from '../../core/services/order.service';
import { NotificationStateService } from '../../state/notification.state';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyService } from '../../core/services/currency.service';
import { ExperienceService, BusinessInsight } from '../../core/services/experience.service';
import { ActivityDto } from '../../core/models/activity.model';
import { OrderSummaryDto } from '../../core/models/order.model';
import {
  ChartDataResponse,
  DashboardPriority,
  ProductPerformanceDto,
  TopCustomer,
  productQuantitySold,
  productRevenue,
} from '../../core/models/dashboard.model';
import { ROUTES } from '../../core/constants/route.constants';
import { DashboardPeriod } from '../../core/enums';
import { AppChartComponent } from '../../shared/components/app-chart/app-chart.component';
import { AppSkeletonComponent } from '../../shared/components/app-skeleton/app-skeleton.component';
import { AppAlertComponent } from '../../shared/components/app-alert/app-alert.component';
import { AppEmptyStateComponent } from '../../shared/components/app-empty-state/app-empty-state.component';
import { DashboardExperienceComponent } from '../experience/dashboard-experience.component';
import { DashboardCopilotComponent } from '../../shared/components/ai-assistant/dashboard-copilot/dashboard-copilot.component';

type StatusTone = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'neutral';

interface CategorySlice {
  name: string;
  value: number;
  pct: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

interface PriorityView extends DashboardPriority {
  done: boolean;
}

const CATEGORY_COLORS = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#94a3b8', '#ec4899'];
const DONUT_RADIUS = 52;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    AppCurrencyPipe,
    DecimalPipe,
    AppChartComponent,
    AppSkeletonComponent,
    AppAlertComponent,
    AppEmptyStateComponent,
    DashboardExperienceComponent,
    DashboardCopilotComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardState = inject(DashboardStateService);
  private readonly orderService = inject(OrderService);
  private readonly notificationState = inject(NotificationStateService);
  private readonly authService = inject(AuthService);
  private readonly currencyService = inject(CurrencyService);
  readonly experience = inject(ExperienceService);

  readonly routes = ROUTES;
  readonly productRevenue = productRevenue;
  readonly productQuantitySold = productQuantitySold;
  readonly donutCircumference = DONUT_CIRCUMFERENCE;
  readonly donutRadius = DONUT_RADIUS;

  readonly recentOrders = signal<OrderSummaryDto[]>([]);
  readonly ordersLoading = signal(false);
  readonly ordersError = signal<string | null>(null);
  readonly showAddMenu = signal(false);
  readonly chartHeight = signal(260);

  private readonly completedPriorityIds = signal<string[]>([]);
  private readonly dismissedInsightCodes = signal<string[]>([]);
  private loadedPriorityKey = '';
  private loadedDismissKey = '';

  private readonly restoreChecks = effect(() => {
    const priorityKey = this.priorityStorageKey();
    if (priorityKey !== this.loadedPriorityKey) {
      this.loadedPriorityKey = priorityKey;
      this.completedPriorityIds.set(this.readList(this.browserStorage('local'), priorityKey));
    }
    const dismissKey = this.dismissStorageKey();
    if (dismissKey !== this.loadedDismissKey) {
      this.loadedDismissKey = dismissKey;
      this.dismissedInsightCodes.set(this.readList(this.browserStorage('session'), dismissKey));
    }
  });

  readonly periods: ReadonlyArray<{ label: string; value: DashboardPeriod }> = [
    { label: 'Today', value: DashboardPeriod.Today },
    { label: 'Last 7 Days', value: DashboardPeriod.Last7Days },
    { label: 'Last 30 Days', value: DashboardPeriod.Last30Days },
    { label: 'This Month', value: DashboardPeriod.Month },
    { label: 'This Year', value: DashboardPeriod.Year },
    { label: 'All Time', value: DashboardPeriod.All },
  ];

  readonly addActions = [
    { label: 'New Order', icon: 'bi-cart-plus', route: ROUTES.orders.create },
    { label: 'New Product', icon: 'bi-box', route: ROUTES.products.create },
    { label: 'New Customer', icon: 'bi-person-plus', route: ROUTES.customers.create },
    { label: 'Record Payment', icon: 'bi-cash-coin', route: ROUTES.payments.create },
  ] as const;

  readonly overview = this.dashboardState.overview;
  readonly sales = this.dashboardState.sales;
  readonly customers = this.dashboardState.customers;
  readonly products = this.dashboardState.products;
  readonly inventory = this.dashboardState.inventory;
  readonly orders = this.dashboardState.orders;
  readonly finance = this.dashboardState.finance;
  readonly revenueChart = this.dashboardState.revenueChart;
  readonly activityError = this.dashboardState.activityError;
  readonly loading = this.dashboardState.loading;
  readonly error = this.dashboardState.error;
  readonly period = this.dashboardState.period;

  readonly showSkeleton = computed(() => this.loading() && !this.overview() && !this.finance());
  readonly hardFail = computed(() => !this.loading() && !this.overview() && !this.finance() && !!this.error());

  readonly currentPeriodLabel = computed(
    () => this.periods.find((item) => item.value === this.period())?.label ?? 'This period',
  );

  readonly firstName = computed(() => {
    const user = this.authService.currentUser();
    const given = user?.firstName?.trim();
    if (given) return given;
    const full = user?.fullName?.trim();
    if (full) return full.split(/\s+/)[0] || full;
    const email = user?.email;
    if (!email) return 'there';
    const local = email.split('@')[0] ?? '';
    const part = local.split(/[._-]/).filter(Boolean)[0] || local;
    if (!part) return 'there';
    return part.charAt(0).toUpperCase() + part.slice(1);
  });

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const dayPart = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return `${dayPart}, ${this.firstName()}.`;
  });

  readonly dateRangeLabel = computed(() => {
    const range = this.overview()?.dateRange;
    if (range?.startDate && range?.endDate) {
      const start = new Date(range.startDate);
      const end = new Date(range.endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
        return `${fmt.format(start)} – ${fmt.format(end)}`;
      }
    }
    return this.currentPeriodLabel();
  });

  readonly revenueChange = computed(() => this.numericOrNull(this.overview()?.revenueChangePercent));
  readonly ordersChange = computed(() => this.numericOrNull(this.overview()?.ordersChangePercent));
  readonly newCustomers = computed(() => this.numericOrNull(this.overview()?.newCustomers));
  readonly activeCustomers = computed(() => this.numericOrNull(this.overview()?.activeCustomers));
  readonly netProfit = computed(() => this.numericOrNull(this.finance()?.netProfit));
  readonly outstanding = computed(() => this.numericOrNull(this.finance()?.outstandingInvoices));
  readonly averageOrderValue = computed(() => this.numericOrNull(this.sales()?.averageOrderValue));

  readonly inventoryValue = computed(() => {
    const inventory = this.inventory();
    if (typeof inventory?.totalInventoryValue === 'number') return inventory.totalInventoryValue;
    if (typeof inventory?.inventoryValue === 'number') return inventory.inventoryValue;
    if (this.overview() && typeof this.overview()?.totalInventoryValue === 'number') {
      return this.overview()!.totalInventoryValue;
    }
    return null;
  });

  readonly lowStockCount = computed(() => {
    const inventory = this.inventory();
    if (typeof inventory?.lowStockCount === 'number') return inventory.lowStockCount;
    if (typeof inventory?.lowStockProducts === 'number') return inventory.lowStockProducts;
    return this.overview() ? this.overview()!.lowStockProducts : null;
  });

  readonly outOfStockCount = computed(() => {
    const inventory = this.inventory();
    if (typeof inventory?.outOfStockCount === 'number') return inventory.outOfStockCount;
    if (typeof inventory?.outOfStockProducts === 'number') return inventory.outOfStockProducts;
    return this.overview() ? this.overview()!.outOfStockProducts : null;
  });

  readonly inStockPercent = computed(() => {
    const total = this.overview()?.totalProducts;
    const out = this.outOfStockCount();
    if (typeof total !== 'number' || total <= 0 || out == null) return null;
    return Math.max(0, Math.min(100, Math.round(((total - out) / total) * 100)));
  });

  readonly unitsOnHand = computed(() => this.numericOrNull(this.inventory()?.totalStockQuantity));

  readonly showRevenueKpi = computed(() => this.experience.visible('performance') || this.experience.visible('sales'));
  readonly showProfitKpi = computed(() => this.experience.visible('performance'));
  readonly showOrdersKpi = computed(() => this.experience.visible('orders') || this.experience.visible('sales'));
  readonly showCustomersKpi = computed(() => this.experience.visible('customers'));
  readonly showInventoryKpi = computed(
    () => this.experience.visible('products') || this.experience.visible('performance') || this.experience.visible('sales'),
  );

  readonly revenueSpark = computed(() => {
    const fromSales = (this.sales()?.revenueTrends ?? []).map((point) => Number(point.revenue) || 0);
    if (fromSales.length >= 2) return this.sparkPath(fromSales);
    const series = this.revenueChart()?.datasets?.[0]?.data ?? [];
    return this.sparkPath(series.map((value) => Number(value) || 0));
  });

  readonly ordersSpark = computed(() =>
    this.sparkPath((this.sales()?.revenueTrends ?? []).map((point) => Number(point.orderCount) || 0)),
  );

  readonly salesChart = computed((): ChartDataResponse | null => {
    const currency = this.overview()?.currency || this.finance()?.currency || this.dashboardState.currency() || undefined;
    const source = this.revenueChart();
    const dataset =
      source?.datasets?.find((item) => /revenue/i.test(item.label ?? '')) ?? source?.datasets?.[0];
    const values = (dataset?.data ?? []).map((value) => Number(value) || 0);
    if (source && dataset && values.some((value) => value > 0)) {
      return {
        ...source,
        labels: this.displayLabels(source.labels ?? []),
        datasets: [{ ...dataset, label: dataset.label || 'Revenue', data: values, chartStyle: dataset.chartStyle || 'line' }],
        currency,
      };
    }

    const trends = this.sales()?.revenueTrends ?? [];
    if (!trends.some((point) => Number(point.revenue) > 0)) return null;
    return {
      chartType: 'line',
      title: 'Sales performance',
      labels: this.displayLabels(trends.map((point) => point.date)),
      datasets: [{ label: 'Revenue', data: trends.map((point) => Number(point.revenue) || 0), chartStyle: 'line' }],
      dateRange: this.sales()?.dateRange ?? this.overview()?.dateRange ?? {
        startDate: '',
        endDate: '',
        period: this.period(),
      },
      currency,
    };
  });

  readonly salesChartEmpty = computed(() => {
    if ((this.overview()?.totalRevenue ?? 0) > 0) {
      return 'Revenue is recorded, but there is no trend breakdown for this period.';
    }
    return 'Charts appear after completed orders.';
  });

  readonly topProducts = computed((): ProductPerformanceDto[] => {
    const products = this.products();
    const ranked = products?.highestRevenueProducts?.length
      ? products.highestRevenueProducts
      : products?.productRevenue?.length
        ? products.productRevenue
        : products?.bestSellingProducts ?? [];
    return ranked.slice(0, 5);
  });

  readonly categorySlices = computed((): CategorySlice[] => {
    const raw = this.topProducts()
      .map((product) => ({ name: product.productName, value: productRevenue(product) }))
      .filter((item) => item.value > 0);
    const total = raw.reduce((sum, item) => sum + item.value, 0);
    if (!total) return [];
    const ratios = raw.map((item) => item.value / total);
    const pcts = this.roundPercentages(ratios);
    let cumulative = 0;
    return raw.map((item, index) => {
      const length = ratios[index] * DONUT_CIRCUMFERENCE;
      const slice: CategorySlice = {
        name: item.name,
        value: item.value,
        pct: pcts[index],
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        dashArray: `${length} ${DONUT_CIRCUMFERENCE - length}`,
        dashOffset: DONUT_CIRCUMFERENCE / 4 - cumulative,
      };
      cumulative += length;
      return slice;
    });
  });

  readonly categoryTotal = computed(() => this.categorySlices().reduce((sum, item) => sum + item.value, 0));

  readonly financeRows = computed(() => {
    const finance = this.finance();
    if (!finance) return [];
    const row = (label: string, value: number | null | undefined, hint = '') => ({
      label,
      value: typeof value === 'number' ? value : null,
      hint,
    });
    return [
      row('Revenue', finance.totalRevenue),
      row('Expenses', finance.totalExpenses),
      row('Cost of goods sold', finance.costOfGoodsSold),
      row('Gross profit', finance.grossProfit, 'Revenue minus cost of goods sold'),
      row('Net profit', finance.netProfit, 'After COGS and expenses'),
      row('Outstanding invoices', finance.outstandingInvoices),
    ];
  });

  readonly stockAlerts = computed(() => {
    const inventory = this.inventory();
    if (!inventory) return [];
    const recommendations = inventory.reorderRecommendations ?? [];
    if (recommendations.length) {
      return recommendations.slice(0, 4).map((item) => ({
        productId: item.productId,
        productName: item.productName,
        detail: `${this.formatCount(item.currentStock)} on hand · reorder ${this.formatCount(item.suggestedReorderQuantity)}`,
      }));
    }
    return (inventory.stockLevels ?? [])
      .filter((level) => level.isOutOfStock || level.isLowStock)
      .slice(0, 4)
      .map((level) => ({
        productId: level.productId,
        productName: level.productName,
        detail: level.isOutOfStock
          ? 'Out of stock'
          : `${this.formatCount(level.currentStock)} on hand · low stock`,
      }));
  });

  readonly topCustomers = computed(() => (this.customers()?.topCustomers ?? []).slice(0, 3));

  readonly insightSource = computed((): BusinessInsight[] | null => {
    if (this.dashboardState.usedSummary()) return this.dashboardState.insights();
    if (this.loading()) return null;
    const snapshot = this.experience.snapshot();
    if (snapshot) return snapshot.insights ?? [];
    if (this.experience.loadFailed()) return [];
    return null;
  });

  readonly visibleInsights = computed(() => {
    const source = this.insightSource();
    if (!source) return [];
    const hidden = new Set(this.dismissedInsightCodes());
    return source.filter((insight) => !!insight.code && !hidden.has(insight.code));
  });

  readonly insightsPending = computed(() => this.insightSource() === null);
  readonly insightsDismissedAll = computed(() => {
    const source = this.insightSource();
    return !!source?.length && this.visibleInsights().length === 0;
  });
  readonly insightLoadFailed = computed(
    () => !this.dashboardState.usedSummary() && !this.loading() && this.experience.loadFailed() && !this.experience.snapshot(),
  );

  private readonly fallbackPriorities = computed((): DashboardPriority[] => {
    if (this.dashboardState.usedSummary() || this.loading()) return [];
    const list: DashboardPriority[] = [];
    const low = this.lowStockCount() ?? 0;
    const out = this.outOfStockCount() ?? 0;
    const pending =
      this.orders()?.ordersByStatus?.find((status) => status.status.toLowerCase() === 'pending')?.count ?? 0;
    const outstanding = this.outstanding();
    const currency = this.overview()?.currency || this.finance()?.currency || '';
    if (low > 0) {
      list.push({
        id: 'low-stock',
        title: 'Reorder low-stock products',
        description: low === 1 ? '1 product is at or below its reorder level.' : `${low} products are at or below their reorder levels.`,
        priority: 'high',
        route: ROUTES.inventory.base,
        actionLabel: 'View inventory',
      });
    }
    if (out > 0) {
      list.push({
        id: 'out-of-stock',
        title: 'Restock out-of-stock items',
        description: out === 1 ? '1 product has zero stock.' : `${out} products have zero stock.`,
        priority: 'high',
        route: ROUTES.inventory.base,
        actionLabel: 'View inventory',
      });
    }
    if (pending > 0) {
      list.push({
        id: 'pending-orders',
        title: 'Review pending orders',
        description: pending === 1 ? '1 order is waiting to be processed.' : `${pending} orders are waiting to be processed.`,
        priority: 'medium',
        route: ROUTES.orders.list,
        actionLabel: 'Open orders',
      });
    }
    if (outstanding != null && outstanding > 0) {
      const amount = outstanding.toLocaleString(undefined, { maximumFractionDigits: 2 });
      list.push({
        id: 'outstanding',
        title: 'Follow up on outstanding payments',
        description: currency ? `${amount} ${currency} remains unpaid.` : `${amount} remains unpaid.`,
        priority: 'high',
        route: ROUTES.invoices.list,
        actionLabel: 'View invoices',
      });
    }
    return list;
  });

  readonly priorityItems = computed((): PriorityView[] => {
    const done = new Set(this.completedPriorityIds());
    const source = this.dashboardState.usedSummary()
      ? this.dashboardState.priorities()
      : this.fallbackPriorities();
    return source.map((item) => ({ ...item, done: done.has(item.id) }));
  });

  readonly prioritiesPending = computed(
    () => this.loading() && !this.dashboardState.usedSummary() && this.priorityItems().length === 0,
  );

  readonly activityItems = computed(() => {
    const seen = new Set<string>();
    const items: ActivityDto[] = [];
    for (const item of this.dashboardState.recentActivity() ?? []) {
      const key = [
        (item.description || '').trim().toLowerCase(),
        (item.entityType || '').toLowerCase(),
        String(item.entityId || item.entityName || '').toLowerCase(),
      ].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
      if (items.length >= 8) break;
    }
    return items;
  });

  readonly activityPending = computed(
    () => this.loading() && this.dashboardState.recentActivity() === null,
  );

  constructor() {
    this.loadedPriorityKey = this.priorityStorageKey();
    this.completedPriorityIds.set(this.readList(this.browserStorage('local'), this.loadedPriorityKey));
    this.loadedDismissKey = this.dismissStorageKey();
    this.dismissedInsightCodes.set(this.readList(this.browserStorage('session'), this.loadedDismissKey));
  }

  ngOnInit(): void {
    this.dashboardState.loadDashboard();
    this.loadRecentOrders();
    void this.notificationState.refresh(5);
    this.syncChartHeight();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncChartHeight();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.dash__add')) this.showAddMenu.set(false);
  }

  setPeriod(value: DashboardPeriod): void {
    this.dashboardState.setPeriod(value);
  }

  onPeriodChange(event: Event): void {
    this.setPeriod((event.target as HTMLSelectElement).value as DashboardPeriod);
  }

  retry(): void {
    this.dashboardState.loadDashboard(this.period());
    this.loadRecentOrders();
  }

  toggleAddMenu(): void {
    this.showAddMenu.update((open) => !open);
  }

  closeAddMenu(): void {
    this.showAddMenu.set(false);
  }

  toggleCustomize(): void {
    const next = !this.experience.editingLayout();
    this.experience.editingLayout.set(next);
    if (!next || typeof document === 'undefined') return;
    setTimeout(() => document.getElementById('dashboard-layout')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  togglePriority(id: string): void {
    const next = new Set(this.completedPriorityIds());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    const values = [...next];
    this.completedPriorityIds.set(values);
    this.writeList(this.browserStorage('local'), this.priorityStorageKey(), values);
  }

  dismissInsight(code: string): void {
    if (!code || this.dismissedInsightCodes().includes(code)) return;
    const values = [...this.dismissedInsightCodes(), code];
    this.dismissedInsightCodes.set(values);
    this.writeList(this.browserStorage('session'), this.dismissStorageKey(), values);
  }

  formatChange(value: number | null): string | null {
    if (value == null || Number.isNaN(value)) return null;
    const abs = Math.abs(value);
    const digits = Number.isInteger(abs) ? 0 : 1;
    const sign = value > 0 ? '+' : value < 0 ? '−' : '';
    return `${sign}${abs.toFixed(digits)}%`;
  }

  priorityTone(value: string): 'high' | 'medium' | 'low' {
    const key = value.toLowerCase();
    if (key === 'high' || key === 'critical') return 'high';
    if (key === 'low') return 'low';
    return 'medium';
  }

  insightSeverity(value: string | null | undefined): 'info' | 'positive' | 'warning' | 'critical' {
    const key = (value || 'info').toLowerCase();
    if (key === 'positive' || key === 'success') return 'positive';
    if (key === 'warning' || key === 'medium') return 'warning';
    if (key === 'critical' || key === 'high' || key === 'danger') return 'critical';
    return 'info';
  }

  internalRoute(route: string | null | undefined): string | null {
    if (!route || !route.startsWith('/') || route.startsWith('//')) return null;
    return route;
  }

  customerName(customer: TopCustomer): string {
    return customer.fullName?.trim() || customer.customerName?.trim() || 'Customer';
  }

  statusTone(status: string): StatusTone {
    const key = status.toLowerCase();
    if (key.includes('pending')) return 'pending';
    if (key.includes('process') || key.includes('confirm')) return 'processing';
    if (key.includes('ship')) return 'shipped';
    if (key.includes('deliver') || key.includes('complete')) return 'delivered';
    if (key.includes('cancel')) return 'cancelled';
    return 'neutral';
  }

  relativeTime(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins === 1 ? '1 min ago' : `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }

  activityText(item: ActivityDto): string {
    const description = item.description?.trim();
    if (description) return description;
    const action = (item.action || 'Updated').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
    const entity = item.entityName?.trim();
    return entity ? `${action} · ${entity}` : action;
  }

  activityIcon(entityType: string): string {
    const key = (entityType || '').toLowerCase();
    if (key.includes('order')) return 'bi-cart3';
    if (key.includes('invoice') || key.includes('payment')) return 'bi-receipt';
    if (key.includes('customer')) return 'bi-person';
    if (key.includes('product') || key.includes('inventory')) return 'bi-box-seam';
    return 'bi-lightning-charge';
  }

  activityTone(entityType: string): string {
    const key = (entityType || '').toLowerCase();
    if (key.includes('order')) return 'purple';
    if (key.includes('invoice') || key.includes('payment')) return 'green';
    if (key.includes('customer')) return 'blue';
    if (key.includes('product') || key.includes('inventory')) return 'orange';
    return 'gray';
  }

  productInitials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  formatCompactMoney(value: number): string {
    const code = this.overview()?.currency || this.currencyService.currencyCode() || 'USD';
    if (!value) return `${code} 0`;
    if (value >= 1_000_000) return `${code} ${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${code} ${(value / 1_000).toFixed(1)}K`;
    return `${code} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  private loadRecentOrders(): void {
    this.ordersLoading.set(true);
    this.ordersError.set(null);
    this.orderService.getAll({ page: 1, pageSize: 5 }).subscribe({
      next: (result) => {
        this.recentOrders.set(result.items ?? []);
        this.ordersLoading.set(false);
      },
      error: () => {
        this.recentOrders.set([]);
        this.ordersError.set('Recent orders could not be loaded.');
        this.ordersLoading.set(false);
      },
    });
  }

  private syncChartHeight(): void {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    if (width < 420) this.chartHeight.set(180);
    else if (width < 768) this.chartHeight.set(210);
    else this.chartHeight.set(260);
  }

  private priorityStorageKey(): string {
    const user = this.authService.currentUser();
    const tenant = user?.tenantId || 'tenant';
    const id = user?.userId || user?.email || 'user';
    return `bos.dashboard.completed-priorities.${tenant}.${id}`;
  }

  private dismissStorageKey(): string {
    const user = this.authService.currentUser();
    const tenant = user?.tenantId || 'tenant';
    const id = user?.userId || user?.email || 'user';
    return `bos.dashboard.dismissed-insights.${tenant}.${id}`;
  }

  private browserStorage(kind: 'local' | 'session'): Storage | null {
    try {
      if (typeof window === 'undefined') return null;
      return kind === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
      return null;
    }
  }

  private readList(storage: Storage | null, key: string): string[] {
    if (!storage) return [];
    try {
      const raw = storage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }

  private writeList(storage: Storage | null, key: string, values: string[]): void {
    if (!storage) return;
    try {
      storage.setItem(key, JSON.stringify(values));
    } catch {
      /* Ignore private-mode storage failures. */
    }
  }

  private numericOrNull(value: number | null | undefined): number | null {
    return typeof value === 'number' && !Number.isNaN(value) ? value : null;
  }

  private formatCount(value: number): string {
    return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }

  private displayLabels(labels: string[]): string[] {
    return labels.map((label) => {
      if (!/^\d{4}-\d{2}-\d{2}/.test(label)) return label;
      const date = new Date(label);
      if (Number.isNaN(date.getTime())) return label;
      const options: Intl.DateTimeFormatOptions = label.includes('T')
        ? { month: 'short', day: 'numeric', hour: 'numeric' }
        : { month: 'short', day: 'numeric' };
      return new Intl.DateTimeFormat('en-US', options).format(date);
    });
  }

  private sparkPath(values: number[]): string | null {
    const series = values.filter((value) => Number.isFinite(value));
    if (series.length < 2 || new Set(series).size < 2) return null;
    const width = 120;
    const height = 36;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    return series
      .map((value, index) => {
        const x = (index / (series.length - 1)) * width;
        const y = 4 + (1 - (value - min) / range) * (height - 8);
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }

  private roundPercentages(ratios: number[]): number[] {
    const floored = ratios.map((ratio) => Math.floor(ratio * 100));
    let remainder = 100 - floored.reduce((sum, value) => sum + value, 0);
    const order = ratios
      .map((ratio, index) => ({ index, frac: ratio * 100 - floored[index] }))
      .sort((a, b) => b.frac - a.frac);
    for (const item of order) {
      if (remainder <= 0) break;
      floored[item.index] += 1;
      remainder -= 1;
    }
    return floored;
  }
}
