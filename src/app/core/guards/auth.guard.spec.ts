import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['tryRestoreSession']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands: unknown[]) => ({ commands }) as unknown as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows navigation when a session can be restored', async () => {
    authService.tryRestoreSession.and.resolveTo(true);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(result).toBeTrue();
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users to login', async () => {
    authService.tryRestoreSession.and.resolveTo(false);

    const result = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/auth/login']);
    expect(result).toEqual(jasmine.objectContaining({ commands: ['/auth/login'] }));
  });
});

describe('guestGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['tryRestoreSession']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands: unknown[]) => ({ commands }) as unknown as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('sends authenticated guests to the dashboard', async () => {
    authService.tryRestoreSession.and.resolveTo(true);

    const result = await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toEqual(jasmine.objectContaining({ commands: ['/dashboard'] }));
  });

  it('allows anonymous guests onto auth pages', async () => {
    authService.tryRestoreSession.and.resolveTo(false);

    const result = await TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never));

    expect(result).toBeTrue();
  });
});
