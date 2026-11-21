import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { permissionGuard, roleGuard } from './permission.guard';
import { TokenService } from '../services/token.service';
import { NotificationService } from '../services/notification.service';

describe('permissionGuard', () => {
  let tokenService: jasmine.SpyObj<TokenService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    tokenService = jasmine.createSpyObj('TokenService', ['hasAnyPermission', 'hasAllPermissions', 'hasRole']);
    notificationService = jasmine.createSpyObj('NotificationService', ['warning']);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    router.createUrlTree.and.callFake((commands: unknown[]) => ({ commands }) as unknown as UrlTree);

    TestBed.configureTestingModule({
      providers: [
        { provide: TokenService, useValue: tokenService },
        { provide: NotificationService, useValue: notificationService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows access when any required permission is present', () => {
    tokenService.hasAnyPermission.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(['Order.View'])({} as never, {} as never));

    expect(result).toBeTrue();
  });

  it('redirects to forbidden and warns when permissions are missing', () => {
    tokenService.hasAnyPermission.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      permissionGuard(['Order.View'])({} as never, {} as never));

    expect(notificationService.warning).toHaveBeenCalled();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/forbidden']);
    expect(result).toEqual(jasmine.objectContaining({ commands: ['/forbidden'] }));
  });

  it('roleGuard redirects unauthorized roles to dashboard', () => {
    tokenService.hasRole.and.returnValue(false);

    const result = TestBed.runInInjectionContext(() =>
      roleGuard(['Owner'])({} as never, {} as never));

    expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    expect(result).toEqual(jasmine.objectContaining({ commands: ['/dashboard'] }));
  });
});
