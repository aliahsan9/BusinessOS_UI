import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { DashboardStateService } from '../../state/dashboard.state';
import { ActivityService } from '../../core/services/activity.service';
import { OrderService } from '../../core/services/order.service';
import { NotificationStateService } from '../../state/notification.state';
import { AiAssistantStateService } from '../../state/ai-assistant.state';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyService } from '../../core/services/currency.service';
import { ActivityDto } from '../../core/models/activity.model';
import { OrderSummaryDto } from '../../core/models/order.model';
import {
  ProductPerformanceDto,
} from '../../core/models/dashboard.model';
import { ROUTES } from '../../core/constants/route.constants';
import { DashboardPeriod } from '../../core/enums';
import { AppChartComponent } from '../../shared/components/app-chart/app-chart.component';
import { AppSkeletonComponent } from '../../shared/components/app-skeleton/app-skeleton.component';
import { AppAlertComponent } from '../../shared/components/app-alert/app-alert.component';
import { AppEmptyStateComponent } from '../../shared/components/app-empty-state/app-empty-state.component';

type StatusTone = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'neutral';

export interface DashboardTask {
  id: string;
  label: string;
  priority: 'High' | 'Medium' | 'Low';
  done: boolean;
}

export interface CategorySlice {
  name: string;
  value: number;
  pct: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

const CATEGORY_COLORS = ['#7c5cfc', '#3b82f6', '#10b981', '#f59e0b', '#94a3b8', '#ec4899'];
const DONUT_RADIUS = 54;
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
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardState = inject(DashboardStateService);
  private readonly activityService = inject(ActivityService);
  private readonly orderService = inject(OrderService);
  private readonly notificationState = inject(NotificationStateService);
  private readonly aiAssistantState = inject(AiAssistantStateService);
  private readonly authService = inject(AuthService);
  private readonly currencyService = inject(CurrencyService);

  readonly recentActivities = signal<ActivityDto[]>([]);
  readonly recentOrders = signal<OrderSummaryDto[]>([]);
  readonly activityLoading = signal(false);
  readonly ordersLoading = signal(false);
  readonly showAddMenu = signal(false);
  readonly tasks = signal<DashboardTask[]>([]);

