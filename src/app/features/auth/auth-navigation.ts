import { Router } from '@angular/router';
import { OnboardingService } from '../../core/services/onboarding.service';

export function navigateAfterSignIn(router: Router, onboarding: OnboardingService): void {
  onboarding.getStatus().subscribe({
    next: (status) => {
      void router.navigate([status.shouldShowWizard ? '/onboarding' : '/dashboard']);
    },
    error: () => {
      void router.navigate(['/dashboard']);
    },
  });
}
