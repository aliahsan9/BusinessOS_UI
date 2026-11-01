import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  effect,
  inject,
  signal,
  viewChild,
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
  private readonly fab = viewChild<ElementRef<HTMLButtonElement>>('fab');

  private readonly MOBILE_BREAKPOINT = 768;

  constructor() {
    effect(() => {
      const lock = this.isOpen() && this.isMobile();
      document.body.classList.toggle('bos-scroll-lock-chat', lock);
    });

    this.destroyRef.onDestroy(() => document.body.classList.remove('bos-scroll-lock-chat'));
  }

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
    if (!this.isOpen()) return;
    this.aiAssistantState.close();
    setTimeout(() => this.fab()?.nativeElement.focus(), 0);
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

    const target = event.target as HTMLElement | null;
    if (!target) return;
    // Keep the panel open when the click is inside it, on its backdrop,
    // or on a control that just asked to open it.
    if (target.closest('.ai-widget, .ai-widget__backdrop, [data-ai-open]')) return;

    this.close();
  }
}
