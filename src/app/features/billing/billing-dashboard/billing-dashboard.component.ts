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
import { ButtonVariant } from '../../../core/enums';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    AppPageHeaderComponent,
    AppButtonComponent,
    AppSkeletonComponent,
    AppAlertComponent,
  ],
  templateUrl: './billing-dashboard.component.html',
  styleUrl: './billing-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingDashboardComponent implements OnInit {
  readonly ROUTES = ROUTES;
  readonly ButtonVariant = ButtonVariant;
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
        this.error.set('Billing details could not be loaded. Refresh the page to try again.');
        this.loading.set(false);
        this.actionLoading.set(false);
      },
    });
  }

  usageRows(data: BillingDashboardDto) {
    const usage = data.usage;
    return [
      { label: 'Users', icon: 'bi bi-people', current: usage.userCount, max: usage.maxUsers, custom: usage.usersAreCustom },
      { label: 'Customers', icon: 'bi bi-person-badge', current: usage.customerCount, max: usage.maxCustomers, custom: false },
      { label: 'Products', icon: 'bi bi-box', current: usage.productCount, max: usage.maxProducts, custom: false },
      { label: 'Projects', icon: 'bi bi-folder', current: usage.projectCount, max: usage.maxProjects, custom: false },
      { label: 'Tasks', icon: 'bi bi-check2-square', current: usage.taskCount, max: usage.maxTasks, custom: false },
      { label: 'AI requests', icon: 'bi bi-stars', current: usage.aiRequestsUsed, max: usage.maxAiRequests, custom: usage.aiRequestsAreCustom },
      { label: 'Storage (MB)', icon: 'bi bi-hdd', current: usage.storageUsedMb, max: usage.maxStorageMb, custom: false },
    ];
  }

  text(value: string | null | undefined, fallback: string): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : fallback;
  }

  statusClass(status: string): string {
    const value = status.toLowerCase();
    if (value.includes('active') || value.includes('trial')) return 'pill is-good';
    if (value.includes('past') || value.includes('cancel')) return 'pill is-bad';
    if (value.includes('pending')) return 'pill is-warn';
    return 'pill';
  }

  openPortal(): void {
    this.actionLoading.set(true);
    this.billingService.createPortal(window.location.origin + ROUTES.billing.base).subscribe({
      next: (res) => {
        if (res.portalUrl) window.location.href = res.portalUrl;
        this.actionLoading.set(false);
      },
      error: () => {
        this.error.set('Payment methods open after a card is saved. Stripe is not connected for this workspace yet.');
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
