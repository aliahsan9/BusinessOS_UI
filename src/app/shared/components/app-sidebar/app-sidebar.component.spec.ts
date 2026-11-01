import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BillingService } from '../../../core/services/billing.service';
import { CurrentPlanDto } from '../../../core/models/billing.model';
import { AppSidebarComponent } from './app-sidebar.component';

describe('AppSidebarComponent', () => {
  let fixture: ComponentFixture<AppSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppSidebarComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(AppSidebarComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the Pro card on the free trial and hides it for a premium plan', () => {
    const billing = TestBed.inject(BillingService);

    billing.rememberPlan(plan({ planSlug: 'free', status: 'Free', isTrialActive: true, currentPrice: 0 }));
    fixture.detectChanges();
    expect(fixture.componentInstance.showProUpsell()).toBeTrue();

    billing.rememberPlan(plan({
      planSlug: 'starter',
      planName: 'Starter',
      status: 'Trial',
      isTrialActive: true,
      currentPrice: 19,
    }));
    fixture.detectChanges();
    expect(fixture.componentInstance.showProUpsell()).toBeFalse();

    billing.rememberPlan(plan({
      planSlug: 'professional',
      planName: 'Professional',
      status: 'Active',
      isTrialActive: false,
      currentPrice: 49,
    }));
    fixture.detectChanges();
    expect(fixture.componentInstance.showProUpsell()).toBeFalse();
  });
});

function plan(partial: Partial<CurrentPlanDto>): CurrentPlanDto {
  return {
    planId: '1',
    planName: 'Free',
    planSlug: 'free',
    status: 'Free',
    billingInterval: 'Monthly',
    paymentProvider: 'None',
    startDate: '2026-01-01',
    cancelAtPeriodEnd: false,
    isTrialActive: false,
    trialDaysRemaining: 0,
    currentPrice: 0,
    currency: 'USD',
    settlementCurrency: 'USD',
    autoRenew: false,
    currencyScale: 2,
    featureFlags: {
      hasAiAssistant: true,
      hasAdvancedAnalytics: false,
      hasPdfReports: false,
      hasAdvancedReports: false,
      hasPrioritySupport: false,
    },
    ...partial,
  };
}
