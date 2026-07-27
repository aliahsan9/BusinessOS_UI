import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  label: string;
  icon: string;
}

interface FaqHighlight {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent {
  readonly categories: FaqCategory[] = [
    { id: 'all', label: 'All', icon: 'bi-grid' },
    { id: 'getting-started', label: 'Getting started', icon: 'bi-rocket-takeoff' },
    { id: 'platform', label: 'Platform', icon: 'bi-layers' },
    { id: 'billing', label: 'Billing', icon: 'bi-credit-card' },
    { id: 'security', label: 'Security', icon: 'bi-shield-check' },
  ];

  readonly highlights: FaqHighlight[] = [
    {
      icon: 'bi-box-seam',
      title: 'What you get',
      description: 'Inventory, sales, CRM, finance, analytics, and secure team access in one place.',
    },
    {
      icon: 'bi-clock',
      title: 'Time to value',
      description: 'Most teams are productive within a day — guided onboarding, no empty dashboard.',
    },
    {
      icon: 'bi-shield-lock',
      title: 'Trust & control',
      description: 'Role-based access, encrypted sessions, and a clear privacy policy.',
    },
    {
      icon: 'bi-headset',
      title: 'Real support',
      description: 'Human replies within one business day — not a bot wall before help.',
    },
  ];

  readonly faqs: FaqItem[] = [
    {
      id: 'what-is',
      category: 'getting-started',
      question: 'What is BusinessOS?',
      answer:
        'BusinessOS is a business management platform that connects inventory, sales, customers, finance, analytics, and team access in one secure dashboard. Instead of juggling spreadsheets and separate apps, your team works from the same live data.',
    },
    {
      id: 'who-for',
      category: 'getting-started',
      question: 'Who is BusinessOS built for?',
      answer:
        'Growing businesses that need clearer operations — retailers, distributors, service teams, and multi-location companies that have outgrown spreadsheets and want one system for stock, orders, customers, and cash flow.',
    },
    {
      id: 'how-helps',
      category: 'getting-started',
      question: 'How does BusinessOS help my business grow?',
      answer:
        'It removes the busywork between tools. Sales update stock and invoices automatically, CRM keeps one customer timeline, and leaders see live KPIs — so teams spend time serving customers instead of rebuilding reports.',
    },
    {
      id: 'trial',
      category: 'getting-started',
      question: 'Is there a free trial? Do I need a credit card?',
      answer:
        'Yes. You can start a free trial without a credit card. Explore the modules, invite teammates with the right roles, and decide if BusinessOS fits before you commit to a paid plan.',
    },
    {
      id: 'setup-time',
      category: 'getting-started',
      question: 'How long does it take to get started?',
      answer:
        'Most teams are productive within a day. Create your account, add your first products or customers, and invite your team. Our onboarding flow guides you through the essentials so you are not left staring at an empty dashboard.',
    },
    {
      id: 'modules',
      category: 'platform',
      question: 'Which modules are included?',
      answer:
        'Inventory, sales & orders, suppliers & purchasing, customer CRM, finance & cash flow, analytics & reporting, team collaboration, and security with role-based access. Everything stays connected — a sale updates stock, invoices, and dashboards automatically.',
    },
    {
      id: 'integrations',
      category: 'platform',
      question: 'Can my team use BusinessOS together?',
      answer:
        'Yes. Invite teammates with role-based permissions so each person sees only what they need — warehouse staff, sales, finance, or leadership. Shared live data means fewer handoff mistakes and less duplicate entry.',
    },
    {
      id: 'data-import',
      category: 'platform',
      question: 'Can I bring existing customers and products over?',
      answer:
        'Yes. You can add records manually or import in batches during setup. If you have a large catalog or customer list, contact us and we will help you plan a clean migration so you start with accurate data.',
    },
    {
      id: 'mobile',
      category: 'platform',
      question: 'Does BusinessOS work on phones and tablets?',
      answer:
        'Yes. The marketing site and app layouts are built to be responsive. Your team can review dashboards, check stock alerts, and follow up on customers from desktop or mobile browsers.',
    },
    {
      id: 'pricing',
      category: 'billing',
      question: 'How does pricing work?',
      answer:
        'Plans are based on team size and the modules you need. Start with a trial, then choose a plan that matches your operations. Contact sales if you need a custom rollout, training, or multi-location setup.',
    },
    {
      id: 'cancel',
      category: 'billing',
      question: 'Can I cancel or change plans later?',
      answer:
        'Yes. You can upgrade, downgrade, or cancel as your business changes. We believe trust means no lock-in tricks — your data remains yours, and you can export what you need if you leave.',
    },
    {
      id: 'security-data',
      category: 'security',
      question: 'How do you protect our business data?',
      answer:
        'We use encrypted connections, secure authentication, and role-based access controls. Sensitive actions are scoped to permissions so the right people see the right modules — and nothing else.',
    },
    {
      id: 'who-sees-data',
      category: 'security',
      question: 'Who can see our company data?',
      answer:
        'Only authorized users in your organization, based on the roles you assign. BusinessOS is built so tenant data stays isolated. We do not sell your business data to third parties.',
    },
    {
      id: 'support',
      category: 'getting-started',
      question: 'How do I get help if something goes wrong?',
      answer:
        'Reach us by email or the contact form — real people respond within one business day on weekdays. For urgent access or security questions, use the contact channels on our Contact page.',
    },
  ];

  readonly activeCategory = signal('all');
  readonly openId = signal<string | null>(this.faqs[0]?.id ?? null);

  filteredFaqs(): FaqItem[] {
    const cat = this.activeCategory();
    return cat === 'all' ? this.faqs : this.faqs.filter((f) => f.category === cat);
  }

  setCategory(id: string): void {
    this.activeCategory.set(id);
    const first = this.filteredFaqs()[0];
    this.openId.set(first?.id ?? null);
  }

  toggle(id: string): void {
    this.openId.update((current) => (current === id ? null : id));
  }

  isOpen(id: string): boolean {
    return this.openId() === id;
  }
}
