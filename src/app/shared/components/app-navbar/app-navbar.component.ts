import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';
import { TenantSettingsStoreService } from '../../../core/services/tenant-settings-store.service';
import { ThemeService } from '../../../core/theme/theme.service';

import { NotificationStateService } from '../../../state/notification.state';
import { AiAssistantStateService } from '../../../state/ai-assistant.state';

import {
  APP_ROUTE_PATHS,
  TOP_NAV_ITEMS,
} from '../../constants/nav.constants';

import { ROUTES } from '../../../core/constants/route.constants';

import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    NotificationBellComponent,
  ],
  templateUrl: './app-navbar.component.html',
  styleUrl: './app-navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavbarComponent implements OnInit {
  // --------------------------------------------------------------------------
  // Services
  // --------------------------------------------------------------------------

  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly tenantSettingsStore = inject(TenantSettingsStoreService);
  private readonly notificationState = inject(NotificationStateService);
  private readonly aiAssistantState = inject(AiAssistantStateService);
  private readonly themeService = inject(ThemeService);

  // --------------------------------------------------------------------------
  // Outputs
  // --------------------------------------------------------------------------

  readonly menuToggle = output<void>();

  // --------------------------------------------------------------------------
  // Mobile Menu State
  // --------------------------------------------------------------------------

  readonly isMobileMenuOpen = signal(false);

  // --------------------------------------------------------------------------
  // Routes
  // --------------------------------------------------------------------------

  readonly routes = APP_ROUTE_PATHS;
  readonly settingsRoutes = ROUTES;

  // --------------------------------------------------------------------------
  // Theme
  // --------------------------------------------------------------------------

  readonly resolvedAppearance = this.themeService.resolvedAppearance;
  readonly isDarkMode = computed(() => this.resolvedAppearance() === 'dark');

  // --------------------------------------------------------------------------
  // Navigation
  // --------------------------------------------------------------------------

  readonly navItems = TOP_NAV_ITEMS.filter((item) => {
    if (!item.permissions?.length) {
      return true;
    }
    return this.tokenService.hasAnyPermission(item.permissions);
  });

  // --------------------------------------------------------------------------
  // User
  // --------------------------------------------------------------------------

  readonly currentUser = this.authService.currentUser;
  readonly showProfile = signal(false);

  readonly userInitial = computed(() => {
    return this.currentUser()?.email?.charAt(0)?.toUpperCase() ?? 'U';
  });

  readonly userDisplayName = computed(() => {
    const email = this.currentUser()?.email;
    if (!email) return 'User';
    return email.split('@')[0];
  });

  // --------------------------------------------------------------------------
  // Company Logo
  // --------------------------------------------------------------------------

  readonly companyLogoUrl = this.tenantSettingsStore.logoUrl;
  readonly logoLoadFailed = signal(false);
  readonly logoLoading = signal(false);

  readonly showCompanyLogo = computed(() => {
    return !!this.companyLogoUrl() && !this.logoLoadFailed();
  });

  // --------------------------------------------------------------------------
  // Notifications
  // --------------------------------------------------------------------------

  readonly canViewNotifications = computed(() =>
    this.tokenService.hasPermission('Notification.View')
  );

  // --------------------------------------------------------------------------
  // AI Assistant
  // --------------------------------------------------------------------------

  readonly aiAssistantOpen = this.aiAssistantState.isOpen;

  // --------------------------------------------------------------------------
  // Constructor
  // --------------------------------------------------------------------------

  constructor() {
    effect(() => {
      const logo = this.companyLogoUrl();
      this.logoLoadFailed.set(false);
      this.logoLoading.set(!!logo);
    });
  }

  // --------------------------------------------------------------------------
  // Lifecycle
  // --------------------------------------------------------------------------

  ngOnInit(): void {
    this.notificationState.initialize();
  }

  // --------------------------------------------------------------------------
  // Mobile Menu
  // --------------------------------------------------------------------------

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

  // --------------------------------------------------------------------------
  // Profile
  // --------------------------------------------------------------------------

  toggleProfile(): void {
    this.showProfile.update((value) => !value);
    this.notificationState.closePanel();
    this.closeMobileMenu();
  }

  closeProfileMenu(): void {
    this.showProfile.set(false);
  }

  // --------------------------------------------------------------------------
  // Theme
  // --------------------------------------------------------------------------

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  // --------------------------------------------------------------------------
  // AI Assistant
  // --------------------------------------------------------------------------

  toggleAiAssistant(): void {
    this.showProfile.set(false);
    this.notificationState.closePanel();
    this.aiAssistantState.toggle();
  }

  // --------------------------------------------------------------------------
  // Company Logo
  // --------------------------------------------------------------------------

  onLogoLoad(): void {
    this.logoLoading.set(false);
  }

  onLogoError(): void {
    this.logoLoadFailed.set(true);
    this.logoLoading.set(false);
  }

  // --------------------------------------------------------------------------
  // Authentication
  // --------------------------------------------------------------------------

  logout(): void {
    this.authService.logout();
    this.closeProfileMenu();
    this.closeMobileMenu();
  }

  // --------------------------------------------------------------------------
  // Menu Toggle (for parent component)
  // --------------------------------------------------------------------------

  onMenuToggle(): void {
    this.toggleMobileMenu();
    this.menuToggle.emit();
  }
}