import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  HostListener,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AiChatWindowComponent } from '../ai-chat-window/ai-chat-window.component';
import { TenantSettingsStoreService } from '../../../../core/services/tenant-settings-store.service';
import { AiAssistantStateService } from '../../../../state/ai-assistant.state';

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

  readonly isOpen = this.aiAssistantState.isOpen;
  /** Compact / phone layout for the floating chat sheet. */
  readonly isMobile = signal(false);

  private readonly MOBILE_BREAKPOINT = 768;

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadSettings();
    this.setupRouteListener();
  }

  private loadSettings(): void {
    if (!this.tenantSettingsStore.settings()) {
      this.tenantSettingsStore
        .load()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ error: () => undefined });
    }
  }

  private setupRouteListener(): void {
    this.router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        filter(() => this.isOpen()),
      )
      .subscribe(() => this.close());
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    this.isMobile.set(window.innerWidth < this.MOBILE_BREAKPOINT);
  }

  toggle(): void {
    this.aiAssistantState.toggle();
  }

  close(): void {
    if (this.isOpen()) {
      this.aiAssistantState.close();
    }
  }

  navigate(route: string): void {
    this.close();
    void this.router.navigateByUrl(route);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.isOpen() || this.isMobile()) return;

    const target = event.target as HTMLElement;
    const widgetElement = document.querySelector('.ai-widget');
    if (widgetElement && !widgetElement.contains(target)) {
      this.close();
    }
  }
}
