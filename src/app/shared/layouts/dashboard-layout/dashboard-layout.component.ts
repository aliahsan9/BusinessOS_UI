import { ChangeDetectionStrategy, Component, HostListener, OnDestroy, OnInit, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSidebarComponent } from '../../components/app-sidebar/app-sidebar.component';
import { AppNavbarComponent } from '../../components/app-navbar/app-navbar.component';
import { AiAssistantWidgetComponent } from '../../components/ai-assistant/ai-assistant-widget/ai-assistant-widget.component';
import { ProfileService } from '../../../core/services/profile.service';
import { TokenService } from '../../../core/services/token.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, AppSidebarComponent, AppNavbarComponent, AiAssistantWidgetComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  private readonly profileService = inject(ProfileService);
  private readonly tokenService = inject(TokenService);

  readonly currentYear = new Date().getFullYear();
  readonly mobileSidebarOpen = signal(false);

  constructor() {
    effect(() => {
      document.body.classList.toggle('bos-scroll-lock', this.mobileSidebarOpen());
    });
  }

  ngOnInit(): void {
    const user = this.tokenService.user();
    if (!user || user.fullName) return;

    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.tokenService.patchUser({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          fullName: profile.fullName,
          avatarUrl: profile.avatarUrl,
        });
      },
      error: () => {
        // Non-blocking: navbar falls back to email-derived display name.
      },
    });
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update((v) => !v);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  ngOnDestroy(): void {
    document.body.classList.remove('bos-scroll-lock');
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.mobileSidebarOpen()) {
      this.closeMobileSidebar();
    }
  }
}
