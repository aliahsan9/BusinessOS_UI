import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';
import { TenantSettingsStoreService } from '../../../core/services/tenant-settings-store.service';
import { ThemeService } from '../../../core/theme/theme.service';

import { NotificationStateService } from '../../../state/notification.state';

import { APP_ROUTE_PATHS } from '../../constants/nav.constants';
import { ROUTES } from '../../../core/constants/route.constants';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NotificationBellComponent],
  templateUrl: './app-navbar.component.html',
  styleUrl: './app-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly tenantSettingsStore = inject(TenantSettingsStoreService);
  private readonly notificationState = inject(NotificationStateService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  readonly menuToggle = output<void>();
  readonly isMobileMenuOpen = signal(false);
  readonly searchQuery = signal('');
  readonly isCompactNav = signal(false);

  readonly routes = APP_ROUTE_PATHS;
  readonly settingsRoutes = ROUTES;

  readonly searchPlaceholder = computed(() =>
    this.isCompactNav() ? 'Search...' : 'Search products, orders, customers...',
  );

  readonly resolvedAppearance = this.themeService.resolvedAppearance;
  readonly isDarkMode = computed(() => this.resolvedAppearance() === 'dark');

  readonly currentUser = this.authService.currentUser;
  readonly showProfile = signal(false);

  readonly userInitial = computed(() => {
    const user = this.currentUser();
    const first = user?.firstName?.charAt(0) ?? '';
    const last = user?.lastName?.charAt(0) ?? '';
    const fromName = `${first}${last}`.trim();
    if (fromName) return fromName.toUpperCase();
    return user?.email?.charAt(0)?.toUpperCase() ?? 'U';
  });

  readonly userDisplayName = computed(() => {
    const user = this.currentUser();
    if (user?.fullName?.trim()) return user.fullName.trim();
    const composed = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    if (composed) return composed;
    const email = user?.email;
    if (!email) return 'User';
    const local = email.split('@')[0] ?? 'User';
    return local
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  });

  readonly userAvatarUrl = computed(() => {
    const url = this.currentUser()?.avatarUrl?.trim();
    return url || null;
  });

  readonly userRoleLabel = computed(() => {
    const roles = this.currentUser()?.roles ?? [];
    if (roles.some((r) => /admin/i.test(r))) return 'Administrator';
    if (roles.length) return roles[0];
    return 'Account';
  });

  readonly companyLogoUrl = this.tenantSettingsStore.logoUrl;
  readonly logoLoadFailed = signal(false);
  readonly logoLoading = signal(false);
  readonly userAvatarBroken = signal(false);

  readonly showCompanyLogo = computed(() => {
    return !!this.companyLogoUrl() && !this.logoLoadFailed();
  });

  readonly showUserAvatar = computed(() => {
    return !!this.userAvatarUrl() && !this.userAvatarBroken() && !this.showCompanyLogo();
  });

  readonly canViewNotifications = computed(() =>
    this.tokenService.hasPermission('Notification.View'),
  );

  constructor() {
    effect(() => {
      const logo = this.companyLogoUrl();
      this.logoLoadFailed.set(false);
      this.logoLoading.set(!!logo);
    });

    effect(() => {
      this.userAvatarUrl();
      this.userAvatarBroken.set(false);
    });
  }

  ngOnInit(): void {
    this.notificationState.initialize();
    this.syncCompactNav();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncCompactNav();
  }

  private syncCompactNav(): void {
    this.isCompactNav.set(typeof window !== 'undefined' && window.innerWidth < 768);
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const input = document.querySelector<HTMLInputElement>('.app-navbar__search input');
      input?.focus();
    }
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  submitSearch(): void {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return;

    if (q.includes('order')) {
      void this.router.navigateByUrl(ROUTES.orders.list);
    } else if (q.includes('customer')) {
      void this.router.navigateByUrl(ROUTES.customers.list);
    } else if (q.includes('product') || q.includes('inventory') || q.includes('stock')) {
      void this.router.navigateByUrl(ROUTES.products.list);
    } else if (q.includes('invoice')) {
      void this.router.navigateByUrl(ROUTES.invoices.list);
    } else if (q.includes('report')) {
      void this.router.navigateByUrl(ROUTES.reports);
    } else {
      void this.router.navigateByUrl(ROUTES.products.list);
    }
  }

  openMobileMenu(): void {
    this.isMobileMenuOpen.set(true);
    document.body.style.overflow = 'hidden';
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleMobileMenu(): void {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    } else {
      this.openMobileMenu();
    }
  }

  toggleProfile(): void {
    this.showProfile.update((value) => !value);
    this.notificationState.closePanel();
    this.closeMobileMenu();
  }

  closeProfileMenu(): void {
    this.showProfile.set(false);
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  onAiWorkspaceClick(): void {
    this.showProfile.set(false);
    this.notificationState.closePanel();
  }

  onLogoLoad(): void {
    this.logoLoading.set(false);
  }

  onLogoError(): void {
    this.logoLoadFailed.set(true);
    this.logoLoading.set(false);
  }

  onUserAvatarError(): void {
    this.userAvatarBroken.set(true);
  }

  logout(): void {
    this.authService.logout();
    this.closeProfileMenu();
    this.closeMobileMenu();
  }

  onMenuToggle(): void {
    this.toggleMobileMenu();
    this.menuToggle.emit();
  }
}
