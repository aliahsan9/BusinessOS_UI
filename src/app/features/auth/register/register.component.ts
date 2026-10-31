import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OnboardingService } from '../../../core/services/onboarding.service';
import { GoogleRegistrationPending } from '../../../core/models/auth.model';
import { navigateAfterSignIn } from '../auth-navigation';
import { GoogleSignInButtonComponent } from '../google-sign-in-button/google-sign-in-button.component';
import { GoogleRegistrationComponent } from '../google-registration/google-registration.component';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { getFieldError, passwordMatchValidator, strongPasswordValidator } from '../../../shared/validators/form.validators';
import { ApiError } from '../../../core/models/api-error.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppAlertComponent,
    GoogleSignInButtonComponent,
    GoogleRegistrationComponent,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly onboardingService = inject(OnboardingService);
  private readonly router = inject(Router);

  readonly errorMessage = signal<string | null>(null);
  readonly googlePending = signal<GoogleRegistrationPending | null>(null);
  readonly googleBusy = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      businessName: ['', [Validators.required, Validators.maxLength(200)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      password: ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator() },
  );

  readonly loading = this.authService.loading;
  getFieldError = getFieldError;

  onSubmit(): void {
    if (this.loading() || this.googleBusy()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    const { firstName, lastName, businessName, email, password } = this.form.getRawValue();

    this.authService.register({ firstName, lastName, businessName, email, password }).subscribe({
      next: () => {
        this.notificationService.success('Account created successfully!');
        void this.router.navigate(['/dashboard']);
      },
      error: (error: ApiError) => {
        const message = error.detail ?? error.title ?? 'Registration failed';
        this.errorMessage.set(message);
        this.notificationService.error('Registration failed', message);
      },
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
            firstName: response.firstName || this.form.controls.firstName.value,
            lastName: response.lastName || this.form.controls.lastName.value,
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
    this.notificationService.success('Account created successfully!');
    navigateAfterSignIn(this.router, this.onboardingService);
  }
}
