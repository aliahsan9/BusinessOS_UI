import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BillingService } from '../../../core/services/billing.service';
import {
  BillingDashboardDto,
  formatIsoCurrency,
  limitLabel,
  usagePercent,
  usageTone,
} from '../../../core/models/billing.model';
import { PermissionCodes } from '../../../core/constants/permission.constants';
import { TokenService } from '../../../core/services/token.service';
import { ROUTES } from '../../../core/constants/route.constants';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppCardComponent } from '../../../shared/components/app-card/app-card.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    AppBreadcrumbComponent,
    AppPageHeaderComponent,
    AppCardComponent,
    AppSkeletonComponent,
    AppAlertComponent,
  ],
  templateUrl: './billing-dashboard.component.html',
  styleUrl: './billing-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingDashboardComponent implements OnInit {
  readonly ROUTES = ROUTES;
  readonly money = formatIsoCurrency;
  readonly limitLabel = limitLabel;
  readonly usagePercent = usagePercent;
  readonly usageTone = usageTone;

  private readonly billingService = inject(BillingService);
  private readonly tokenService = inject(TokenService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly dashboard = signal<BillingDashboardDto | null>(null);
  readonly actionLoading = signal(false);
  readonly confirmCancel = signal(false);
  readonly canManage = this.tokenService.hasPermission(PermissionCodes.subscription.manage);
  readonly breadcrumbs = [{ label: 'Billing' }];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.billingService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
        this.actionLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load billing dashboard.');
        this.loading.set(false);
        this.actionLoading.set(false);
      },
    });
  }

  usageRows(data: BillingDashboardDto) {
    const usage = data.usage;
    return [
      { label: 'Users', current: usage.userCount, max: usage.maxUsers, custom: usage.usersAreCustom },
      { label: 'Customers', current: usage.customerCount, max: usage.maxCustomers, custom: false },
      { label: 'Products', current: usage.productCount, max: usage.maxProducts, custom: false },
      { label: 'Projects', current: usage.projectCount, max: usage.maxProjects, custom: false },
      { label: 'Tasks', current: usage.taskCount, max: usage.maxTasks, custom: false },
      { label: 'AI requests', current: usage.aiRequestsUsed, max: usage.maxAiRequests, custom: usage.aiRequestsAreCustom },
      { label: 'Storage (MB)', current: usage.storageUsedMb, max: usage.maxStorageMb, custom: false },
    ];
  }

  openPortal(): void {
    this.actionLoading.set(true);
    this.billingService.createPortal(window.location.origin + ROUTES.billing.base).subscribe({
      next: (res) => {
        if (res.portalUrl) window.location.href = res.portalUrl;
        this.actionLoading.set(false);
      },
      error: () => {
        this.error.set('The payment portal is unavailable until Stripe is configured for this workspace.');
        this.actionLoading.set(false);
      },
    });
  }

  cancelSubscription(immediately: boolean): void {
    this.confirmCancel.set(false);
    this.actionLoading.set(true);
    this.billingService.cancelPlan(immediately).subscribe({
      next: () => {
        this.notice.set(immediately
          ? 'The subscription was cancelled.'
          : 'The subscription will cancel at the end of the current period.');
        this.load();
      },
      error: () => {
        this.error.set('Failed to cancel the subscription.');
        this.actionLoading.set(false);
      },
    });
  }

  reactivate(): void {
    this.actionLoading.set(true);
    this.billingService.reactivate().subscribe({
      next: () => {
        this.notice.set('Automatic renewal is on again.');
        this.load();
      },
      error: () => {
        this.error.set('The subscription could not be reactivated.');
        this.actionLoading.set(false);
      },
    });
  }

  download(id: string): void {
    this.billingService.downloadInvoice(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${id}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.error.set('The invoice could not be downloaded.'),
    });
  }
}