  readonly routes = ROUTES;
  readonly periods: ReadonlyArray<{ label: string; value: DashboardPeriod }> = [
    { label: 'Today', value: DashboardPeriod.Today },
    { label: 'This Week', value: DashboardPeriod.Week },
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
  readonly orders = this.dashboardState.orders;
  readonly revenueChart = this.dashboardState.revenueChart;
  readonly loading = this.dashboardState.loading;
  readonly error = this.dashboardState.error;
  readonly period = this.dashboardState.period;

  readonly currentPeriodLabel = computed(
    () => this.periods.find((p) => p.value === this.period())?.label ?? 'This Period',
  );

  readonly firstName = computed(() => {
    const email = this.authService.currentUser()?.email;
    if (!email) return 'there';
    const local = email.split('@')[0] ?? 'there';
    const part = local.split(/[._-]/)[0] || local;
    return part.charAt(0).toUpperCase() + part.slice(1);
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

  readonly revenueTrend = computed(() => this.customers()?.customerGrowthRate ?? 12.5);
  readonly ordersTrend = computed(() => {
    const rate = this.orders()?.successRate;
    return rate != null ? Math.min(Math.max(rate / 5, 4), 28) : 18.7;
  });
  readonly profitTrend = computed(() => 8.3);
  readonly customersTrend = computed(() => this.customers()?.customerGrowthRate ?? 21.6);

  readonly estimatedProfit = computed(() => {
    const revenue = this.overview()?.totalRevenue ?? 0;
    return Math.round(revenue * 0.25);
  });

  readonly sparkRevenue = computed(() => this.buildSparkPoints(this.sales()?.revenueTrends?.map((t) => t.revenue) ?? []));
  readonly sparkOrders = computed(() =>
    this.buildSparkPoints(this.sales()?.revenueTrends?.map((t) => t.orderCount) ?? []),
  );
  readonly sparkProfit = computed(() =>
    this.buildSparkPoints((this.sales()?.revenueTrends?.map((t) => t.revenue) ?? []).map((v) => v * 0.25)),
  );
  readonly sparkCustomers = computed(() => {
    const total = this.overview()?.totalCustomers ?? 0;
    const seed = [0.72, 0.78, 0.75, 0.84, 0.88, 0.93, 1].map((n) => n * Math.max(total, 10));
    return this.buildSparkPoints(seed);
  });

  readonly categorySlices = computed((): CategorySlice[] => {
    const raw = this.buildCategoryRaw();
    const total = raw.reduce((sum, item) => sum + item.value, 0) || 1;
    let cumulative = 0;
    const ratios = raw.map((item) => item.value / total);
    const pcts = this.roundPercentages(ratios);

    return raw.map((item, index) => {
      const ratio = ratios[index];
      const length = ratio * DONUT_CIRCUMFERENCE;
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

  readonly categoryTotal = computed(() => {
    const raw = this.buildCategoryRaw();
    return raw.reduce((sum, item) => sum + item.value, 0);
  });

  readonly categoryTotalLabel = computed(() => this.formatCompactMoney(this.categoryTotal()));

  readonly topProducts = computed((): ProductPerformanceDto[] => {
    return this.products()?.bestSellingProducts?.slice(0, 5) ?? [];
  });

  readonly salesHeadline = computed(() => this.overview()?.totalRevenue ?? 0);
  readonly salesChange = computed(() => this.revenueTrend());

  readonly donutCircumference = DONUT_CIRCUMFERENCE;
  readonly donutRadius = DONUT_RADIUS;

  ngOnInit(): void {
    this.dashboardState.loadDashboard();
    this.loadRecentActivity();
    this.loadRecentOrders();
    void this.notificationState.refresh(5);
    this.seedTasks();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.dash__add')) {
      this.showAddMenu.set(false);
    }
  }

  setPeriod(value: DashboardPeriod): void {
    this.dashboardState.setPeriod(value);
  }

  onPeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as DashboardPeriod;
    this.dashboardState.setPeriod(value);
  }

  retry(): void {
    this.dashboardState.loadDashboard(this.period());
    this.loadRecentActivity();
    this.loadRecentOrders();
  }

  toggleAddMenu(): void {
    this.showAddMenu.update((v) => !v);
  }

  closeAddMenu(): void {
    this.showAddMenu.set(false);
  }

  openAiAssistant(): void {
    this.aiAssistantState.open();
  }

  toggleTask(id: string): void {
    this.tasks.update((list) =>
      list.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    );
  }

  productTrend(index: number): number {
    const trends = [15, -3, 8, 12, -5, 6, 9];
    return trends[index % trends.length];
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
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  activityIcon(entityType: string): string {
    const key = (entityType || '').toLowerCase();
    if (key.includes('order')) return 'bi-cart3';
    if (key.includes('invoice') || key.includes('payment')) return 'bi-receipt';
    if (key.includes('customer')) return 'bi-person-plus';
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
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join('');
  }

  private loadRecentOrders(): void {
    this.ordersLoading.set(true);
    this.orderService.getAll({ page: 1, pageSize: 6 }).subscribe({
      next: (result) => {
        this.recentOrders.set(result.items ?? []);
        this.ordersLoading.set(false);
      },
      error: () => {
        this.recentOrders.set([]);
        this.ordersLoading.set(false);
      },
    });
  }

  private loadRecentActivity(): void {
    this.activityLoading.set(true);
    this.activityService.getRecent(6).subscribe({
      next: (items) => {
        this.recentActivities.set(items);
        this.activityLoading.set(false);
      },
      error: () => {
        this.recentActivities.set([]);
        this.activityLoading.set(false);
      },
    });
  }

  private seedTasks(): void {
    this.tasks.set([
      { id: 't1', label: 'Follow up pending orders', priority: 'High', done: false },
      { id: 't2', label: 'Review low-stock products', priority: 'Medium', done: false },
      { id: 't3', label: 'Send weekly sales summary', priority: 'Low', done: false },
    ]);
  }

  private buildCategoryRaw(): Array<{ name: string; value: number }> {
    const products = this.products()?.bestSellingProducts?.slice(0, 5) ?? [];
    const productRows = products
      .filter((p) => (p.totalRevenue ?? 0) > 0)
      .map((p) => ({ name: p.productName, value: p.totalRevenue }));

    if (productRows.length) {
      return productRows;
    }

    const statuses = this.orders()?.ordersByStatus ?? [];
    if (statuses.length) {
      return statuses
        .filter((s) => s.count > 0)
        .map((s) => ({ name: s.status, value: s.count }));
    }

    const total = this.overview()?.totalRevenue ?? 0;
    if (total > 0) {
      return [
        { name: 'Electronics', value: total * 0.36 },
        { name: 'Accessories', value: total * 0.25 },
        { name: 'Office Supplies', value: total * 0.17 },
        { name: 'Software', value: total * 0.12 },
        { name: 'Others', value: total * 0.1 },
      ];
    }

    return [
      { name: 'Electronics', value: 36 },
      { name: 'Accessories', value: 25 },
      { name: 'Office Supplies', value: 17 },
      { name: 'Software', value: 12 },
      { name: 'Others', value: 10 },
    ];
  }

  private formatCompactMoney(value: number): string {
    const code = this.currencyService.currencyCode() || 'PKR';
    if (!value) return `${code} 0`;
    if (value >= 1_000_000) return `${code} ${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `${code} ${(value / 1_000).toFixed(1)}K`;
    return `${code} ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  private roundPercentages(ratios: number[]): number[] {
    const floored = ratios.map((r) => Math.floor(r * 100));
    let remainder = 100 - floored.reduce((sum, n) => sum + n, 0);
    const order = ratios
      .map((r, i) => ({ i, frac: r * 100 - floored[i] }))
      .sort((a, b) => b.frac - a.frac);

    for (const item of order) {
      if (remainder <= 0) break;
      floored[item.i] += 1;
      remainder -= 1;
    }
    return floored;
  }

  private buildSparkPoints(values: number[]): string {
    if (!values.length) {
      values = [12, 18, 14, 22, 19, 28, 24];
    }
    const width = 120;
    const height = 36;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values
      .map((v, i) => {
        const x = (i / Math.max(values.length - 1, 1)) * width;
        const y = height - ((v - min) / range) * (height - 4) - 2;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }
}
