import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { NotificationService } from '../../../core/services/notification.service';
import { GoogleRegistrationPending } from '../../../core/models/auth.model';
import { navigateAfterSignIn } from '../auth-navigation';
import { GoogleSignInButtonComponent } from '../google-sign-in-button/google-sign-in-button.component';
import { GoogleRegistrationComponent } from '../google-registration/google-registration.component';

import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';

import { ApiError } from '../../../core/models/api-error.model';
import { getFieldError } from '../../../shared/validators/form.validators';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppAlertComponent,
    GoogleSignInButtonComponent,
    GoogleRegistrationComponent,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly onboardingService = inject(OnboardingService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly googlePending = signal<GoogleRegistrationPending | null>(null);
  readonly googleBusy = signal(false);

  readonly devCredentials = environment.devCredentials;

  readonly form = this.fb.nonNullable.group({
    email: [
      this.authService.getRememberMeEmail() ?? '',
      [Validators.required, Validators.email]
    ],
    password: [
      '',
      [Validators.required, Validators.minLength(8)]
    ],
    rememberMe: [true]
  });

  readonly loading = this.authService.loading;
  getFieldError = getFieldError;

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  fillDemoCredentials(): void {
    if (!this.devCredentials) return;

    this.form.patchValue({
      email: this.devCredentials.email,
      password: this.devCredentials.password
    });
  }

  onSubmit(): void {

    if (this.loading() || this.googleBusy()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);

    const { email, password, rememberMe } =
      this.form.getRawValue();

    this.authService.login(
      { email, password },
      rememberMe
    ).subscribe({
      next: () => navigateAfterSignIn(this.router, this.onboardingService),
      error: (error: ApiError) => {

        const message =
          error.status === 401
            ? 'Invalid email or password.'
            : error.detail ??
              error.title ??
              'Login failed.';

        this.errorMessage.set(message);

        this.notificationService.error(
          'Login Failed',
          message
        );
      }
    });
  }

  onGoogleCredential(idToken: string): void {
    if (this.googleBusy() || this.loading()) {
      return;
    }

    this.errorMessage.set(null);
    this.googlePending.set(null);
    this.googleBusy.set(true);
    this.authService.signInWithGoogle(idToken).subscribe({
      next: (response) => {
        this.googleBusy.set(false);
        if (response.status === 'authenticated') {
          navigateAfterSignIn(this.router, this.onboardingService);
          return;
        }

        if (response.status === 'registration_required' && response.continuationToken) {
          this.googlePending.set({
            continuationToken: response.continuationToken,
            email: response.email ?? '',
            firstName: response.firstName ?? '',
            lastName: response.lastName ?? '',
          });
        }
      },
      error: (error: ApiError) => {
        this.googleBusy.set(false);
        const message = error.detail ?? error.title ?? 'Google sign-in could not be completed.';
        this.errorMessage.set(message);
        this.notificationService.error('Google sign-in failed', message);
      },
    });
  }

  onGoogleWorkspaceCreated(): void {
    navigateAfterSignIn(this.router, this.onboardingService);
  }
}