import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
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

interface ModuleItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  metric: string;
  tag?: string;
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
  @ViewChild('ledgerPanel') ledgerPanel?: ElementRef<HTMLElement>;
  @ViewChildren('revealEl') private revealEls!: QueryList<ElementRef<HTMLElement>>;

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
  private cardsObserver?: IntersectionObserver;
  private readonly prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  readonly modules: ModuleItem[] = [
    {
      id: 'analytics',
      icon: 'bi-graph-up-arrow',
      tag: 'Core',
      title: 'Analytics',
      description: 'Revenue, orders, and customer trends in one live view — updated as the business moves, not at month-end.',
      metric: 'Dashboards refresh in real time, no exports needed',
    },
    {
      id: 'inventory',
      icon: 'bi-boxes',
      title: 'Inventory',
      description: 'Stock levels, reorder points, and supplier records that stay in sync with every sale.',
      metric: 'Low-stock alerts fire the moment a sale clears',
    },
    {
      id: 'customers',
      icon: 'bi-people',
      title: 'Customers',
      description: 'A shared record of every account, conversation, and order history — no separate CRM to maintain.',
      metric: 'One profile, every order and message attached',
    },
    {
      id: 'finance',
      icon: 'bi-cash-stack',
      title: 'Finance',
      description: 'Invoices, expenses, and cash flow tracked against real orders, not spreadsheets you rebuild weekly.',
      metric: 'Cash flow tied directly to live order data',
    },
    {
      id: 'employees',
      icon: 'bi-person-badge',
      title: 'Employees',
      description: 'Roles, shifts, and permissions, so the right person sees the right module — and nothing else.',
      metric: 'Granular, role-based access per module',
    },
    {
      id: 'projects',
      icon: 'bi-kanban',
      title: 'Projects',
      description: 'Tasks and timelines tied to the customers and invoices they belong to.',
      metric: 'Every task linked back to its invoice',
    },
  ];

  activeModule = signal<string>('analytics');
  tiltStyle = signal<string>('');

  selectModule(id: string): void {
    this.activeModule.set(this.activeModule() === id ? '' : id);
  }

  onPanelMouseMove(event: MouseEvent): void {
    if (this.prefersReducedMotion || !this.ledgerPanel) {
      return;
    }

    const rect = this.ledgerPanel.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    const rotateY = x * 8;
    const rotateX = y * -8;

    this.tiltStyle.set(
      `transform: perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01);`
    );
  }

  resetTilt(): void {
    this.tiltStyle.set(
      'transform: perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1);'
    );
  }

  ngAfterViewInit(): void {
    this.setUpStatsObserver();
    this.setUpCardsReveal();
  }

  ngOnDestroy(): void {
    this.statsObserver?.disconnect();
    this.cardsObserver?.disconnect();
  }

  private setUpStatsObserver(): void {
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

  private setUpCardsReveal(): void {
    if (!this.revealEls) {
      return;
    }

    if (this.prefersReducedMotion) {
      this.revealEls.forEach((el) => el.nativeElement.classList.add('is-visible'));
      return;
    }

    this.cardsObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const el = entry.target as HTMLElement;
          const delay = Number(el.dataset['revealDelay'] ?? 0);
          setTimeout(() => el.classList.add('is-visible'), delay);
          this.cardsObserver?.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    this.revealEls.forEach((el) => this.cardsObserver?.observe(el.nativeElement));
  }

  private animateStats(): void {
    if (this.prefersReducedMotion) {
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