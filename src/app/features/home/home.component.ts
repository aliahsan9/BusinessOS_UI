import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { TestimonialsComponent } from '../testimonials/testimonials.component';
import { FooterComponent } from '../footer/footer.component'; 
import { LandingComponent } from '../landing/landing.component';

interface LedgerEvent {
  time: string;
  desc: string;
  amount: string;
  icon: string;
  trend: 'up' | 'down' | 'neutral';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, LandingComponent, TestimonialsComponent, FooterComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('statsRef') statsRef?: ElementRef<HTMLElement>;

  // Target values for the hero stats. Kept as plain numbers so the
  // count-up animation can format them for display.
  private readonly businessesTarget = 10000;
  private readonly usersTarget = 50000;
  private readonly uptimeTarget = 99.9;

  displayedBusinesses = signal('0');
  displayedUsers = signal('0');
  displayedUptime = signal('0.0');

  private statsAnimated = false;
  private statsObserver?: IntersectionObserver;

  readonly ledgerEvents: LedgerEvent[] = [
    { time: '09:41', desc: 'Invoice #1042 paid — Horizon Coffee', amount: '+$2,400', icon: 'bi-receipt', trend: 'up' },
    { time: '09:38', desc: 'New customer — Sarah K.', amount: 'CRM', icon: 'bi-person-plus', trend: 'neutral' },
    { time: '09:35', desc: 'Stock alert — SKU-2291 low', amount: '12 left', icon: 'bi-exclamation-triangle', trend: 'down' },
    { time: '09:31', desc: 'Order #884 shipped', amount: '+$189', icon: 'bi-box-seam', trend: 'up' },
    { time: '09:27', desc: 'Payroll run completed', amount: '−$18,240', icon: 'bi-people', trend: 'down' },
    { time: '09:22', desc: 'Project "Q3 Launch" — task closed', amount: 'Projects', icon: 'bi-kanban', trend: 'neutral' },
    { time: '09:18', desc: 'Refund issued — Order #861', amount: '−$64', icon: 'bi-arrow-counterclockwise', trend: 'down' },
    { time: '09:14', desc: 'Invoice #1041 paid — Nomad Studio', amount: '+$960', icon: 'bi-receipt', trend: 'up' },
  ];

  // Duplicated so the CSS scroll animation can loop seamlessly at -50%.
  get ledgerLoop(): LedgerEvent[] {
    return [...this.ledgerEvents, ...this.ledgerEvents];
  }

  ngAfterViewInit(): void {
    if (!this.statsRef || this.statsAnimated) {
      return;
    }

    this.statsObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((entry) => entry.isIntersecting);
        if (visible && !this.statsAnimated) {
          this.statsAnimated = true;
          this.animateStats();
          this.statsObserver?.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    this.statsObserver.observe(this.statsRef.nativeElement);
  }

  ngOnDestroy(): void {
    this.statsObserver?.disconnect();
  }

  private animateStats(): void {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      this.displayedBusinesses.set(this.formatCompact(this.businessesTarget));
      this.displayedUsers.set(this.formatCompact(this.usersTarget));
      this.displayedUptime.set(this.uptimeTarget.toFixed(1));
      return;
    }

    const duration = 1400;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      this.displayedBusinesses.set(
        this.formatCompact(Math.round(this.businessesTarget * eased))
      );
      this.displayedUsers.set(
        this.formatCompact(Math.round(this.usersTarget * eased))
      );
      this.displayedUptime.set((this.uptimeTarget * eased).toFixed(1));

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  private formatCompact(value: number): string {
    if (value >= 1000) {
      return `${Math.round(value / 1000)}K`;
    }
    return `${value}`;
  }
}