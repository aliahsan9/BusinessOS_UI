import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppInputComponent } from '../../../shared/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { getFieldError, passwordMatchValidator, strongPasswordValidator } from '../../../shared/validators/form.validators';
import { ApiError } from '../../../core/models/api-error.model';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppInputComponent, AppButtonComponent, AppAlertComponent],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly meta = inject(Meta);
  private previousReferrer: string | null = null;

  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  readonly tokenMissing = !this.token;

  readonly form = this.fb.nonNullable.group(
    {
      email: [{ value: this.email, disabled: !!this.email }, [Validators.required, Validators.email]],
      newPassword: ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') },
  );

  getFieldError = getFieldError;

  ngOnInit(): void {
    const existing = this.meta.getTag('name="referrer"');
    this.previousReferrer = existing?.content ?? null;
    this.meta.updateTag({ name: 'referrer', content: 'no-referrer' });

    if (this.token || this.email) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {},
        replaceUrl: true,
      });
    }
  }

  ngOnDestroy(): void {
    if (this.previousReferrer) {
      this.meta.updateTag({ name: 'referrer', content: this.previousReferrer });
      return;
    }

    this.meta.removeTag('name="referrer"');
  }

  onSubmit(): void {
    if (this.loading() || this.tokenMissing) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, newPassword, confirmPassword } = this.form.getRawValue();

    this.authService.resetPassword({ email, token: this.token, newPassword, confirmPassword }).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
        this.notificationService.success('Password reset. Sign in with your new password.');
      },
      error: (error: ApiError) => {
        this.loading.set(false);
        this.errorMessage.set(error.detail ?? 'Unable to reset password. The link may have expired.');
      },
    });
  }
}
