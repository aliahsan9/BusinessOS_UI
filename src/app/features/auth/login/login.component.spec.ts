import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should invalidate empty form', () => {
    fixture.componentInstance.onSubmit();
    expect(fixture.componentInstance.form.invalid).toBeTrue();
  });

  it('shows a Continue with Google button without removing email sign-in', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Continue with Google');
    expect(text).toContain('Sign in');
    expect(text).toContain('or');
    const button = fixture.nativeElement.querySelector('.google-btn') as HTMLButtonElement;
    expect(button.disabled).toBeTrue();
  });
});
