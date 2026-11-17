import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { onboardingWizardGuard } from '../../core/guards/onboarding.guard';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: 'agency',
    loadComponent: () =>
      import('../launch/agency-onboarding.component').then((m) => m.AgencyOnboardingComponent),
    canActivate: [authGuard],
    title: 'Agency setup | BusinessOS',
  },
  {
    path: '',
    loadComponent: () =>
      import('./onboarding-wizard/onboarding-wizard.component').then((m) => m.OnboardingWizardComponent),
    canActivate: [authGuard, onboardingWizardGuard],
    title: 'Welcome | BusinessOS Onboarding',
  },
];
