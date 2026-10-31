import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from '../../../core/interceptors/error.interceptor';
import { ResetPasswordComponent } from './reset-password.component';

describe('ResetPasswordComponent', () => {
  function setup(token: string | null, email: string | null = 'owner@acme.com'): ComponentFixture<ResetPasswordComponent> {
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ token, email }) } },
        },
      ],
    });
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => TestBed.resetTestingModule());

  it('shows a recovery path when the token is missing', () => {
    const fixture = setup(null, null);
    expect(fixture.nativeElement.textContent).toContain('This reset link is incomplete');
    expect(fixture.nativeElement.querySelector('a[href="/auth/forgot-password"]')).toBeTruthy();
  });

  it('rejects a password mismatch and blocks duplicate submits', () => {
    const fixture = setup('reset-token');
    const http = TestBed.inject(HttpTestingController);
    fixture.componentInstance.form.controls.newPassword.setValue('NewPassword1');
    fixture.componentInstance.form.controls.confirmPassword.setValue('OtherPassword1');
    fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Passwords do not match');
    http.expectNone('/api/v1/auth/reset-password');

    fixture.componentInstance.form.controls.confirmPassword.setValue('NewPassword1');
    fixture.componentInstance.onSubmit();
    fixture.componentInstance.onSubmit();
    const request = http.expectOne('/api/v1/auth/reset-password');
    expect(request.request.body.token).toBe('reset-token');
    expect(request.request.body.newPassword).toBe('NewPassword1');
    request.flush({ message: 'Your password has been reset. Sign in with your new password.' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Password updated');
    expect(fixture.nativeElement.querySelector('a[href="/auth/login"]')).toBeTruthy();
    expect(TestBed.inject(Router).url).not.toContain('token=');
    http.verify();
  });

  it('shows the API failure without treating frontend checks as enough', () => {
    const fixture = setup('reset-token');
    const http = TestBed.inject(HttpTestingController);
    fixture.componentInstance.form.controls.newPassword.setValue('NewPassword1');
    fixture.componentInstance.form.controls.confirmPassword.setValue('NewPassword1');
    fixture.componentInstance.onSubmit();
    http.expectOne('/api/v1/auth/reset-password').flush(
      { title: 'Bad Request', detail: 'Unable to reset password. The link may be invalid or expired.' },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('invalid or expired');
    expect(fixture.nativeElement.querySelector('a[href="/auth/forgot-password"]')).toBeTruthy();
    http.verify();
  });
});
