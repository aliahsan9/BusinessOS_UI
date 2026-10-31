import { ChangeDetectionStrategy, Component, inject, input, OnInit, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleRegistrationPending } from '../../../core/models/auth.model';
import { ApiError } from '../../../core/models/api-error.model';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';

@Component({
  selector: 'app-google-registration',
  standalone: true,
  imports: [ReactiveFormsModule, AppAlertComponent],
  templateUrl: './google-registration.component.html',
  styleUrl: './google-registration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleRegistrationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly pending = input.required<GoogleRegistrationPending>();
  readonly completed = output<void>();

  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    businessName: ['', [Validators.required, Validators.maxLength(200)]],
  });

  ngOnInit(): void {
    const pending = this.pending();
    this.form.patchValue({
      firstName: pending.firstName,
      lastName: pending.lastName,
    });
  }

  onSubmit(): void {
    if (this.submitting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);
    const value = this.form.getRawValue();
    const pending = this.pending();

    this.authService.completeGoogleRegistration({
      continuationToken: pending.continuationToken,
      businessName: value.businessName.trim(),
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.completed.emit();
      },
      error: (error: ApiError) => {
        this.submitting.set(false);
        this.errorMessage.set(error.detail ?? 'Google sign-up could not be completed. Start again with Google.');
      },
    });
  }
}
