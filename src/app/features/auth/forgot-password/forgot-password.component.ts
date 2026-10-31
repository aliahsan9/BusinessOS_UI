import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppInputComponent } from '../../../shared/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { getFieldError } from '../../../shared/validators/form.validators';
import { ApiError } from '../../../core/models/api-error.model';
import { PASSWORD_RESET_PUBLIC_MESSAGE } from '../../../core/models/auth.model';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppInputComponent, AppButtonComponent, AppAlertComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly submitted = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal(PASSWORD_RESET_PUBLIC_MESSAGE);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  getFieldError = getFieldError;

  onSubmit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.forgotPassword({ email: this.form.controls.email.value.trim() }).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.successMessage.set(response.message || PASSWORD_RESET_PUBLIC_MESSAGE);
        this.submitted.set(true);
        this.notificationService.info(PASSWORD_RESET_PUBLIC_MESSAGE);
      },
      error: (error: ApiError) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.status === 400
            ? error.detail ?? 'Enter a valid email address.'
            : "We couldn't send the email right now. Please try again.",
        );
      },
    });
  }

  sendAnother(): void {
    this.submitted.set(false);
    this.errorMessage.set(null);
  }
}
