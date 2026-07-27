import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { DashboardStateService } from '../../state/dashboard.state';
import { ActivityService } from '../../core/services/activity.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { NotificationStateService } from '../../state/notification.state';
import { ActivityDto } from '../../core/models/activity.model';
import { InvoiceSummaryDto } from '../../core/models/invoice.model';
import { ROUTES } from '../../core/constants/route.constants';
import { DashboardPeriod } from '../../core/enums';
import { AppBreadcrumbComponent } from '../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppCardComponent } from '../../shared/components/app-card/app-card.component';
import { AppChartComponent } from '../../shared/components/app-chart/app-chart.component';
import { AppBadgeComponent } from '../../shared/components/app-badge/app-badge.component';
import { AppSkeletonComponent } from '../../shared/components/app-skeleton/app-skeleton.component';
import { AppAlertComponent } from '../../shared/components/app-alert/app-alert.component';
import { AppEmptyStateComponent } from '../../shared/components/app-empty-state/app-empty-state.component';
import { DashboardCopilotComponent } from '../../shared/components/ai-assistant/dashboard-copilot/dashboard-copilot.component';

type StatusVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';
type SortDirection = 'asc' | 'desc';
type CustomerSortField = 'fullName' | 'totalOrders' | 'totalSpending';
type ProductSortField = 'productName' | 'totalQuantitySold' | 'totalRevenue';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    AppCurrencyPipe,
    DecimalPipe,
    // AppBreadcrumbComponent,
    AppCardComponent,
    AppChartComponent,
    AppBadgeComponent,
    AppSkeletonComponent,
    AppAlertComponent,
    AppEmptyStateComponent,
    DashboardCopilotComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardState = inject(DashboardStateService);
  private readonly activityService = inject(ActivityService);
  private readonly invoiceService = inject(InvoiceService);
  private readonly notificationState = inject(NotificationStateService);

  // --- Widget data -----------------------------------------------------
  readonly recentActivities = signal<ActivityDto[]>([]);
  readonly recentLogins = signal<ActivityDto[]>([]);
  readonly latestInvoices = signal<InvoiceSummaryDto[]>([]);
  readonly activityLoading = signal(false);
  readonly widgetsLoading = signal(false);

  // --- Static config -----------------------------------------------------
  readonly routes = ROUTES;
  readonly periods: ReadonlyArray<{ label: string; value: DashboardPeriod }> = [
    { label: 'Today', value: DashboardPeriod.Today },
    { label: 'This week', value: DashboardPeriod.Week },
    { label: 'This month', value: DashboardPeriod.Month },
    { label: 'This year', value: DashboardPeriod.Year },
    { label: 'All time', value: DashboardPeriod.All },
  ];
  readonly breadcrumbs = [{ label: 'Home', route: '/dashboard' }, { label: 'Overview' }];

  /** Simple jump links — fewer options so non-technical users are not overwhelmed. */
  readonly sections: ReadonlyArray<{ id: string; label: string; icon: string }> = [
    { id: 'section-overview', label: 'Numbers', icon: 'bi-grid-1x2' },
    { id: 'section-attention', label: 'To do', icon: 'bi-exclamation-circle' },
    { id: 'section-trends', label: 'Charts', icon: 'bi-graph-up' },
    { id: 'section-details', label: 'Details', icon: 'bi-list-ul' },
  ];

  // --- State passthroughs -----------------------------------------------------
  readonly unreadCount = this.notificationState.unreadCount;
  readonly overview = this.dashboardState.overview;
  readonly sales = this.dashboardState.sales;
  readonly customers = this.dashboardState.customers;
  readonly products = this.dashboardState.products;
  readonly inventory = this.dashboardState.inventory;
  readonly orders = this.dashboardState.orders;
  readonly revenueChart = this.dashboardState.revenueChart;
  readonly ordersChart = this.dashboardState.ordersChart;
  readonly loading = this.dashboardState.loading;
  readonly error = this.dashboardState.error;
  readonly period = this.dashboardState.period;

  // --- Derived UI state (view-only, no new business logic) -----------------
  readonly currentPeriodLabel = computed(
    () => this.periods.find((p) => p.value === this.period())?.label ?? '',
  );

  /** Friendly time-of-day greeting for non-technical users. */
  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  /**
   * Traffic-light health of the business based on stock pressure.
   * alert = out of stock, watch = low stock, good = otherwise.
   */
  readonly businessHealth = computed((): 'good' | 'watch' | 'alert' => {
    const o = this.overview();
    if (!o) return 'good';
    if ((o.outOfStockProducts ?? 0) > 0) return 'alert';
    if ((o.lowStockProducts ?? 0) > 0) return 'watch';
    return 'good';
  });

  readonly healthHeadline = computed(() => {
    switch (this.businessHealth()) {
      case 'alert':
        return 'Some products need your attention';
      case 'watch':
        return 'Looking okay — a few items are running low';
      default:
        return 'Your business looks healthy';
    }
  });

  readonly healthHint = computed(() => {
    const o = this.overview();
    if (!o) return 'Numbers below update as you sell and restock.';
    const out = o.outOfStockProducts ?? 0;
    const low = o.lowStockProducts ?? 0;
    if (out > 0) {
      return `${out} product${out === 1 ? '' : 's'} sold out. Restock soon so you don’t lose sales.`;
    }
    if (low > 0) {
      return `${low} product${low === 1 ? '' : 's'} running low on stock.`;
    }
    return `Showing results for ${this.currentPeriodLabel().toLowerCase()}.`;
  });

  // --- Table sorting (client-side, view-only — underlying data is untouched) --
  private readonly customerSort = signal<{ field: CustomerSortField; direction: SortDirection }>({
    field: 'totalSpending',
    direction: 'desc',
  });
  private readonly productSort = signal<{ field: ProductSortField; direction: SortDirection }>({
    field: 'totalRevenue',
    direction: 'desc',
  });

  readonly sortedTopCustomers = computed(() => {
    const list = this.customers()?.topCustomers;
    if (!list) return null;
    const { field, direction } = this.customerSort();
    return this.sortBy(list, field, direction);
  });

  readonly sortedBestSellingProducts = computed(() => {
    const list = this.products()?.bestSellingProducts;
    if (!list) return null;
    const { field, direction } = this.productSort();
    return this.sortBy(list, field, direction);
  });

  readonly customerSortState = this.customerSort.asReadonly();
  readonly productSortState = this.productSort.asReadonly();

  ngOnInit(): void {
    this.dashboardState.loadDashboard();
    this.loadRecentActivity();
    this.loadWidgets();
  }

  loadWidgets(): void {
    this.widgetsLoading.set(true);
    void this.notificationState.refresh(5);

    this.activityService.getAll({ page: 1, pageSize: 5, action: 'Login' }).subscribe({
      next: (result) => {
        this.recentLogins.set(result.items);
      },
      error: () => this.recentLogins.set([]),
    });

    this.invoiceService.getAll({ page: 1, pageSize: 5 }).subscribe({
      next: (result) => {
        this.latestInvoices.set(result.items);
        this.widgetsLoading.set(false);
      },
      error: () => {
        this.latestInvoices.set([]);
        this.widgetsLoading.set(false);
      },
    });
  }

  loadRecentActivity(): void {
    this.activityLoading.set(true);
    this.activityService.getRecent(10).subscribe({
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

  onPeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as DashboardPeriod;
    this.dashboardState.setPeriod(value);
  }

  /** Thin wrapper so the desktop pill switcher can set the period directly. */
  setPeriod(value: DashboardPeriod): void {
    this.dashboardState.setPeriod(value);
  }

  retry(): void {
    this.dashboardState.loadDashboard(this.period());
  }

  getStatusVariant(status: string): StatusVariant {
    const map: Record<string, StatusVariant> = {
      Pending: 'warning',
      Confirmed: 'info',
      Processing: 'primary',
      Completed: 'success',
      Cancelled: 'danger',
    };
    return map[status] ?? 'neutral';
  }

  toggleCustomerSort(field: CustomerSortField): void {
    this.customerSort.update((current) => this.nextSortState(current, field));
  }

  toggleProductSort(field: ProductSortField): void {
    this.productSort.update((current) => this.nextSortState(current, field));
  }

  /** Smooth-scrolls to a section, respecting the user's motion preference. */
  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (!el) return;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  trackByIndex(index: number): number {
    return index;
  }

  private nextSortState<TField extends string>(
    current: { field: TField; direction: SortDirection },
    field: TField,
  ): { field: TField; direction: SortDirection } {
    if (current.field !== field) {
      return { field, direction: 'desc' };
    }
    return { field, direction: current.direction === 'desc' ? 'asc' : 'desc' };
  }

  private sortBy<T, K extends keyof T>(
    list: readonly T[],
    field: K,
    direction: SortDirection,
  ): T[] {
    const copy = [...list];
    copy.sort((a, b) => {
      const va = a[field];
      const vb = b[field];
      let result = 0;
      if (typeof va === 'number' && typeof vb === 'number') {
        result = va - vb;
      } else {
        result = String(va ?? '').localeCompare(String(vb ?? ''));
      }
      return direction === 'asc' ? result : -result;
    });
    return copy;
  }
}