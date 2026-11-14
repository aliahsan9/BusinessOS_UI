import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';
import { TenantSettingsStoreService } from '../../../core/services/tenant-settings-store.service';
import { ThemeService } from '../../../core/theme/theme.service';

import { NotificationStateService } from '../../../state/notification.state';

import { APP_ROUTE_PATHS } from '../../constants/nav.constants';
import { ROUTES } from '../../../core/constants/route.constants';
import { GlobalSearchHit, buildGlobalSearchResults } from '../../search/global-search';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NotificationBellComponent],
  templateUrl: './app-navbar.component.html',
  styleUrl: './app-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavbarComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly tenantSettingsStore = inject(TenantSettingsStoreService);
  private readonly notificationState = inject(NotificationStateService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
  readonly isMobileMenuOpen = signal(false);
  private readonly menuButton = viewChild<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly profileMenu = viewChild<ElementRef<HTMLElement>>('profileMenu');
  private readonly searchRoot = viewChild<ElementRef<HTMLElement>>('searchRoot');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private menuWasOpen = false;
  readonly searchQuery = signal('');
  readonly searchOpen = signal(false);
  readonly activeIndex = signal(0);
  readonly searchShortcut = signal('Ctrl K');
  readonly isCompactNav = signal(false);

  readonly routes = APP_ROUTE_PATHS;
  readonly settingsRoutes = ROUTES;

  readonly searchPlaceholder = computed(() =>
    this.isCompactNav() ? 'Search...' : 'Search pages, products, customers...',
  );

  readonly searchHits = computed(() =>
    buildGlobalSearchResults(this.searchQuery(), (permissions) => {
      if (!permissions?.length) return true;
      return this.tokenService.hasAnyPermission([...permissions]);
    }),
  );

  readonly searchGroups = computed(() => {
    const groups: { name: string; hits: (GlobalSearchHit & { index: number })[] }[] = [];
    this.searchHits().forEach((hit, index) => {
      let group = groups.find((item) => item.name === hit.group);
      if (!group) {
        group = { name: hit.group, hits: [] };
        groups.push(group);
      }
      group.hits.push({ ...hit, index });
    });
    return groups;
  });

  readonly activeDescendant = computed(() => {
    const hits = this.searchHits();
    if (!this.searchOpen() || !hits.length) return null;
    const index = Math.min(this.activeIndex(), hits.length - 1);
    return `navbar-search-hit-${index}`;
  });

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

    effect(() => {
      const open = this.menuOpen();
      if (this.menuWasOpen && !open) {
        setTimeout(() => this.menuButton()?.nativeElement.focus(), 0);
      }
      this.menuWasOpen = open;
    });
  }

  ngOnInit(): void {
    document.addEventListener('pointerdown', this.dismissProfileOnOutsidePointer, true);
    this.notificationState.initialize();
    this.syncCompactNav();
    if (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)) {
      this.searchShortcut.set('⌘K');
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('pointerdown', this.dismissProfileOnOutsidePointer, true);
  }

  private readonly dismissProfileOnOutsidePointer = (event: Event): void => {
    const target = event.target;
    if (this.showProfile()) {
      const root = this.profileMenu()?.nativeElement;
      if (!(root && target instanceof Node && root.contains(target))) {
        this.showProfile.set(false);
      }
    }
    if (this.searchOpen()) {
      const root = this.searchRoot()?.nativeElement;
      if (!(root && target instanceof Node && root.contains(target))) {
        this.searchOpen.set(false);
      }
    }
  };

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncCompactNav();
  }

  private syncCompactNav(): void {
    this.isCompactNav.set(typeof window !== 'undefined' && window.innerWidth < 768);
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.searchOpen()) {
      this.closeSearch();
      return;
    }

    if (event.key === 'Escape' && this.showProfile()) {
      this.showProfile.set(false);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.openSearch();
    }
  }

  onSearchFocus(): void {
    this.searchOpen.set(true);
    this.showProfile.set(false);
    this.notificationState.closePanel();
  }

  onSearchBlur(): void {
    setTimeout(() => {
      const root = this.searchRoot()?.nativeElement;
      const active = document.activeElement;
      if (root && active instanceof Node && root.contains(active)) return;
      this.searchOpen.set(false);
    }, 0);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
    this.activeIndex.set(0);
    this.searchOpen.set(true);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const hits = this.searchHits();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.searchOpen.set(true);
      if (!hits.length) return;
      this.activeIndex.update((index) => (index + 1) % hits.length);
      this.scrollActiveHitIntoView();
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.searchOpen.set(true);
      if (!hits.length) return;
      this.activeIndex.update((index) => (index - 1 + hits.length) % hits.length);
      this.scrollActiveHitIntoView();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      const hit = hits[this.activeIndex()] ?? hits[0];
      if (hit) this.activateSearchHit(hit);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closeSearch();
    }
  }

  clearSearch(): void {
    this.searchQuery.set('');
    this.activeIndex.set(0);
    this.searchOpen.set(true);
    this.searchInput()?.nativeElement.focus();
  }

  activateSearchHit(hit: GlobalSearchHit): void {
    const extras = hit.kind === 'records' && hit.query ? { queryParams: { search: hit.query } } : undefined;
    void this.router.navigate([hit.route], extras);
    this.searchQuery.set('');
    this.activeIndex.set(0);
    this.closeSearch();
    this.searchInput()?.nativeElement.blur();
  }

  private openSearch(): void {
    this.searchOpen.set(true);
    this.showProfile.set(false);
    this.notificationState.closePanel();
    const input = this.searchInput()?.nativeElement;
    input?.focus();
    input?.select();
  }

  private closeSearch(): void {
    this.searchOpen.set(false);
  }

  private scrollActiveHitIntoView(): void {
    const id = this.activeDescendant();
    if (!id) return;
    queueMicrotask(() => document.getElementById(id)?.scrollIntoView({ block: 'nearest' }));
  }

  openMobileMenu(): void {
    this.isMobileMenuOpen.set(true);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
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
