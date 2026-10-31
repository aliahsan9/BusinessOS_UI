import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, firstValueFrom } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { TokenService } from './token.service';
import { NotificationService } from './notification.service';
import {
  AuthResponse,
  AuthUser,
  CompleteGoogleRegistrationRequest,
  ForgotPasswordRequest,
  GoogleSignInResponse,
  LoginRequest,
  RegisterRequest,
  RememberMeCredentials,
  ResetPasswordRequest,
} from '../models/auth.model';
import { API_ENDPOINTS } from '../constants/api.constants';
import { STORAGE_KEYS } from '../constants/storage.constants';
import { StorageHelper } from '../helpers/storage.helper';
import { ApiError } from '../models/api-error.model';
import { ThemeService } from '../theme/theme.service';
import { TenantSettingsStoreService } from './tenant-settings-store.service';

@Injectable({ providedIn: 'root' })
export class AuthService extends BaseApiService {
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);
  private readonly httpBackend = inject(HttpBackend);
  private refreshInFlight: Promise<boolean> | null = null;
  private readonly notificationService = inject(NotificationService);
  private readonly themeService = inject(ThemeService);
  private readonly tenantSettingsStore = inject(TenantSettingsStoreService);

  private readonly loadingSignal = signal(false);
  readonly loading = this.loadingSignal.asReadonly();
  readonly currentUser = computed(() => this.tokenService.user());
  readonly isAuthenticated = computed(() => this.tokenService.isAuthenticated());

  login(request: LoginRequest, rememberMe = false): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.post<AuthResponse>(API_ENDPOINTS.auth.login, request).pipe(
      tap((response) => this.handleAuthSuccess(response, rememberMe ? request.email : undefined)),
      catchError((error: ApiError) => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.post<AuthResponse>(API_ENDPOINTS.auth.register, request).pipe(
      tap((response) => this.handleAuthSuccess(response)),
      catchError((error: ApiError) => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<{ message: string }> {
    return this.post<{ message: string }>(API_ENDPOINTS.auth.forgotPassword, request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<{ message: string }> {
    return this.post<{ message: string }>(API_ENDPOINTS.auth.resetPassword, {
      email: request.email,
      token: request.token,
      newPassword: request.newPassword,
    });
  }

  signInWithGoogle(idToken: string): Observable<GoogleSignInResponse> {
    this.loadingSignal.set(true);
    return this.post<GoogleSignInResponse>(API_ENDPOINTS.auth.google, { idToken }).pipe(
      tap((response) => {
        if (response.status === 'authenticated' && response.auth) {
          this.handleAuthSuccess(response.auth, undefined, 'Welcome back!');
          return;
        }

        this.loadingSignal.set(false);
      }),
      catchError((error: ApiError) => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  completeGoogleRegistration(request: CompleteGoogleRegistrationRequest): Observable<AuthResponse> {
    this.loadingSignal.set(true);
    return this.post<AuthResponse>(API_ENDPOINTS.auth.googleComplete, request).pipe(
      tap((response) => this.handleAuthSuccess(response, undefined, 'Welcome to BusinessOS!')),
      catchError((error: ApiError) => {
        this.loadingSignal.set(false);
        return throwError(() => error);
      }),
    );
  }

  logout(showNotification = true): void {
    const headers = csrfHeaders();
    const client = new HttpClient(this.httpBackend);
    client
      .post(`${this.baseUrl}${API_ENDPOINTS.auth.logout}`, {}, { withCredentials: true, headers })
      .subscribe({ error: () => undefined });
    this.tokenService.clearSession();
    this.tenantSettingsStore.clear();
    StorageHelper.remove(STORAGE_KEYS.rememberMe);
    if (showNotification) {
      this.notificationService.info('You have been signed out.');
    }
    void this.router.navigate(['/auth/login']);
  }

  getRememberMeEmail(): string | null {
    const credentials = StorageHelper.get<RememberMeCredentials>(STORAGE_KEYS.rememberMe);
    return credentials?.email ?? null;
  }

  refreshSessionIfNeeded(): boolean {
    return this.tokenService.isAuthenticated() && !this.tokenService.isTokenExpiringSoon(30_000);
  }

  tryRestoreSession(): Promise<boolean> {
    if (this.refreshSessionIfNeeded()) {
      return Promise.resolve(true);
    }

    if (!this.refreshInFlight) {
      this.refreshInFlight = this.refreshAccessToken().finally(() => {
        this.refreshInFlight = null;
      });
    }

    return this.refreshInFlight;
  }

  private async refreshAccessToken(): Promise<boolean> {
    const client = new HttpClient(this.httpBackend);
    try {
      const response = await firstValueFrom(
        client.post<AuthResponse>(`${this.baseUrl}${API_ENDPOINTS.auth.refresh}`, {}, {
          withCredentials: true,
          headers: csrfHeaders(),
        }),
      );
      this.handleAuthSuccess(response, undefined, '', true);
      return true;
    } catch {
      this.tokenService.clearSession();
      return false;
    }
  }

  establishSession(response: AuthResponse, options?: { welcomeMessage?: string; rememberEmail?: string }): void {
    this.handleAuthSuccess(response, options?.rememberEmail, options?.welcomeMessage);
  }

  private handleAuthSuccess(
    response: AuthResponse,
    rememberEmail?: string,
    welcomeMessage = 'Welcome back!',
    silent = false,
  ): void {
    const user: AuthUser = {
      userId: response.userId,
      email: response.email,
      tenantId: response.tenantId,
      roles: response.roles,
      permissions: response.permissions,
      expiresAt: response.expiresAt,
    };
    this.tokenService.setSession(response.token, user);
    StorageHelper.setString(STORAGE_KEYS.tenantId, response.tenantId);

    if (!silent) {
      if (rememberEmail) {
        StorageHelper.set<RememberMeCredentials>(STORAGE_KEYS.rememberMe, { email: rememberEmail });
      } else {
        StorageHelper.remove(STORAGE_KEYS.rememberMe);
      }

      if (welcomeMessage) {
        this.notificationService.success(welcomeMessage);
      }
      this.themeService.syncFromBackend();
      this.tenantSettingsStore.load().subscribe();
    }

    this.loadingSignal.set(false);
  }
}

function csrfHeaders(): HttpHeaders {
  const csrf = readCookie('bos_csrf');
  return csrf ? new HttpHeaders({ 'X-CSRF-Token': csrf }) : new HttpHeaders();
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}
