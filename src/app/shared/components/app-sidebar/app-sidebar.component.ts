// app-sidebar.component.ts
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NAV_ITEMS, NavItem } from '../../constants/nav.constants';
import { TokenService } from '../../../core/services/token.service';
import { ThemeService } from '../../../core/theme/theme.service';
import { STORAGE_KEYS } from '../../../core/constants/storage.constants';
import { StorageHelper } from '../../../core/helpers/storage.helper';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
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

  readonly mobileClose = output<void>();

  private breakpointSubscription?: Subscription;
  private isMobileDevice = false;
  private isTabletDevice = false;

  ngOnInit(): void {
    // Subscribe to breakpoint changes
    this.breakpointSubscription = this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.Tablet])
      .subscribe(result => {
        // Check if it's a handset (mobile)
        this.isMobileDevice = this.breakpointObserver.isMatched(Breakpoints.Handset);
        // Check if it's a tablet
        this.isTabletDevice = this.breakpointObserver.isMatched(Breakpoints.Tablet);
        
        // Auto-close sidebar on mobile when navigating
        if (this.isMobileDevice && this.mobileOpen()) {
          this.mobileClose.emit();
        }
      });
  }

  ngOnDestroy(): void {
    this.breakpointSubscription?.unsubscribe();
  }

  readonly isCollapsedView = computed(() => {
    const style = this.themeService.preferences().sidebarStyle;
    return this.collapsed() || style === 'collapsed' || style === 'mini';
  });

  readonly isMiniView = computed(() => {
    const style = this.themeService.preferences().sidebarStyle;
    return style === 'mini';
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

    // Separate items with groups
    const groupedItems = items.filter((item) => item.group);
    const ungroupedItems = items.filter((item) => !item.group);

    // Add ungrouped items first
    if (ungroupedItems.length > 0) {
      groups.push({ name: '', items: ungroupedItems });
    }

    // Group items by group name
    const groupMap = new Map<string, NavItem[]>();
    groupedItems.forEach((item) => {
      const key = item.group || 'Other';
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(item);
    });

    // Add grouped items
    groupMap.forEach((items, name) => {
      groups.push({ name, items });
    });

    return groups;
  });

  isActiveRoute(route: string): boolean {
    // Implement route checking logic if needed
    return false;
  }

  toggleCollapse(): void {
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
    // Close on mobile
    if (this.isMobileDevice) {
      this.mobileClose.emit();
    }
    // Close on tablet
    if (this.isTabletDevice) {
      this.tabletOpen.set(false);
    }
  }
}