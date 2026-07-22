import {
  Component,
  ElementRef,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

interface ModuleMetric {
  label: string;
  value: string;
  trend?: string;
}

interface ModuleRow {
  primary: string;
  secondary: string;
  status: string;
  statusClass: 'status-teal' | 'status-amber' | 'status-red' | 'status-slate';
}

interface BusinessModule {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  metrics: ModuleMetric[];
  rows: ModuleRow[];
}

interface Stat {
  value: number;
  suffix: string;
  label: string;
  icon: string;
}

interface Capability {
  icon: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit, AfterViewInit, OnDestroy {
  // ----- Module switcher (the "signature" interactive dock) -----
  readonly modules: BusinessModule[] = [
    {
      id: 'crm',
      icon: 'bi-people-fill',
      name: 'CRM',
      tagline: 'Every customer relationship, tracked in one pipeline.',
      metrics: [
        { label: 'Open deals', value: '86', trend: '+12' },
        { label: 'Pipeline value', value: '$412K' },
        { label: 'Win rate', value: '38%', trend: '+4%' },
      ],
      rows: [
        { primary: 'Horizon Retail Co.', secondary: 'Contract renewal', status: 'Negotiating', statusClass: 'status-amber' },
        { primary: 'Blue Harbor Logistics', secondary: 'New account', status: 'Won', statusClass: 'status-teal' },
        { primary: 'Nomad Supply Chain', secondary: 'Discovery call', status: 'Open', statusClass: 'status-slate' },
      ],
    },
    {
      id: 'invoicing',
      icon: 'bi-receipt',
      name: 'Invoicing',
      tagline: 'Bill clients, chase payments, close the books.',
      metrics: [
        { label: 'Outstanding', value: '$28.4K' },
        { label: 'Paid this month', value: '$96.1K', trend: '+18%' },
        { label: 'Avg. time to pay', value: '6.2 days' },
      ],
      rows: [
        { primary: 'INV-2291', secondary: 'Horizon Retail Co.', status: 'Paid', statusClass: 'status-teal' },
        { primary: 'INV-2292', secondary: 'Blue Harbor Logistics', status: 'Sent', statusClass: 'status-slate' },
        { primary: 'INV-2287', secondary: 'Atlas Freight', status: 'Overdue', statusClass: 'status-red' },
      ],
    },
    {
      id: 'projects',
      icon: 'bi-kanban-fill',
      name: 'Projects',
      tagline: 'Plan the work, then track it to done.',
      metrics: [
        { label: 'Active projects', value: '14' },
        { label: 'Tasks closed', value: '327', trend: '+41' },
        { label: 'On-time rate', value: '92%' },
      ],
      rows: [
        { primary: 'Warehouse rollout', secondary: '8 of 12 tasks done', status: 'On track', statusClass: 'status-teal' },
        { primary: 'Q3 rebrand', secondary: '3 of 20 tasks done', status: 'At risk', statusClass: 'status-amber' },
        { primary: 'Vendor migration', secondary: '11 of 11 tasks done', status: 'Complete', statusClass: 'status-slate' },
      ],
    },
    {
      id: 'analytics',
      icon: 'bi-graph-up-arrow',
      name: 'Analytics',
      tagline: 'Every number that matters, in one view.',
      metrics: [
        { label: 'Revenue', value: '$128K', trend: '+24%' },
        { label: 'Orders', value: '4,268' },
        { label: 'Customers', value: '2,391', trend: '+9%' },
      ],
      rows: [
        { primary: 'Revenue growth', secondary: 'vs. last quarter', status: '+24%', statusClass: 'status-teal' },
        { primary: 'Churn rate', secondary: 'vs. last quarter', status: '-2%', statusClass: 'status-teal' },
        { primary: 'Support tickets', secondary: 'vs. last quarter', status: '+6%', statusClass: 'status-amber' },
      ],
    },
  ];

  activeModuleId: string = this.modules[0].id;

  get activeModule(): BusinessModule {
    return this.modules.find((m) => m.id === this.activeModuleId) ?? this.modules[0];
  }

  setActiveModule(id: string): void {
    this.activeModuleId = id;
  }

  // ----- "Running processes" list -----
  readonly capabilities: Capability[] = [
    { icon: 'bi-boxes', name: 'Inventory Management', description: 'Stock levels, reorder points, and warehouse visibility.' },
    { icon: 'bi-lightning-charge-fill', name: 'Sales Automation', description: 'Quotes, follow-ups, and approvals that run themselves.' },
    { icon: 'bi-person-lines-fill', name: 'Customer CRM', description: 'One timeline per customer, from lead to renewal.' },
    { icon: 'bi-cash-coin', name: 'Financial Tracking', description: 'Invoices, expenses, and cash flow in real time.' },
    { icon: 'bi-people-fill', name: 'Team Collaboration', description: 'Shared tasks, comments, and handoffs across teams.' },
    { icon: 'bi-bar-chart-fill', name: 'Business Analytics', description: 'Live dashboards instead of end-of-month reports.' },
  ];

  // ----- Animated system-monitor stats -----
  readonly stats: Stat[] = [
    { value: 10, suffix: 'K+', label: 'Businesses managed', icon: 'bi-buildings-fill' },
    { value: 99.9, suffix: '%', label: 'Platform uptime', icon: 'bi-shield-check' },
    { value: 50, suffix: 'M+', label: 'Transactions processed', icon: 'bi-arrow-left-right' },
    { value: 24, suffix: '/7', label: 'Business monitoring', icon: 'bi-eye-fill' },
  ];

  displayedStats: string[] = this.stats.map(() => '0');
  private statsAnimated = false;
  private observer?: IntersectionObserver;

  @ViewChild('statsWrapper') statsWrapper?: ElementRef<HTMLElement>;

  // ----- Live status-bar clock -----
  clock = '';
  private clockTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.updateClock();
    this.clockTimer = setInterval(() => this.updateClock(), 30000);
  }

  ngAfterViewInit(): void {
    if (!this.statsWrapper || typeof IntersectionObserver === 'undefined') {
      this.displayedStats = this.stats.map((s) => this.formatStat(s.value, s.suffix));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.statsAnimated) {
            this.statsAnimated = true;
            this.animateStats();
          }
        });
      },
      { threshold: 0.4 }
    );
    this.observer.observe(this.statsWrapper.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.clockTimer) {
      clearInterval(this.clockTimer);
    }
  }

  private updateClock(): void {
    this.clock = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private animateStats(): void {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.stats.forEach((stat, index) => {
      if (prefersReducedMotion) {
        this.displayedStats[index] = this.formatStat(stat.value, stat.suffix);
        return;
      }

      const duration = 1400;
      const start = performance.now();

      const step = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = stat.value * eased;
        this.displayedStats[index] = this.formatStat(current, stat.suffix, progress < 1);
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    });
  }

  private formatStat(value: number, suffix: string, inProgress = false): string {
    if (suffix === '%') {
      return `${value.toFixed(1)}${suffix}`;
    }
    if (suffix === '/7') {
      return `${Math.round(value)}${suffix}`;
    }
    return `${inProgress ? Math.round(value) : value}${suffix}`;
  }
}