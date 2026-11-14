import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppNavbarComponent } from './app-navbar.component';
import { TokenService } from '../../../core/services/token.service';
import { AuthUser } from '../../../core/models/auth.model';

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

  it('suggests matching pages and records while typing', () => {
    grantSearchAccess();
    fixture.detectChanges();

    const input = searchInput();
    input.dispatchEvent(new Event('focus'));
    setInputValue(input, 'invioce');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Invoices');
    expect(fixture.nativeElement.textContent).not.toContain('Search Products');
  });

  it('opens a filtered list for a name that is not a page', () => {
    grantSearchAccess();
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();

    const input = searchInput();
    input.dispatchEvent(new Event('focus'));
    setInputValue(input, 'acme');
    fixture.detectChanges();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/products'],
      { queryParams: { search: 'acme' } },
    );
  });

  it('moves through results with the arrow keys', () => {
    grantSearchAccess();
    fixture.detectChanges();

    const input = searchInput();
    input.dispatchEvent(new Event('focus'));
    setInputValue(input, 'acme');
    fixture.detectChanges();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();

    const active = fixture.nativeElement.querySelector('.app-navbar__search-hit.is-active') as HTMLElement;
    expect(active.textContent).toContain('Search Customers');
  });

  function searchInput(): HTMLInputElement {
    return fixture.nativeElement.querySelector('.app-navbar__search input') as HTMLInputElement;
  }

  function setInputValue(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function grantSearchAccess(): void {
    const user: AuthUser = {
      userId: 'user-1',
      email: 'ada@example.com',
      tenantId: 'tenant-1',
      roles: ['Admin'],
      permissions: [
        'Product.View',
        'Customer.View',
        'Order.View',
        'Invoice.View',
        'Inventory.View',
        'Expense.View',
        'Report.View',
        'Settings.View',
      ],
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
    TestBed.inject(TokenService).setSession('token', user);
  }
});
