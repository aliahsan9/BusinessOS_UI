import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileService } from '../../../core/services/profile.service';
import { NotificationService } from '../../../core/services/notification.service';
import { TokenService } from '../../../core/services/token.service';
import { AccountProfileDto, ExternalLoginsDto } from '../../../core/models/profile.model';
import { ROUTES } from '../../../core/constants/route.constants';
import { ButtonVariant } from '../../../core/enums';
import { ApiError } from '../../../core/models/api-error.model';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppCardComponent } from '../../../shared/components/app-card/app-card.component';
import { AppInputComponent } from '../../../shared/components/app-input/app-input.component';
import { AppButtonComponent } from '../../../shared/components/app-button/app-button.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { AppBadgeComponent } from '../../../shared/components/app-badge/app-badge.component';
import { GoogleSignInButtonComponent } from '../../auth/google-sign-in-button/google-sign-in-button.component';
import {
  getFieldError,
  passwordMatchValidator,
  strongPasswordValidator,
} from '../../../shared/validators/form.validators';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    AppBreadcrumbComponent,
    AppPageHeaderComponent,
    AppCardComponent,
    AppInputComponent,
    AppButtonComponent,
    AppSkeletonComponent,
    AppAlertComponent,
    AppBadgeComponent,
    GoogleSignInButtonComponent,
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  readonly ButtonVariant = ButtonVariant;
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(ProfileService);
  private readonly notification = inject(NotificationService);
  private readonly tokenService = inject(TokenService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly changingPassword = signal(false);
  readonly settingPassword = signal(false);
  readonly linkingGoogle = signal(false);
  readonly error = signal<string | null>(null);
  readonly profile = signal<AccountProfileDto | null>(null);
  readonly externalLogins = signal<ExternalLoginsDto | null>(null);
  readonly loginMessage = signal<string | null>(null);
  readonly avatarBroken = signal(false);
  readonly avatarUrlValue = signal('');
  readonly breadcrumbs = [
    { label: 'Dashboard', route: ROUTES.dashboard },
    { label: 'Profile' },
  ];

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phoneNumber: ['', [Validators.maxLength(30)]],
    avatarUrl: ['', [Validators.maxLength(500)]],
  });

  readonly passwordForm = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') },
  );

  readonly setPasswordForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, strongPasswordValidator()]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') },
  );

  readonly displayName = computed(() => {
    const p = this.profile();
    if (!p) return 'Your profile';
    return p.fullName || `${p.firstName} ${p.lastName}`.trim() || p.email;
  });

  readonly initials = computed(() => {
    const p = this.profile();
    if (!p) return 'U';
    const first = p.firstName?.charAt(0) ?? '';
    const last = p.lastName?.charAt(0) ?? '';
    const value = `${first}${last}`.trim();
    return value ? value.toUpperCase() : (p.email.charAt(0).toUpperCase() || 'U');
  });

  readonly avatarPreview = computed(() => {
    const url = this.avatarUrlValue().trim();
    if (!url || this.avatarBroken()) return null;
    return url;
  });

  ngOnInit(): void {
    this.profileForm.controls.avatarUrl.valueChanges.subscribe((value) => {
      this.avatarBroken.set(false);
      this.avatarUrlValue.set(value ?? '');
    });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.loading.set(false);
        this.loadLogins();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail ?? 'Failed to load your profile.');
        this.loading.set(false);
      },
    });
  }

  fieldError(form: 'profile' | 'password' | 'setPassword', field: string): string | null {
    const labels: Record<string, string> = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phoneNumber: 'Phone',
      avatarUrl: 'Avatar URL',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm password',
    };
    const control =
      form === 'profile'
        ? this.profileForm.get(field)
        : form === 'setPassword'
          ? this.setPasswordForm.get(field)
          : this.passwordForm.get(field);
    return getFieldError(control, labels[field] ?? field);
  }

  onAvatarError(): void {
    this.avatarBroken.set(true);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const value = this.profileForm.getRawValue();
    this.profileService
      .updateMyProfile({
        firstName: value.firstName.trim(),
        lastName: value.lastName.trim(),
        email: value.email.trim(),
        phoneNumber: value.phoneNumber.trim() || null,
        avatarUrl: value.avatarUrl.trim() || null,
      })
      .subscribe({
        next: (profile) => {
          this.applyProfile(profile);
          this.notification.success('Profile updated.');
          this.saving.set(false);
        },
        error: (err: ApiError) => {
          this.notification.error(err.detail ?? 'Failed to update profile.');
          this.saving.set(false);
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.changingPassword.set(true);
    const value = this.passwordForm.getRawValue();
    this.profileService
      .changePassword({
        currentPassword: value.currentPassword,
        newPassword: value.newPassword,
      })
      .subscribe({
        next: () => {
          this.passwordForm.reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          this.notification.success('Password changed successfully.');
          this.changingPassword.set(false);
        },
        error: (err: ApiError) => {
          this.notification.error(err.detail ?? 'Failed to change password.');
          this.changingPassword.set(false);
        },
      });
  }

  setPassword(): void {
    if (this.settingPassword()) {
      return;
    }

    if (this.setPasswordForm.invalid) {
      this.setPasswordForm.markAllAsTouched();
      return;
    }

    this.settingPassword.set(true);
    this.profileService.setPassword({ newPassword: this.setPasswordForm.controls.newPassword.value }).subscribe({
      next: () => {
        this.settingPassword.set(false);
        this.setPasswordForm.reset();
        this.externalLogins.update((current) => ({
          hasPassword: true,
          googleLinked: current?.googleLinked ?? false,
        }));
        this.notification.success('Password saved. Sign in again if BusinessOS asks you to.');
      },
      error: (err: ApiError) => {
        this.settingPassword.set(false);
        this.notification.error(err.detail ?? 'A password could not be added.');
      },
    });
  }

  onGoogleCredential(idToken: string): void {
    if (this.linkingGoogle()) {
      return;
    }

    this.linkingGoogle.set(true);
    this.loginMessage.set(null);
    this.profileService.linkGoogle(idToken).subscribe({
      next: (status) => {
        this.externalLogins.set(status);
        this.linkingGoogle.set(false);
        this.notification.success('Google connected.');
      },
      error: (err: ApiError) => {
        this.linkingGoogle.set(false);
        this.loginMessage.set(err.detail ?? 'Google could not be connected.');
      },
    });
  }

  unlinkGoogle(): void {
    if (this.linkingGoogle() || !this.externalLogins()?.hasPassword) {
      return;
    }

    this.linkingGoogle.set(true);
    this.loginMessage.set(null);
    this.profileService.unlinkGoogle().subscribe({
      next: (status) => {
        this.externalLogins.set(status);
        this.linkingGoogle.set(false);
        this.notification.success('Google disconnected.');
      },
      error: (err: ApiError) => {
        this.linkingGoogle.set(false);
        this.loginMessage.set(err.detail ?? 'Google could not be disconnected.');
      },
    });
  }

  private loadLogins(): void {
    this.profileService.getExternalLogins().subscribe({
      next: (status) => this.externalLogins.set(status),
      error: () => this.loginMessage.set('Connected accounts could not be loaded.'),
    });
  }

  private applyProfile(profile: AccountProfileDto): void {
    this.profile.set(profile);
    this.avatarBroken.set(false);
    this.profileForm.patchValue({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      avatarUrl: profile.avatarUrl ?? '',
    });
    this.avatarUrlValue.set(profile.avatarUrl ?? '');
    this.tokenService.patchUser({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
    });
  }
}
