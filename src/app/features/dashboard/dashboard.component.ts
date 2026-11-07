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
import { ActivityService } from '../../core/services/activity.service';
import { OrderService } from '../../core/services/order.service';
import { NotificationStateService } from '../../state/notification.state';
import { AiAssistantStateService } from '../../state/ai-assistant.state';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyService } from '../../core/services/currency.service';
import { FinanceService } from '../../core/services/finance.service';
import { ActivityDto } from '../../core/models/activity.model';
import { OrderSummaryDto } from '../../core/models/order.model';
import {
  ChartDataResponse,
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
  private readonly financeService = inject(FinanceService);
  readonly netProfit = signal<number | null>(null);

  readonly recentActivities = signal<ActivityDto[]>([]);
  readonly recentOrders = signal<OrderSummaryDto[]>([]);
  readonly activityLoading = signal(false);
  readonly ordersLoading = signal(false);
  readonly showAddMenu = signal(false);
  readonly tasks = signal<DashboardTask[]>([]);
  private readonly completedFollowUps = new Set<string>();
  readonly chartHeight = signal(280);

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
  private readonly syncFollowUps = effect(() => {
    const low = this.overview()?.lowStockProducts ?? 0;
    const pending = this.orders()?.ordersByStatus
      ?.find((status) => status.status.toLowerCase() === 'pending')?.count ?? 0;
    const next: DashboardTask[] = [];
    if (low > 0) {
      next.push({
        id: 'low-stock',
        label: `Review ${low} low-stock products`,
        priority: 'High',
        done: this.completedFollowUps.has('low-stock'),
      });
    }
    if (pending > 0) {
      next.push({
        id: 'pending-orders',
        label: `Follow up ${pending} pending orders`,
        priority: 'Medium',
        done: this.completedFollowUps.has('pending-orders'),
      });
    }
    this.tasks.set(next);
  });
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

  readonly revenueTrend = computed((): number | null => this.customers()?.customerGrowthRate ?? null);
  readonly customersTrend = computed((): number | null => this.customers()?.customerGrowthRate ?? null);

  readonly sparkRevenue = computed(() =>
    this.buildSpark(
      this.sales()?.revenueTrends?.map((t) => t.revenue) ?? [],
      this.overview()?.totalRevenue ?? 0,
    ),
  );
  readonly sparkOrders = computed(() =>
    this.buildSpark(
      this.sales()?.revenueTrends?.map((t) => t.orderCount) ?? [],
      this.overview()?.totalOrders ?? 0,
    ),
  );
  readonly sparkProfit = computed(() => {
    const profit = this.netProfit();
    return this.buildSpark(profit == null ? [] : [profit], profit ?? 0);
  });
  readonly sparkCustomers = computed(() => {
    const total = this.overview()?.totalCustomers ?? 0;
    return this.buildSpark(total > 0 ? [total] : [], total);
  });

  /** Sales area chart. Sparse periods (today, this month) are drawn as a full curve so the panel matches All Time. */
  readonly salesChart = computed((): ChartDataResponse | null => {
    const source = this.revenueChart();
    const headline = this.overview()?.totalRevenue ?? 0;
    const revenue =
      source?.datasets?.find((d) => /revenue/i.test(d.label ?? '')) ?? source?.datasets?.[0];
    const values = (revenue?.data ?? []).map((n) => Number(n) || 0);
    if (!values.some((v) => v > 0) && headline <= 0) return null;

    if (!values.length) return null;
    const range = source?.dateRange ?? this.overview()?.dateRange;

    return {
      chartType: 'line',
      title: source?.title || 'Sales Overview',
      labels: source?.labels?.length ? source.labels : values.map((_, index) => `${index + 1}`),
      datasets: [
        {
          label: revenue?.label || 'Revenue',
          data: values,
          chartStyle: 'line',
        },
      ],
      dateRange: range ?? {
        startDate: '',
        endDate: '',
        period: this.period(),
      },
      periodTotal: headline,
    };
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
    this.loadFinance();
    this.loadRecentActivity();
    this.loadRecentOrders();
    void this.notificationState.refresh(5);
    this.syncChartHeight();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncChartHeight();
  }

  private syncChartHeight(): void {
    if (typeof window === 'undefined') return;
    const w = window.innerWidth;
    if (w < 420) this.chartHeight.set(180);
    else if (w < 768) this.chartHeight.set(220);
    else this.chartHeight.set(280);
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
    this.loadFinance();
  }

  onPeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as DashboardPeriod;
    this.setPeriod(value);
  }

  retry(): void {
    this.dashboardState.loadDashboard(this.period());
    this.loadFinance();
    this.loadRecentActivity();
    this.loadRecentOrders();
  }

  toggleAddMenu(): void {
    this.showAddMenu.update((v) => !v);
  }

  closeAddMenu(): void {
    this.showAddMenu.set(false);
  }

  openAiAssistant(event: Event): void {
    event.stopPropagation();
    // This click also reaches the assistant's document listener. Opening in the
    // same turn makes that listener treat the button as an outside click and
    // close the panel before it appears. Open after the click finishes.
    setTimeout(() => this.aiAssistantState.open());
  }

  toggleTask(id: string): void {
    if (this.completedFollowUps.has(id)) this.completedFollowUps.delete(id);
    else this.completedFollowUps.add(id);
    this.tasks.update((list) =>
      list.map((task) => (task.id === id ? { ...task, done: this.completedFollowUps.has(id) } : task)),
    );
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

  private loadFinance(): void {
    this.financeService.getDashboard({ period: this.period() }).subscribe({
      next: (report) => this.netProfit.set(report.netProfit),
      error: () => this.netProfit.set(null),
    });
  }

  private buildCategoryRaw(): Array<{ name: string; value: number }> {
    const products = this.products()?.bestSellingProducts?.slice(0, 5) ?? [];
    return products
      .filter((p) => (p.totalRevenue ?? 0) > 0)
      .map((p) => ({ name: p.productName, value: p.totalRevenue }));
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

  /**
   * Turn a short or flat series into a full-width wave.
   * A single day or a single month-bucket cannot draw a line on its own.
   */
  private expandSeries(values: number[], count: number): number[] {
    const nums = values.filter((v) => Number.isFinite(v));
    if (nums.length === 0) return Array.from({ length: Math.max(count, 2) }, () => 0);
    if (nums.length === 1) return Array.from({ length: Math.max(count, 2) }, () => nums[0]);
    return nums.length === count ? nums.slice() : this.resample(nums, count);
  }

  private resample(values: number[], count: number): number[] {
    if (values.length === count) return values.slice();
    const result: number[] = [];
    const maxIndex = values.length - 1;
    for (let i = 0; i < count; i++) {
      const t = (i / Math.max(count - 1, 1)) * maxIndex;
      const i0 = Math.floor(t);
      const i1 = Math.min(i0 + 1, maxIndex);
      const f = t - i0;
      const smooth = f * f * (3 - 2 * f);
      result.push(values[i0] + (values[i1] - values[i0]) * smooth);
    }
    return result;
  }

  private periodLabels(count: number, sourceLabels: string[]): string[] {
    let start: Date | null = null;
    let end: Date | null = null;
    const period = this.period();

    if (period === DashboardPeriod.All || period === DashboardPeriod.Year) {
      const parsed = sourceLabels
        .map((label) => new Date(label))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());
      if (parsed.length) {
        start = parsed[0];
        end = parsed[parsed.length - 1];
      }
    }

    const range = this.sales()?.dateRange ?? this.overview()?.dateRange;
    if (!start && range?.startDate) start = new Date(range.startDate);
    if (!end && range?.endDate) end = new Date(range.endDate);

    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return Array.from({ length: count }, (_, i) => `${i + 1}`);
    }

    const span = end.getTime() - start.getTime();
    const fmt =
      span < 36 * 60 * 60 * 1000
        ? new Intl.DateTimeFormat('en-US', { hour: 'numeric' })
        : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

    return Array.from({ length: count }, (_, i) => {
      const t = count === 1 ? 0 : i / (count - 1);
      return fmt.format(new Date(start.getTime() + span * t));
    });
  }

  private buildSpark(values: number[], fallbackPeak = 0): { line: string; area: string } {
    const finite = values.filter((v) => Number.isFinite(v));
    const peak = finite.length ? Math.max(...finite) : 0;
    const basis = peak > 0 ? finite : fallbackPeak > 0 ? [fallbackPeak] : finite;
    const series = this.expandSeries(basis, 12);
    const width = 120;
    const height = 40;
    const padX = 1.5;
    const padY = 5;
    const min = Math.min(...series);
    const max = Math.max(...series);
    const range = max - min || 1;
    const coords = series.map((v, i) => ({
      x: padX + (i / Math.max(series.length - 1, 1)) * (width - padX * 2),
      y: padY + (1 - (v - min) / range) * (height - padY * 2),
    }));
    const line = this.toSmoothPath(coords);
    const first = coords[0];
    const last = coords[coords.length - 1];
    const area = `${line} L ${last.x.toFixed(1)} ${height} L ${first.x.toFixed(1)} ${height} Z`;
    return { line, area };
  }

  private toSmoothPath(points: Array<{ x: number; y: number }>): string {
    if (!points.length) return '';
    const fmt = (n: number) => n.toFixed(1);
    if (points.length === 1) {
      return `M 0 ${fmt(points[0].y)} L 120 ${fmt(points[0].y)}`;
    }
    let d = `M ${fmt(points[0].x)} ${fmt(points[0].y)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${fmt(cp1x)} ${fmt(cp1y)}, ${fmt(cp2x)} ${fmt(cp2y)}, ${fmt(p2.x)} ${fmt(p2.y)}`;
    }
    return d;
  }
}
