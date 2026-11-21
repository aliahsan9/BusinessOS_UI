import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { DashboardService } from '../core/services/dashboard.service';
import { FinanceService } from '../core/services/finance.service';
import { ActivityService } from '../core/services/activity.service';
import {
  ChartDataResponse,
  CustomerAnalyticsDashboardResponse,
  DashboardOverviewResponse,
  DashboardPriority,
  DashboardQueryParams,
  InventoryAnalyticsDashboardResponse,
  OrderAnalyticsResponse,
  OwnerDashboardSummary,
  ProductAnalyticsResponse,
  SalesAnalyticsResponse,
} from '../core/models/dashboard.model';
import { FinancialDashboard } from '../core/models/finance.model';
import { ActivityDto } from '../core/models/activity.model';
import type { BusinessInsight } from '../core/services/experience.service';
import { DashboardPeriod } from '../core/enums';

export interface DashboardState {
  overview: DashboardOverviewResponse | null;
  sales: SalesAnalyticsResponse | null;
  customers: CustomerAnalyticsDashboardResponse | null;
  products: ProductAnalyticsResponse | null;
  inventory: InventoryAnalyticsDashboardResponse | null;
  orders: OrderAnalyticsResponse | null;
  revenueChart: ChartDataResponse | null;
  ordersChart: ChartDataResponse | null;
  finance: FinancialDashboard | null;
  insights: BusinessInsight[];
  priorities: DashboardPriority[];
  recentActivity: ActivityDto[] | null;
  activityError: string | null;
  currency: string | null;
  previousDateRange: DashboardOverviewResponse['previousDateRange'] | null;
  usedSummary: boolean;
  loading: boolean;
  error: string | null;
  period: DashboardPeriod;
}

const initialState: DashboardState = {
  overview: null,
  sales: null,
  customers: null,
  products: null,
  inventory: null,
  orders: null,
  revenueChart: null,
  ordersChart: null,
  finance: null,
  insights: [],
  priorities: [],
  recentActivity: null,
  activityError: null,
  currency: null,
  previousDateRange: null,
  usedSummary: false,
  loading: false,
  error: null,
  period: DashboardPeriod.Month,
};

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  private readonly dashboardService = inject(DashboardService);
  private readonly financeService = inject(FinanceService);
  private readonly activityService = inject(ActivityService);
  private readonly state = signal<DashboardState>(initialState);
  private loadToken = 0;

  readonly overview = computed(() => this.state().overview);
  readonly sales = computed(() => this.state().sales);
  readonly customers = computed(() => this.state().customers);
  readonly products = computed(() => this.state().products);
  readonly inventory = computed(() => this.state().inventory);
  readonly orders = computed(() => this.state().orders);
  readonly revenueChart = computed(() => this.state().revenueChart);
  readonly ordersChart = computed(() => this.state().ordersChart);
  readonly finance = computed(() => this.state().finance);
  readonly insights = computed(() => this.state().insights);
  readonly priorities = computed(() => this.state().priorities);
  readonly recentActivity = computed(() => this.state().recentActivity);
  readonly activityError = computed(() => this.state().activityError);
  readonly currency = computed(() => this.state().currency);
  readonly previousDateRange = computed(() => this.state().previousDateRange);
  readonly usedSummary = computed(() => this.state().usedSummary);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly period = computed(() => this.state().period);

  loadDashboard(period: DashboardPeriod = DashboardPeriod.Month): void {
    const params: DashboardQueryParams = { period, top: 10 };
    const token = ++this.loadToken;
    this.patchState({ loading: true, error: null, period });

    this.dashboardService.getSummary(params).subscribe({
      next: (summary) => {
        if (token !== this.loadToken) return;
        this.applySummary(summary);
      },
      error: () => {
        if (token !== this.loadToken) return;
        this.loadFallback(params, token);
      },
    });
  }

  setPeriod(period: DashboardPeriod): void {
    this.loadDashboard(period);
  }

  private applySummary(summary: OwnerDashboardSummary): void {
    const hasFigures = !!(summary.overview || summary.sales || summary.finance);
    this.patchState({
      overview: summary.overview ?? null,
      sales: summary.sales ?? null,
      customers: summary.customers ?? null,
      products: summary.products ?? null,
      inventory: summary.inventory ?? null,
      orders: summary.orders ?? null,
      revenueChart: summary.revenueChart ?? null,
      ordersChart: null,
      finance: summary.finance ?? null,
      insights: summary.insights ?? [],
      priorities: summary.priorities ?? [],
      recentActivity: summary.recentActivity ?? [],
      activityError: null,
      currency: summary.currency ?? summary.overview?.currency ?? summary.finance?.currency ?? null,
      previousDateRange: summary.previousDateRange ?? summary.overview?.previousDateRange ?? null,
      usedSummary: true,
      loading: false,
      error: hasFigures ? null : 'Failed to load dashboard data. Please try again.',
    });
  }

  private loadFallback(params: DashboardQueryParams, token: number): void {
    const safe = <T>(source: Observable<T>) => source.pipe(catchError(() => of(null as T | null)));
    forkJoin({
      overview: safe(this.dashboardService.getOverview(params)),
      sales: safe(this.dashboardService.getSales(params)),
      customers: safe(this.dashboardService.getCustomers(params)),
      products: safe(this.dashboardService.getProducts(params)),
      inventory: safe(this.dashboardService.getInventory(params)),
      orders: safe(this.dashboardService.getOrders(params)),
      revenueChart: safe(this.dashboardService.getRevenueChart(params)),
      ordersChart: safe(this.dashboardService.getOrdersChart(params)),
      finance: safe(this.financeService.getDashboard({ period: params.period })),
      activity: this.activityService.getRecent(12).pipe(
        map((items) => ({ items, error: null as string | null })),
        catchError(() => of({ items: [] as ActivityDto[], error: 'Activity could not be loaded.' })),
      ),
    }).subscribe({
      next: (data) => {
        if (token !== this.loadToken) return;
        const hasFigures = !!(data.overview || data.sales || data.finance || data.inventory);
        this.patchState({
          overview: data.overview,
          sales: data.sales,
          customers: data.customers,
          products: data.products,
          inventory: data.inventory,
          orders: data.orders,
          revenueChart: data.revenueChart,
          ordersChart: data.ordersChart,
          finance: data.finance,
          insights: [],
          priorities: [],
          recentActivity: data.activity.items,
          activityError: data.activity.error,
          currency: data.overview?.currency ?? data.finance?.currency ?? null,
          previousDateRange: data.overview?.previousDateRange ?? null,
          usedSummary: false,
          loading: false,
          error: hasFigures ? null : 'Failed to load dashboard data. Please try again.',
        });
      },
      error: () => {
        if (token !== this.loadToken) return;
        const hadData = !!this.state().overview || !!this.state().finance;
        this.patchState({
          loading: false,
          usedSummary: false,
          error: hadData
            ? 'Could not refresh the dashboard. Showing the last loaded figures.'
            : 'Failed to load dashboard data. Please try again.',
        });
      },
    });
  }

  private patchState(partial: Partial<DashboardState>): void {
    this.state.update((current) => ({ ...current, ...partial }));
  }
}
