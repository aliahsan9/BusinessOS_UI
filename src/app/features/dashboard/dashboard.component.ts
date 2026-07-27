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
type AttentionSeverity = 'danger' | 'warning' | 'info';

export interface AttentionItem {
  id: string;
  severity: AttentionSeverity;
  title: string;
  detail: string;
  actionLabel: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    AppCurrencyPipe,
    DecimalPipe,
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

  readonly recentActivities = signal<ActivityDto[]>([]);
  readonly latestInvoices = signal<InvoiceSummaryDto[]>([]);
  readonly activityLoading = signal(false);
  readonly widgetsLoading = signal(false);
  readonly showInsights = signal(false);

  readonly routes = ROUTES;
  readonly periods: ReadonlyArray<{ label: string; value: DashboardPeriod }> = [
    { label: 'Today', value: DashboardPeriod.Today },
    { label: 'This week', value: DashboardPeriod.Week },
    { label: 'This month', value: DashboardPeriod.Month },
    { label: 'This year', value: DashboardPeriod.Year },
    { label: 'All time', value: DashboardPeriod.All },
  ];

  /** Primary work — one clear job per button. */
  readonly primaryAction = {
    label: 'New sale',
    hint: 'Create a customer order',
    icon: 'bi-cart-plus',
    route: ROUTES.orders.create,
  };

  readonly workActions: ReadonlyArray<{
    label: string;
    icon: string;
    route: string;
  }> = [
    { label: 'Add product', icon: 'bi-box', route: ROUTES.products.create },
    { label: 'Add customer', icon: 'bi-person-plus', route: ROUTES.customers.create },
    { label: 'Check stock', icon: 'bi-box-seam', route: ROUTES.inventory.stockLevels },
    { label: 'Record payment', icon: 'bi-cash-coin', route: ROUTES.payments.create },
  ];

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

  readonly currentPeriodLabel = computed(
    () => this.periods.find((p) => p.value === this.period())?.label ?? '',
  );

  readonly greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  });

  /** Actionable work queue — only items the user can act on. */
  readonly attentionItems = computed((): AttentionItem[] => {
    const items: AttentionItem[] = [];
    const o = this.overview();
    const out = o?.outOfStockProducts ?? 0;
    const low = o?.lowStockProducts ?? 0;
    const unread = this.unreadCount();
    const pending = this.orders()?.ordersByStatus?.find(
      (s) => s.status.toLowerCase() === 'pending',
    )?.count ?? 0;
    const processing = this.orders()?.ordersByStatus?.find(
      (s) => ['processing', 'confirmed'].includes(s.status.toLowerCase()),
    )?.count ?? 0;

    if (out > 0) {
      items.push({
        id: 'out-of-stock',
        severity: 'danger',
        title: `${out} sold out`,
        detail: 'Customers can’t buy these until you restock.',
        actionLabel: 'Restock',
        route: ROUTES.inventory.stockLevels,
        icon: 'bi-x-circle',
      });
    }
    if (low > 0) {
      items.push({
        id: 'low-stock',
        severity: 'warning',
        title: `${low} running low`,
        detail: 'Reorder before they sell out.',
        actionLabel: 'Check stock',
        route: ROUTES.inventory.stockLevels,
        icon: 'bi-exclamation-triangle',
      });
    }
    if (pending > 0) {
      items.push({
        id: 'pending-orders',
        severity: 'warning',
        title: `${pending} waiting orders`,
        detail: 'Confirm or process these so customers aren’t left hanging.',
        actionLabel: 'Open orders',
        route: ROUTES.orders.list,
        icon: 'bi-hourglass-split',
      });
    }
    if (processing > 0 && pending === 0) {
      items.push({
        id: 'open-orders',
        severity: 'info',
        title: `${processing} orders in progress`,
        detail: 'Finish these to keep fulfillment moving.',
        actionLabel: 'View orders',
        route: ROUTES.orders.list,
        icon: 'bi-arrow-repeat',
      });
    }
    if (unread > 0) {
      items.push({
        id: 'unread',
        severity: 'info',
        title: `${unread} unread message${unread === 1 ? '' : 's'}`,
        detail: 'Something may need a reply.',
        actionLabel: 'Open inbox',
        route: ROUTES.notifications.list,
        icon: 'bi-bell',
      });
    }

    return items;
  });

  readonly hasAttention = computed(() => this.attentionItems().length > 0);

  readonly pendingOrderCount = computed(() => {
    return (
      this.orders()?.ordersByStatus?.find((s) => s.status.toLowerCase() === 'pending')?.count ?? 0
    );
  });

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
    this.activityService.getRecent(8).subscribe({
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

  setPeriod(value: DashboardPeriod): void {
    this.dashboardState.setPeriod(value);
  }

  retry(): void {
    this.dashboardState.loadDashboard(this.period());
  }

  toggleInsights(): void {
    this.showInsights.update((v) => !v);
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
