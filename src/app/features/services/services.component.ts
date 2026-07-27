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
