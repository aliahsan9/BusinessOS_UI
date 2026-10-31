import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingService } from '../../../core/services/billing.service';
import {
  BILLING_COUNTRIES,
  CurrentPlanDto,
  SubscriptionPlanDto,
  formatIsoCurrency,
} from '../../../core/models/billing.model';
import { PermissionCodes } from '../../../core/constants/permission.constants';
import { TokenService } from '../../../core/services/token.service';
import { ROUTES } from '../../../core/constants/route.constants';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
@Component({
  selector: 'app-pricing-page',
  standalone: true,
  imports: [RouterLink, AppPageHeaderComponent, AppSkeletonComponent, AppAlertComponent],
  templateUrl: './pricing-page.component.html',
  styleUrl: './pricing-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingPageComponent implements OnInit {
  readonly ROUTES = ROUTES;
  readonly countries = BILLING_COUNTRIES;
  readonly money = formatIsoCurrency;

  private readonly billingService = inject(BillingService);
  private readonly tokenService = inject(TokenService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly plans = signal<SubscriptionPlanDto[]>([]);
  readonly currentPlan = signal<CurrentPlanDto | null>(null);
  readonly annual = signal(false);
  readonly actionLoading = signal<string | null>(null);
  readonly country = signal(localStorage.getItem('bos.billingCountry') ?? 'US');
  readonly preview = signal<string | null>(null);
  readonly canManage = this.tokenService.hasPermission(PermissionCodes.subscription.manage);

  ngOnInit(): void {
    this.loadPlans();
    if (this.tokenService.isAuthenticated()) {
      this.billingService.getCurrentPlan().subscribe({
        next: (plan) => this.currentPlan.set(plan),
        error: () => undefined,
      });
    }
  }

  isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }

  onCountry(value: string): void {
    this.country.set(value);
    localStorage.setItem('bos.billingCountry', value);
    this.loadPlans();
  }

  selectedCurrency(): string {
    return this.countries.find((item) => item.country === this.country())?.currency ?? 'USD';
  }

  price(plan: SubscriptionPlanDto): number {
    return this.annual() ? plan.annualPrice : plan.monthlyPrice;
  }

  isCurrentPlan(plan: SubscriptionPlanDto): boolean {
    const current = this.currentPlan();
    if (!current) return false;
    const interval = this.annual() ? 'Annual' : 'Monthly';
    return current.planSlug === plan.slug && current.billingInterval === interval;
  }

  actionLabel(plan: SubscriptionPlanDto): string {
    if (this.isCurrentPlan(plan)) return 'Current plan';
    if (plan.slug === 'free') return 'Move to Free';
    if (plan.isCustomPricing) return 'Subscribe at starting price';
    const current = this.currentPlan();
    if (!current) return plan.monthlyPrice === 0 ? 'Get started' : 'Start 14-day trial';
    return plan.sortOrder > (this.plans().find((item) => item.slug === current.planSlug)?.sortOrder ?? 0)
      ? 'Upgrade'
      : 'Downgrade';
  }

  selectPlan(plan: SubscriptionPlanDto): void {
    if (!this.canManage || this.isCurrentPlan(plan)) return;
    this.error.set(null);
    this.notice.set(null);
    this.preview.set(null);
    this.actionLoading.set(plan.id);
    const interval = this.annual() ? 'yearly' : 'monthly';
    const country = this.country();
    const currency = this.selectedCurrency();
    const startTrial = plan.monthlyPrice > 0 && (this.currentPlan()?.planSlug === 'free' || !this.currentPlan());

    this.billingService.changePlan({
      planId: plan.id,
      billingInterval: interval,
      provider: 'stripe',
      country,
      currency,
      confirm: false,
      startTrial,
    }).subscribe({
      next: (preview) => {
        const due = this.money(preview.preview.amountDue, preview.preview.currency);
        const note = preview.preview.priceNote ? ` ${preview.preview.priceNote}` : '';
        this.preview.set(`${preview.preview.prorationNote} Amount due now: ${due}.${note}`);
        if (!confirm(`${preview.preview.planName} (${preview.preview.billingInterval})\nAmount due: ${due}\n\n${preview.preview.prorationNote}`)) {
          this.actionLoading.set(null);
          return;
        }
        this.billingService.changePlan({
          planId: plan.id,
          billingInterval: interval,
          provider: 'stripe',
          country,
          currency,
          confirm: true,
          startTrial,
          successUrl: window.location.origin + ROUTES.billing.base,
          cancelUrl: window.location.origin + ROUTES.pricing.base,
        }).subscribe({
          next: (result) => this.finishChange(result.checkout?.checkoutUrl, result.checkout, result.subscription, result.applied),
          error: () => {
            this.error.set('The plan change was not applied.');
            this.actionLoading.set(null);
          },
        });
      },
      error: () => {
        this.error.set('The server could not price this change.');
        this.actionLoading.set(null);
      },
    });
  }

  private finishChange(
    checkoutUrl: string | undefined,
    checkout: { requiresServerConfirmation: boolean; sessionId: string; amount: number; currency: string } | undefined,
    subscription: CurrentPlanDto | undefined,
    applied: boolean,
  ): void {
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
      return;
    }
    if (checkout?.requiresServerConfirmation) {
      const amount = this.money(checkout.amount, checkout.currency);
      if (!confirm(`Stripe is not configured. Confirm a development sandbox charge of ${amount}? This does not create a live payment.`)) {
        this.actionLoading.set(null);
        return;
      }
      this.billingService.confirmCheckout(checkout.sessionId).subscribe({
        next: (plan) => {
          this.currentPlan.set(plan);
          this.notice.set('Sandbox checkout confirmed. The subscription is active.');
          this.actionLoading.set(null);
        },
        error: () => {
          this.error.set('Sandbox checkout was not confirmed.');
          this.actionLoading.set(null);
        },
      });
      return;
    }
    if (applied && subscription) {
      this.currentPlan.set(subscription);
      this.notice.set('Subscription updated.');
    }
    this.actionLoading.set(null);
  }

  private loadPlans(): void {
    this.loading.set(true);
    const country = this.countries.find((item) => item.country === this.country());
    this.billingService.getPlans(country?.currency, country?.country).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load pricing plans.');
        this.loading.set(false);
      },
    });
  }
}
