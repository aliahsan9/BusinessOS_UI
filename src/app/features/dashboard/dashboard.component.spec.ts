import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { OrderService } from '../../core/services/order.service';
import { TokenService } from '../../core/services/token.service';
import { OwnerDashboardSummary, ProductPerformanceDto, productRevenue } from '../../core/models/dashboard.model';
import { AuthUser } from '../../core/models/auth.model';

const range = { startDate: '2026-11-01', endDate: '2026-11-21', period: 'month' };

const summary: OwnerDashboardSummary = {
  currency: 'PKR',
  dateRange: range,
  previousDateRange: range,
  overview: {
    totalProducts: 20,
    totalCategories: 3,
    totalCustomers: 856,
    newCustomers: 12,
    activeCustomers: 40,
    totalOrders: 124,
    totalRevenue: 242979,
    previousRevenue: 200000,
    revenueChangePercent: 12.5,
    previousOrders: 100,
    ordersChangePercent: 8,
    totalInventoryValue: 640000,
    totalActiveUsers: 2,
    lowStockProducts: 5,
    outOfStockProducts: 1,
    currency: 'PKR',
    dateRange: range,
    previousDateRange: range,
  },
  sales: {
    todaySales: 0,
    weeklySales: 0,
    monthlySales: 242979,
    yearlySales: 242979,
    averageOrderValue: 1959,
    completedOrders: 100,
    cancelledOrders: 2,
    revenueTrends: [
      { date: '2026-11-01', revenue: 1000, orderCount: 2 },
      { date: '2026-11-14', revenue: 4000, orderCount: 5 },
    ],
    dateRange: range,
  },
  customers: null,
  products: {
    bestSellingProducts: [],
    worstSellingProducts: [],
    mostOrderedProducts: [],
    highestRevenueProducts: [
      {
        productId: 'p1',
        productName: 'Wireless Mouse',
        sku: 'WM',
        revenue: 880,
        quantitySold: 4,
        currentStock: 5,
      } as ProductPerformanceDto,
    ],
    productRankings: [],
    topLimit: 10,
    dateRange: range,
  },
  inventory: {
    totalInventoryValue: 640000,
    totalStockQuantity: 100,
    lowStockCount: 5,
    outOfStockCount: 1,
    stockLevels: [],
    reorderRecommendations: [],
    stockMovementTrends: [],
    dateRange: range,
  },
  orders: {
    ordersByStatus: [],
    ordersPerDay: [],
    ordersPerMonth: [],
    successRate: 90,
    cancellationRate: 2,
    dateRange: range,
  },
  revenueChart: null,
  finance: {
    totalRevenue: 242979,
    costOfGoodsSold: 80000,
    totalExpenses: 20000,
    grossProfit: 162979,
    netProfit: 142979,
    totalPayments: 100000,
    outstandingInvoices: 45000,
    completedOrders: 100,
    totalExpensesCount: 4,
    currency: 'PKR',
    period: 'month',
    startDate: '2026-11-01',
    endDate: '2026-11-21',
    revenueTrend: [],
    expenseTrend: [],
  },
  insights: [
    {
      code: 'low-stock',
      title: '5 products are running low',
      message: 'Consider reordering to avoid stockouts.',
      severity: 'warning',
      metricLabel: 'Low stock',
      metricValue: '5',
      recommendedAction: 'View products',
      route: '/inventory',
      updatedAt: '2026-11-21T08:00:00Z',
    },
  ],
  priorities: [
    {
      id: 'low-stock',
      title: 'Reorder low-stock products',
      description: '5 products are at or below their reorder levels.',
      priority: 'high',
      route: '/inventory',
      actionLabel: 'View inventory',
    },
  ],
  recentActivity: [
    {
      id: 'a1',
      userId: 'user-1',
      userName: 'Ali',
      action: 'Create',
      entityType: 'Invoice',
      entityId: 'o1',
      entityName: 'ORD-1',
      createdAt: '2026-11-21T08:00:00Z',
      description: 'New sale recorded',
    },
    {
      id: 'a2',
      userId: 'user-1',
      userName: 'Ali',
      action: 'Create',
      entityType: 'Invoice',
      entityId: 'o1',
      entityName: 'ORD-1',
      createdAt: '2026-11-21T08:05:00Z',
      description: 'New sale recorded',
    },
  ],
};

const owner: AuthUser = {
  userId: 'user-1',
  email: 'ali.ahsan@example.com',
  tenantId: 'tenant-1',
  roles: ['Owner'],
  permissions: [],
  expiresAt: '2099-01-01T00:00:00Z',
  firstName: 'Ali',
  fullName: 'Ali Ahsan',
};

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    const dashboardApi = TestBed.inject(DashboardService);
    spyOn(dashboardApi, 'getSummary').and.returnValue(of(summary));
    const orders = TestBed.inject(OrderService);
    spyOn(orders, 'getAll').and.returnValue(
      of({
        items: [],
        page: 1,
        pageSize: 5,
        totalCount: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      }),
    );
    TestBed.inject(TokenService).setSession('test-token', owner);
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('greets the owner by first name and shows command-center figures', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toMatch(/Good (morning|afternoon|evening), Ali\./);
    expect(text).toContain("Here's what is happening in your business today.");
    expect(text).toContain('Total Revenue');
    expect(text).toContain('Net Profit');
    expect(text).toContain('Total Orders');
    expect(text).toContain('Total Customers');
    expect(text).toContain('Outstanding');
    expect(text).toContain('Inventory Value');
    expect(text).toContain('+12.5%');
    expect(text).toContain('this period');
    expect(text).toContain('5 products are running low');
    expect(text).toContain('Reorder low-stock products');
    expect(text).toContain('Wireless Mouse');
    expect(text).toContain('Cost of goods sold');
    expect(text).toContain('Gross profit');
    expect(fixture.nativeElement.querySelectorAll('.kpi__spark').length).toBeGreaterThanOrEqual(4);
    expect(text.match(/New sale recorded/g)?.length).toBe(1);
    expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  it('reads product revenue from the revenue alias when totalRevenue is absent', () => {
    const product = summary.products!.highestRevenueProducts[0];
    expect(productRevenue(product)).toBe(880);
    expect(fixture.componentInstance.productRevenue(product)).toBe(880);
  });

  it('keeps a completed priority checked after reload', () => {
    const box = fixture.nativeElement.querySelector('.priorities input') as HTMLInputElement;
    expect(box.checked).toBeFalse();
    box.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('.priorities input') as HTMLInputElement).checked).toBeTrue();

    fixture.destroy();
    const next = TestBed.createComponent(DashboardComponent);
    next.detectChanges();
    expect((next.nativeElement.querySelector('.priorities input') as HTMLInputElement).checked).toBeTrue();
    next.destroy();
  });
});
