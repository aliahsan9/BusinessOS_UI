import { Routes } from '@angular/router';

/**
 * Legacy /subscription path redirected to the real billing dashboard.
 * The old stub showed fake plans and a no-op Upgrade button.
 */
export const SUBSCRIPTION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/billing',
    pathMatch: 'full',
  },
];
