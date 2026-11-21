import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BillingService } from '../../../core/services/billing.service';
import {
  BILLING_COUNTRIES,
  SubscriptionPlanDto,
  formatIsoCurrency,
} from '../../../core/models/billing.model';
import { NavbarComponent } from '../../navbar/navbar.component';
import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-public-pricing',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './public-pricing.component.html',
  styleUrl: './public-pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPricingComponent implements OnInit {
  private readonly billing = inject(BillingService);

  readonly countries = BILLING_COUNTRIES;
  readonly money = formatIsoCurrency;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly plans = signal<SubscriptionPlanDto[]>([]);
  readonly annual = signal(false);
  readonly country = signal('US');
  readonly maxSavings = computed(() =>
    this.plans().reduce((highest, plan) => Math.max(highest, plan.annualSavingsPercent || 0), 0),
  );

  ngOnInit(): void {
    this.load();
  }

  onCountry(value: string): void {
    this.country.set(value);
    this.load();
  }

  price(plan: SubscriptionPlanDto): number {
    return this.annual() ? plan.annualPrice : plan.monthlyPrice;
  }

  currency(): string {
    return this.countries.find((item) => item.country === this.country())?.currency ?? 'USD';
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.billing.getPlans(undefined, this.country()).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Pricing is temporarily unavailable. You can still start a free trial from registration.');
        this.loading.set(false);
      },
    });
  }
}
