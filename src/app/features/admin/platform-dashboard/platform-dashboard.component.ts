import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  CompanySummaryDto,
  GrowthService,
  MarketingLeadDto,
  PlatformRevenueDto,
  PlatformSupportTicketDto,
  SaaSAnalyticsDto,
} from '../../../core/services/growth.service';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { ROUTES } from '../../../core/constants/route.constants';

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    AppBreadcrumbComponent,
    AppPageHeaderComponent,
    AppAlertComponent,
    AppSkeletonComponent,
  ],
  templateUrl: './platform-dashboard.component.html',
  styleUrl: './platform-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlatformDashboardComponent implements OnInit {
  private readonly growth = inject(GrowthService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly revenue = signal<PlatformRevenueDto | null>(null);
  readonly analytics = signal<SaaSAnalyticsDto | null>(null);
  readonly companies = signal<CompanySummaryDto[]>([]);
  readonly leads = signal<MarketingLeadDto[]>([]);
  readonly tickets = signal<PlatformSupportTicketDto[]>([]);
  readonly health = signal<{ status: string; databaseConnected: boolean; aiProviderConfigured: boolean; checkedAt: string } | null>(null);
  readonly breadcrumbs = [
    { label: 'Admin', route: ROUTES.admin.dashboard },
    { label: 'Platform', route: '/admin/platform' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      revenue: this.growth.getRevenue(),
      analytics: this.growth.getSaaSAnalytics(),
      companies: this.growth.listCompanies(),
      leads: this.growth.listLeads(),
      tickets: this.growth.listPlatformSupport(),
      health: this.growth.getPlatformHealth(),
    }).subscribe({
      next: (result) => {
        this.revenue.set(result.revenue);
        this.analytics.set(result.analytics);
        this.companies.set(result.companies.items ?? []);
        this.leads.set(result.leads);
        this.tickets.set(result.tickets);
        this.health.set(result.health);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Platform admin data requires a super-admin session. System health remains available under System Admin.');
        this.loading.set(false);
      },
    });
  }
}
