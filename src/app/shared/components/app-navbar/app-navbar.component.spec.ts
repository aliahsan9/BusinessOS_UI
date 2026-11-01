import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppNavbarComponent } from './app-navbar.component';

describe('AppNavbarComponent', () => {
  let fixture: ComponentFixture<AppNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppNavbarComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(AppNavbarComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('closes the profile menu when the user clicks elsewhere on the page', () => {
    fixture.componentInstance.toggleProfile();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.app-navbar__dropdown-menu')).toBeTruthy();

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-navbar__dropdown-menu')).toBeFalsy();
  });

  it('keeps the profile menu open when the click is inside it', () => {
    fixture.componentInstance.toggleProfile();
    fixture.detectChanges();
    const profile = fixture.nativeElement.querySelector('.app-navbar__profile') as HTMLElement;

    profile.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-navbar__dropdown-menu')).toBeTruthy();
  });
});
