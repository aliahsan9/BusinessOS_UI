import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, throwError } from 'rxjs';
import { LoadingService } from '../services/loading.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { fromHttpError } from '../models/api-error.model';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(NotificationService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const apiError = fromHttpError(error);
      if (req.url.includes('assets/blog/')) {
        return throwError(() => apiError);
      }

      const isAuthEndpoint =
        req.url.includes('/auth/login') ||
        req.url.includes('/auth/register') ||
        req.url.includes('/auth/refresh') ||
        req.url.includes('/auth/logout') ||
        req.url.includes('/auth/google') ||
        req.url.includes('/auth/forgot-password') ||
        req.url.includes('/auth/reset-password');
      const isPostLoginSync =
        req.url.includes('/settings') || req.url.includes('/onboarding/status');

      if (apiError.errorCode === 'PLAN_LIMIT_EXCEEDED') {
        notificationService.error(
          'Plan limit reached',
          apiError.detail ?? 'Upgrade your subscription to continue.',
        );
      } else if (error.status === 401 && !isAuthEndpoint && !isPostLoginSync) {
        authService.logout(false);
        notificationService.error('Session expired', 'Please sign in again.');
      } else if (error.status === 403) {
        notificationService.error('Access denied', apiError.detail ?? 'You do not have permission for this action.');
      } else if (error.status === 0) {
        notificationService.error('Network error', 'Unable to reach the server. Check your connection.');
      } else if (error.status >= 500) {
        notificationService.error('Server error', apiError.detail ?? apiError.title);
      }

      return throwError(() => apiError);
    }),
  );
};

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  const skipLoading =
    req.headers.has('X-Skip-Loading') ||
    req.url.includes('/ai/chat') ||
    req.url.includes('/ai/conversations');

  if (!skipLoading) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!skipLoading) {
        loadingService.hide();
      }
    }),
  );
};
