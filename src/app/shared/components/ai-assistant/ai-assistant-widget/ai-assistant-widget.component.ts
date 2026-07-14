import { 
  ChangeDetectionStrategy, 
  Component, 
  inject, 
  OnInit, 
  signal, 
  HostListener, 
  DestroyRef 
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AiChatWindowComponent } from '../ai-chat-window/ai-chat-window.component';
import { TenantSettingsStoreService } from '../../../../core/services/tenant-settings-store.service';
import { AiAssistantStateService } from '../../../../state/ai-assistant.state';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-ai-assistant-widget',
  standalone: true,
  imports: [AiChatWindowComponent],
  templateUrl: './ai-assistant-widget.component.html',
  styleUrl: './ai-assistant-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiAssistantWidgetComponent implements OnInit {
  private readonly tenantSettingsStore = inject(TenantSettingsStoreService);
  private readonly aiAssistantState = inject(AiAssistantStateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  readonly isOpen = this.aiAssistantState.isOpen;
  readonly showWidget = signal<boolean>(false);
  readonly isMobile = signal<boolean>(false);
  
  // Configuration
  private readonly DESKTOP_BREAKPOINT = 992;
  private readonly TABLET_BREAKPOINT = 768;

  ngOnInit(): void {
    this.initializeWidget();
    this.loadSettings();
    this.setupRouteListener();
  }

  /**
   * Initialize widget based on screen size
   */
  private initializeWidget(): void {
    this.checkScreenSize();
    
    // Close widget if on mobile
    if (this.isMobile()) {
      this.aiAssistantState.close();
    }
  }

  /**
   * Load tenant settings
   */
  private loadSettings(): void {
    if (!this.tenantSettingsStore.settings()) {
      this.tenantSettingsStore.load()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (settings) => {
            // Settings loaded successfully
            console.debug('Tenant settings loaded:', settings);
          },
          error: (error) => {
            console.error('Failed to load tenant settings:', error);
          }
        });
    }
  }

  /**
   * Listen to route changes to close widget on navigation
   */
  private setupRouteListener(): void {
    this.router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.isOpen())
      )
      .subscribe(() => {
        // Close widget when route changes
        this.close();
      });
  }

  /**
   * Handle window resize events
   */
  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
    
    // Close widget if switching to mobile
    if (this.isMobile() && this.isOpen()) {
      this.aiAssistantState.close();
    }
  }

  /**
   * Handle window scroll events
   */
  @HostListener('window:scroll')
  onScroll(): void {
    // Auto-close widget on scroll if open (optional behavior)
    // Uncomment if you want this behavior:
    // if (this.isOpen() && this.isMobile()) {
    //   this.close();
    // }
  }

  /**
   * Check current screen size and update signals
   */
  private checkScreenSize(): void {
    const width = window.innerWidth;
    this.isMobile.set(width < this.DESKTOP_BREAKPOINT);
    this.showWidget.set(width >= this.DESKTOP_BREAKPOINT);
  }

  /**
   * Toggle widget open/close state
   */
  toggle(): void {
    if (this.isMobile()) {
      // If on mobile, don't allow toggling
      return;
    }
    this.aiAssistantState.toggle();
  }

  /**
   * Close the widget
   */
  close(): void {
    if (this.isOpen()) {
      this.aiAssistantState.close();
    }
  }

  /**
   * Navigate to a specific route and close widget
   */
  navigate(route: string): void {
    this.close();
    void this.router.navigateByUrl(route);
  }

  /**
   * Check if widget should be visible
   */
  isWidgetVisible(): boolean {
    return this.showWidget() && !this.isMobile();
  }

  /**
   * Handle escape key to close widget
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  /**
   * Handle click outside to close widget
   */
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const widgetElement = document.querySelector('.ai-widget');
    
    if (this.isOpen() && widgetElement && !widgetElement.contains(target)) {
      // Check if click is outside widget
      this.close();
    }
  }
}