import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

interface ServiceItem {
  id: string;
  icon: string;
  category: string;
  title: string;
  tagline: string;
  description: string;
  stack: string[];
}

interface DeliveryStep {
  icon: string;
  title: string;
  description: string;
}

interface TrustPoint {
  icon: string;
  title: string;
  description: string;
}

interface BusinessOutcome {
  icon: string;
  problem: string;
  solution: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink, FooterComponent, NavbarComponent],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent {
  readonly services: ServiceItem[] = [
    {
      id: 'inventory',
      icon: 'bi bi-box-seam',
      category: 'Operations',
      title: 'Inventory management',
      tagline: 'Stock levels that stay accurate as sales move.',
      description:
        'Track products, warehouses, and reorder points with alerts that fire when inventory drops — no end-of-day reconciliation required.',
      stack: ['SKU tracking', 'Low-stock alerts', 'Multi-location stock', 'Movement history']
    },
    {
      id: 'sales',
      icon: 'bi bi-cart-check',
      category: 'Operations',
      title: 'Sales & order management',
      tagline: 'Quotes, invoices, and payments in one flow.',
      description:
        'Create orders, issue invoices, and track payment status while revenue updates across finance and analytics automatically.',
      stack: ['Order pipeline', 'Invoicing', 'Payment tracking', 'Sales history']
    },
    {
      id: 'suppliers',
      icon: 'bi bi-truck',
      category: 'Operations',
      title: 'Suppliers & purchasing',
      tagline: 'Keep vendors and purchase orders in sync with stock.',
      description:
        'Manage supplier records and purchase flows so replenishment ties back to the same inventory your sales team relies on.',
      stack: ['Supplier directory', 'Purchase orders', 'Receive stock', 'Vendor history']
    },
    {
      id: 'crm',
      icon: 'bi bi-people',
      category: 'Growth',
      title: 'Customer CRM',
      tagline: 'One record for every relationship.',
      description:
        'Centralize customer profiles, conversations, and purchase history so sales and support always work from the same timeline.',
      stack: ['Customer profiles', 'Purchase history', 'Follow-ups', 'Loyalty tracking']
    },
    {
      id: 'finance',
      icon: 'bi bi-cash-stack',
      category: 'Finance',
      title: 'Finance & cash flow',
      tagline: 'Books that reflect live operations.',
      description:
        'Monitor expenses, receivables, and cash position against real order data instead of rebuilding spreadsheets every week.',
      stack: ['Expenses', 'Receivables', 'Cash overview', 'Financial reports']
    },
    {
      id: 'analytics',
      icon: 'bi bi-graph-up-arrow',
      category: 'Growth',
      title: 'Analytics & reporting',
      tagline: 'KPIs that refresh with the business.',
      description:
        'Interactive dashboards for revenue, orders, inventory health, and team activity — available whenever leaders need them.',
      stack: ['Live dashboards', 'KPI tracking', 'Trend analysis', 'Export-ready reports']
    },
    {
      id: 'team',
      icon: 'bi bi-person-badge',
      category: 'Growth',
      title: 'Team & collaboration',
      tagline: 'The right people on the right work.',
      description:
        'Invite teammates, assign ownership, and keep operational handoffs inside the platform instead of scattered chats.',
      stack: ['Team invites', 'Task ownership', 'Shared activity', 'Handoff clarity']
    },
    {
      id: 'security',
      icon: 'bi bi-shield-lock',
      category: 'Security',
      title: 'Security & team access',
      tagline: 'The right people see the right modules.',
      description:
        'Protect business data with authentication, role-based permissions, and audit-friendly access controls across every module.',
      stack: ['Role-based access', 'Secure login', 'Permission sets', 'Activity controls']
    }
  ];

  readonly businessOutcomes: BusinessOutcome[] = [
    {
      icon: 'bi-exclamation-triangle',
      problem: 'Stockouts and overstock surprises',
      solution: 'Live inventory with reorder alerts tied to every sale and receipt.',
    },
    {
      icon: 'bi-files',
      problem: 'Invoices rebuilt from chat threads',
      solution: 'Orders flow into invoicing and payment tracking automatically.',
    },
    {
      icon: 'bi-person-x',
      problem: 'Customer history split across tools',
      solution: 'One CRM profile with orders, notes, and follow-ups attached.',
    },
    {
      icon: 'bi-pie-chart',
      problem: 'Month-end spreadsheet marathons',
      solution: 'Dashboards that refresh with operations — not end-of-month exports.',
    },
  ];

  readonly deliverySteps: DeliveryStep[] = [
    {
      icon: 'bi-clipboard-check',
      title: 'Map your operations',
      description:
        'We help you decide which modules matter first — inventory, sales, CRM, finance — based on how you actually work today.',
    },
    {
      icon: 'bi-people',
      title: 'Set roles & ownership',
      description:
        'Invite warehouse, sales, and finance with permissions that match their jobs so access stays clean from day one.',
    },
    {
      icon: 'bi-graph-up',
      title: 'Go live with clarity',
      description:
        'Start with the workflows that hurt most, then expand. Live dashboards replace end-of-month spreadsheet rebuilds.',
    },
  ];

  readonly trustPoints: TrustPoint[] = [
    {
      icon: 'bi-check2-circle',
      title: 'Connected modules',
      description: 'A sale updates stock, invoices, and analytics — no re-entry between tools.',
    },
    {
      icon: 'bi-shield-check',
      title: 'Permission-aware',
      description: 'Every teammate sees the modules they need. Sensitive finance stays restricted.',
    },
    {
      icon: 'bi-clock-history',
      title: 'Built for uptime',
      description: 'Designed for daily operations with a 99.9% uptime target and human support.',
    },
    {
      icon: 'bi-journal-text',
      title: 'Clear documentation',
      description: 'FAQ and Privacy pages explain setup, access, and how we handle your data.',
    },
  ];

  readonly categories = computed(() => {
    const unique = Array.from(new Set(this.services.map(s => s.category)));
    return ['All', ...unique];
  });

  readonly activeCategory = signal<string>('All');

  readonly filteredServices = computed(() => {
    const active = this.activeCategory();
    return active === 'All'
      ? this.services
      : this.services.filter(s => s.category === active);
  });

  private readonly expandedIds = signal<Set<string>>(new Set());

  setCategory(category: string): void {
    this.activeCategory.set(category);
  }

  isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  toggleExpand(id: string): void {
    const next = new Set(this.expandedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.expandedIds.set(next);
  }

  trackById(_index: number, item: ServiceItem): string {
    return item.id;
  }
}
