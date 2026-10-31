// app-sidebar.component.ts
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_GROUP_ORDER, NAV_ITEMS, NavItem, ROUTES } from '../../constants/nav.constants';
import { TokenService } from '../../../core/services/token.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { STORAGE_KEYS } from '../../../core/constants/storage.constants';
import { StorageHelper } from '../../../core/helpers/storage.helper';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.component.html',
  styleUrl: './app-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppSidebarComponent implements OnInit, OnDestroy {
  private readonly tokenService = inject(TokenService);
  private readonly themeService = inject(ThemeService);
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly mobileOpen = input(false);
  readonly collapsed = signal(StorageHelper.get<boolean>(STORAGE_KEYS.sidebarCollapsed) ?? false);
  readonly tabletOpen = signal(false);
  readonly billingRoute = ROUTES.billing.base;

  readonly mobileClose = output<void>();

  /** Drawer mode: phones and tablets. The sidebar overlays instead of pushing content. */
  private readonly overlay = signal(false);
  /**
   * Laptops and smaller desktops stay on the icon rail so the center column
   * keeps its width. The user can still expand it for the session.
   */
  private readonly autoContract = signal(false);
  private readonly expandOverride = signal(false);

  private breakpointSubscription?: Subscription;

  private readonly overlayQuery = '(max-width: 991.98px)';
  private readonly contractQuery = '(min-width: 992px) and (max-width: 1599.98px)';

  ngOnInit(): void {
    if (this.collapsed()) {
      const style = this.themeService.preferences().sidebarStyle;
      if (style !== 'collapsed' && style !== 'mini') {
        this.themeService.updatePreferences({ sidebarStyle: 'collapsed' });
      }
    }

    this.breakpointSubscription = this.breakpointObserver
      .observe([this.overlayQuery, this.contractQuery])
      .subscribe(() => {
        const overlay = this.breakpointObserver.isMatched(this.overlayQuery);
        const contract = this.breakpointObserver.isMatched(this.contractQuery);
        this.overlay.set(overlay);
        this.autoContract.set(contract);
        if (!contract) {
          this.expandOverride.set(false);
        }
        if (!overlay && this.mobileOpen()) {
          this.mobileClose.emit();
        }
      });
  }

  ngOnDestroy(): void {
    this.breakpointSubscription?.unsubscribe();
  }

  readonly isCollapsedView = computed(() => {
    if (this.overlay()) return false;
    const style = this.themeService.preferences().sidebarStyle;
    if (style === 'mini') return true;
    if (this.autoContract()) return !this.expandOverride();
    return this.collapsed() || style === 'collapsed';
  });

  readonly isMiniView = computed(() => {
    if (this.overlay()) return false;
    return this.themeService.preferences().sidebarStyle === 'mini';
  });

  readonly hideLabels = computed(() => {
    const style = this.themeService.preferences().sidebarStyle;
    return this.isCollapsedView() || style === 'mini';
  });

  readonly filteredNavItems = computed(() => {
    return NAV_ITEMS.filter((item) => {
      if (!item.permissions?.length) {
        return true;
      }
      return this.tokenService.hasAnyPermission(item.permissions);
    });
  });

  readonly navGroups = computed(() => {
    const items = this.filteredNavItems();
    const groups: { name: string; items: NavItem[] }[] = [];
    const groupMap = new Map<string, NavItem[]>();

    items.forEach((item) => {
      const key = item.group || 'Other';
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(item);
    });

    for (const name of NAV_GROUP_ORDER) {
      const groupItems = groupMap.get(name);
      if (!groupItems?.length) continue;
      // Home is a single item — no section label needed
      groups.push({ name: name === 'Home' ? '' : name, items: groupItems });
      groupMap.delete(name);
    }

    // Any leftover groups (safety)
    groupMap.forEach((groupItems, name) => {
      groups.push({ name: name === 'Other' ? '' : name, items: groupItems });
    });

    return groups;
  });

  isActiveRoute(route: string): boolean {
    // Implement route checking logic if needed
    return false;
  }

  toggleCollapse(): void {
    if (this.autoContract() && this.themeService.preferences().sidebarStyle !== 'mini') {
      this.expandOverride.update((open) => !open);
      return;
    }

    this.collapsed.update((v) => !v);
    StorageHelper.set(STORAGE_KEYS.sidebarCollapsed, this.collapsed());
    this.themeService.updatePreferences({
      sidebarStyle: this.collapsed() ? 'collapsed' : 'expanded',
    });
  }

  toggleTablet(): void {
    this.tabletOpen.update((v) => !v);
  }

  onNavClick(): void {
    if (this.overlay()) {
      this.mobileClose.emit();
      this.tabletOpen.set(false);
    }
  }
}