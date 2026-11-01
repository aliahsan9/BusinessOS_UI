import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingService } from '../../../core/services/billing.service';
import { BillingUsageDto, limitLabel, usagePercent, usageTone } from '../../../core/models/billing.model';
import { ROUTES } from '../../../core/constants/route.constants';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';

@Component({
  selector: 'app-usage-page',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    AppBreadcrumbComponent,
    AppPageHeaderComponent,
    AppSkeletonComponent,
    AppAlertComponent,
  ],
  templateUrl: './usage-page.component.html',
  styleUrl: './usage-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsagePageComponent implements OnInit {
  readonly ROUTES = ROUTES;
  readonly limitLabel = limitLabel;
  readonly usagePercent = usagePercent;
  readonly usageTone = usageTone;

  private readonly billingService = inject(BillingService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly usage = signal<BillingUsageDto | null>(null);
  readonly breadcrumbs = [{ label: 'Billing', route: ROUTES.billing.base }, { label: 'Usage' }];

  rows(u: BillingUsageDto) {
    return [
      { label: 'Users', icon: 'bi bi-people', current: u.userCount, max: u.maxUsers, custom: u.usersAreCustom },
      { label: 'Customers', icon: 'bi bi-person-badge', current: u.customerCount, max: u.maxCustomers, custom: false },
      { label: 'Products', icon: 'bi bi-box', current: u.productCount, max: u.maxProducts, custom: false },
      { label: 'Projects', icon: 'bi bi-folder', current: u.projectCount, max: u.maxProjects, custom: false },
      { label: 'Tasks', icon: 'bi bi-check2-square', current: u.taskCount, max: u.maxTasks, custom: false },
      { label: 'Storage (MB)', icon: 'bi bi-hdd', current: u.storageUsedMb, max: u.maxStorageMb, custom: false },
      { label: 'AI requests', icon: 'bi bi-stars', current: u.aiRequestsUsed, max: u.maxAiRequests, custom: u.aiRequestsAreCustom },
    ];
  }

  ngOnInit(): void {
    this.billingService.getUsage().subscribe({
      next: (data) => {
        this.usage.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load usage.');
        this.loading.set(false);
      },
    });
  }
}
