import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

interface MonitorWidget {
  value: string;
  label: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  @ViewChildren('revealEl')
  private revealEls!: QueryList<ElementRef<HTMLElement>>;

  private observer?: IntersectionObserver;

  readonly features: FeatureItem[] = [
    {
      icon: 'bi-box-seam',
      title: 'Inventory management',
      description:
        'Track stock levels, SKUs, and movements with low-stock alerts that fire as sales clear.'
    },
    {
      icon: 'bi-cart-check',
      title: 'Sales & orders',
      description:
        'Create invoices, manage orders, monitor payments, and see revenue as it happens.'
    },
    {
      icon: 'bi-people',
      title: 'Customer CRM',
      description:
        'Keep profiles, purchase history, and conversations in one shared customer record.'
    },
    {
      icon: 'bi-building',
      title: 'Supplier management',
      description:
        'Organize vendors, purchase orders, and deliveries in a clear procurement workflow.'
    },
    {
      icon: 'bi-bar-chart',
      title: 'Reports & analytics',
      description:
        'Monitor KPIs and trends with live dashboards instead of end-of-month spreadsheets.'
    },
    {
      icon: 'bi-shield-check',
      title: 'Role-based security',
      description:
        'Protect data with authentication, permissions, and module-level access control.'
    }
  ];

  readonly benefits: string[] = [
    'Real-time business insights',
    'Faster operational workflows',
    'Less manual re-entry',
    'Scalable for growing teams',
    'Enterprise-grade security',
    'Cloud-ready infrastructure'
  ];

  readonly widgets: MonitorWidget[] = [
    { value: '100%', label: 'Digital operations' },
    { value: '24/7', label: 'Business monitoring' },
    { value: '50%', label: 'Faster processes' },
    { value: '1', label: 'Unified platform' }
  ];

  ngAfterViewInit(): void {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      this.revealEls.forEach((el) => el.nativeElement.classList.add('is-visible'));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          const el = entry.target as HTMLElement;
          const delay = Number(el.dataset['revealDelay'] ?? 0);

          setTimeout(() => el.classList.add('is-visible'), delay);
          this.observer?.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    this.revealEls.forEach((el) => this.observer?.observe(el.nativeElement));
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
