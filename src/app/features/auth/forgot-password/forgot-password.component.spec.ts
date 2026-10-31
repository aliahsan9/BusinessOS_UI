import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor } from '../../../core/interceptors/error.interceptor';
import { ForgotPasswordComponent } from './forgot-password.component';
import { PASSWORD_RESET_PUBLIC_MESSAGE } from '../../../core/models/auth.model';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('rejects an invalid email before calling the API', () => {
    fixture.componentInstance.form.controls.email.setValue('not-an-email');
    fixture.componentInstance.onSubmit();
    expect(fixture.componentInstance.form.invalid).toBeTrue();
    expect(fixture.componentInstance.submitted()).toBeFalse();
    http.expectNone('/api/v1/auth/forgot-password');
  });

  it('shows the generic success message and ignores a second click while loading', () => {
    fixture.componentInstance.form.controls.email.setValue('owner@acme.com');
    fixture.componentInstance.onSubmit();
    fixture.componentInstance.onSubmit();
    const request = http.expectOne('/api/v1/auth/forgot-password');
    expect(fixture.componentInstance.loading()).toBeTrue();
    request.flush({ message: PASSWORD_RESET_PUBLIC_MESSAGE });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(PASSWORD_RESET_PUBLIC_MESSAGE);
    expect(fixture.nativeElement.textContent).toContain('Continue with Google');
  });

  it('keeps delivery errors generic', () => {
    fixture.componentInstance.form.controls.email.setValue('owner@acme.com');
    fixture.componentInstance.onSubmit();
    http.expectOne('/api/v1/auth/forgot-password').flush(
      { title: 'Server error', detail: 'mailbox missing' },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("We couldn't send the email right now");
    expect(fixture.nativeElement.textContent).not.toContain('mailbox missing');
  });
});
