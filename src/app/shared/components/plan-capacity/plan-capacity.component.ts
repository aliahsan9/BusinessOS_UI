import { ChangeDetectionStrategy, Component, OnInit, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntitlementService, QuotaResourceKey } from '../../../core/services/entitlement.service';
import { ROUTES } from '../../../core/constants/route.constants';
import { AppAlertComponent } from '../app-alert/app-alert.component';

@Component({
  selector: 'app-plan-capacity',
  standalone: true,
  imports: [RouterLink, AppAlertComponent],
  template: `
    @if (entitlements.usage(); as usage) {
      <div class="plan-capacity">
        <p class="plan-capacity__summary">{{ entitlements.summary(resource()) }}</p>
        @if (entitlements.message(resource()); as text) {
          <app-alert variant="warning" [message]="text" />
          <a class="plan-capacity__upgrade" [routerLink]="routes.pricing.base">Upgrade Plan</a>
        }
      </div>
    }
  `,
  styles: `
    .plan-capacity { margin-bottom: 1rem; }
    .plan-capacity__summary { margin: 0 0 0.5rem; color: var(--bs-secondary-color, #5c6b7a); }
    .plan-capacity__upgrade { display: inline-block; margin-top: 0.5rem; font-weight: 600; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCapacityComponent implements OnInit {
  readonly resource = input.required<QuotaResourceKey>();
  readonly entitlements = inject(EntitlementService);
  readonly routes = ROUTES;

  ngOnInit(): void {
    this.entitlements.refresh().subscribe({ error: () => undefined });
  }
}
