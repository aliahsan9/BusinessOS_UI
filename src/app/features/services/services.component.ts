import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
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
export class ServicesComponent implements OnInit, OnDestroy {

  // ---- Data -----------------------------------------------------------
  readonly services: ServiceItem[] = [
    {
      id: 'custom-software',
      icon: 'bi bi-code-slash',
      category: 'Web & Software',
      title: 'Custom Software Development',
      tagline: 'Systems built around how your business actually runs.',
      description:
        'Tailored software that replaces spreadsheets and manual workarounds with something built for the way your team works.',
      stack: ['ASP.NET Core', 'EF Core', 'SQL Server', 'Clean Architecture']
    },
    {
      id: 'web-apps',
      icon: 'bi bi-window-stack',
      category: 'Web & Software',
      title: 'Web Application Development',
      tagline: 'Fast, modern interfaces backed by solid APIs.',
      description:
        'Responsive, secure web applications built end-to-end — from the API layer to the last pixel in the browser.',
      stack: ['Angular', 'Angular Signals', 'RxJS', '.NET Core APIs']
    },
    {
      id: 'mobile',
      icon: 'bi bi-phone',
      category: 'Web & Software',
      title: 'Mobile-Ready Experiences',
      tagline: 'One codebase, every screen size.',
      description:
        'Interfaces that hold up from a small phone in one hand to a wide monitor at a desk, with no separate "mobile version" to maintain.',
      stack: ['Responsive UI', 'Progressive Web App', 'Cross-Device Testing', 'Accessibility']
    },
    {
      id: 'cloud-devops',
      icon: 'bi bi-cloud-arrow-up',
      category: 'Cloud & DevOps',
      title: 'Cloud & DevOps',
      tagline: 'Ship changes without holding your breath.',
      description:
        'Deployment pipelines and cloud infrastructure set up so releases are routine, not risky.',
      stack: ['Azure', 'CI/CD Pipelines', 'Docker', 'Monitoring & Logging']
    },
    {
      id: 'ai-automation',
      icon: 'bi bi-cpu',
      category: 'AI & Automation',
      title: 'AI & Automation',
      tagline: 'Put your data and workflows to work.',
      description:
        'Practical AI features — search, retrieval, and automation — wired into real workflows instead of bolted on as a demo.',
      stack: ['RAG Pipelines', 'Vector Search', 'LLM Integration', 'Workflow Automation']
    },
    {
      id: 'support',
      icon: 'bi bi-shield-check',
      category: 'Support',
      title: 'Maintenance & Support',
      tagline: 'Software that keeps working after launch day.',
      description:
        'Ongoing monitoring, fixes, and tuning so performance and security don\u2019t quietly decay after go-live.',
      stack: ['Bug Fixes', 'Uptime Monitoring', 'Security Patches', 'Performance Tuning']
    }
  ];

  // ---- Filtering state --------------------------------------------------
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

  setCategory(category: string): void {
    this.activeCategory.set(category);
  }

  // ---- Expand / collapse stack details ----------------------------------
  private readonly expandedIds = signal<Set<string>>(new Set());

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

  // ---- Hero terminal typing effect --------------------------------------
  readonly typedCommand = signal<string>('');
  private readonly fullCommand = 'services --list --stack=full';
  private typingHandle?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      this.typedCommand.set(this.fullCommand);
      return;
    }

    let charIndex = 0;
    this.typingHandle = setInterval(() => {
      charIndex++;
      this.typedCommand.set(this.fullCommand.slice(0, charIndex));
      if (charIndex >= this.fullCommand.length) {
        clearInterval(this.typingHandle);
      }
    }, 55);
  }

  ngOnDestroy(): void {
    if (this.typingHandle) {
      clearInterval(this.typingHandle);
    }
  }
}