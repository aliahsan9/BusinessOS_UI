import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthService } from '../services/auth.service';
import { HTTP_HEADERS } from '../constants/api.constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authService = inject(AuthService);
  const token = tokenService.getToken();
  const tenantId = tokenService.tenantId();
  const isAuthCall = req.url.includes('/auth/');
  const isStaticAsset = req.url.includes('assets/blog/');

  let outbound = isStaticAsset ? req : req.clone({ withCredentials: true });
  if (token && !isAuthCall && !isStaticAsset) {
    const headers: Record<string, string> = {
      [HTTP_HEADERS.authorization]: `Bearer ${token}`,
    };
    if (tenantId) {
      headers[HTTP_HEADERS.tenantId] = tenantId;
    }
    outbound = outbound.clone({ setHeaders: headers });
  }

  return next(outbound).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthCall || isStaticAsset || outbound.headers.has('X-Retry')) {
        return throwError(() => error);
      }

      return from(authService.tryRestoreSession()).pipe(
        switchMap((restored) => {
          const refreshed = tokenService.getToken();
          if (!restored || !refreshed) {
            return throwError(() => error);
          }

          const headers: Record<string, string> = {
            [HTTP_HEADERS.authorization]: `Bearer ${refreshed}`,
            'X-Retry': '1',
          };
          const refreshedTenant = tokenService.tenantId();
          if (refreshedTenant) {
            headers[HTTP_HEADERS.tenantId] = refreshedTenant;
          }
          return next(outbound.clone({ setHeaders: headers }));
        }),
      );
    }),
  );
};
