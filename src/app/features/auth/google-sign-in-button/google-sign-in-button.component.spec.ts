import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoogleSignInButtonComponent } from './google-sign-in-button.component';

describe('GoogleSignInButtonComponent', () => {
  let fixture: ComponentFixture<GoogleSignInButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleSignInButtonComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(GoogleSignInButtonComponent);
    fixture.detectChanges();
  });

  it('renders an accessible Continue with Google control when no client id is configured', () => {
    const button = fixture.nativeElement.querySelector('.google-btn') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.textContent).toContain('Continue with Google');
    expect(button.disabled).toBeTrue();
    expect(button.getAttribute('type')).toBe('button');
    expect(fixture.nativeElement.textContent).toContain('not configured');
  });

  it('blocks interaction while the parent request is in flight', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.google-signin--busy')).toBeTruthy();
    expect(fixture.nativeElement.getAttribute('aria-busy') ?? fixture.nativeElement.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});
