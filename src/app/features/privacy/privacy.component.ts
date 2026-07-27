import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FooterComponent } from '../footer/footer.component';

interface PrivacyPrinciple {
  icon: string;
  title: string;
  description: string;
}

interface PrivacySection {
  id: string;
  icon: string;
  title: string;
  summary: string;
  points: string[];
}

interface ComplianceBadge {
  icon: string;
  label: string;
  detail: string;
}

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
})
export class PrivacyComponent {
  readonly lastUpdated = 'July 27, 2026';

  readonly principles: PrivacyPrinciple[] = [
    {
      icon: 'bi-eye-slash',
      title: 'We do not sell your data',
      description:
        'Your business records stay yours. We never sell customer lists, inventory, or financial data to advertisers or brokers.',
    },
    {
      icon: 'bi-lock',
      title: 'Encrypted in transit',
      description:
        'Connections to BusinessOS use modern encryption so login sessions and business data are protected on the wire.',
    },
    {
      icon: 'bi-person-lock',
      title: 'You control access',
      description:
        'Role-based permissions let you decide who sees inventory, finance, customers, or admin settings — and who does not.',
    },
    {
      icon: 'bi-building-check',
      title: 'Tenant isolation',
      description:
        'Each organization’s data is scoped to that account. Teammates outside your business cannot browse your records.',
    },
  ];

  readonly sections: PrivacySection[] = [
    {
      id: 'collect',
      icon: 'bi-collection',
      title: 'What we collect',
      summary: 'Only what we need to run your account and improve the product.',
      points: [
        'Account details you provide — name, work email, company name, and role.',
        'Business data you enter — products, customers, orders, invoices, and related records.',
        'Usage signals such as feature activity and device/browser type, used to keep the platform reliable.',
        'Support messages you send when you contact us for help.',
      ],
    },
    {
      id: 'use',
      icon: 'bi-gear',
      title: 'How we use information',
      summary: 'To operate BusinessOS, support you, and keep the service secure.',
      points: [
        'Provide and improve inventory, sales, CRM, finance, and analytics features.',
        'Authenticate users, enforce permissions, and prevent unauthorized access.',
        'Send transactional emails such as invites, password resets, and billing notices.',
        'Respond to support requests and diagnose reliability issues.',
      ],
    },
    {
      id: 'share',
      icon: 'bi-share',
      title: 'When we share data',
      summary: 'We share only when necessary to run the service — never for sale.',
      points: [
        'Infrastructure providers that host or deliver the application under confidentiality obligations.',
        'Payment processors when you subscribe to a paid plan (they handle card details, not us).',
        'Legal authorities when required by law or to protect users from abuse or fraud.',
        'With your explicit direction — for example, when you invite a teammate or export data.',
      ],
    },
    {
      id: 'rights',
      icon: 'bi-hand-thumbs-up',
      title: 'Your rights and choices',
      summary: 'You stay in control of your account and business records.',
      points: [
        'Access and update profile and company information from your account settings.',
        'Invite, remove, or change roles for teammates at any time.',
        'Request export of your business data or deletion of your account.',
        'Opt out of non-essential product emails while still receiving critical account notices.',
      ],
    },
    {
      id: 'retention',
      icon: 'bi-hourglass-split',
      title: 'Retention and deletion',
      summary: 'We keep data only as long as your account needs it.',
      points: [
        'Active account data is retained while your organization uses BusinessOS.',
        'After account closure, we delete or anonymize business data within a reasonable period, unless law requires longer retention.',
        'Backups may persist briefly for disaster recovery, then age out on schedule.',
        'You can request earlier deletion by contacting support.',
      ],
    },
    {
      id: 'cookies',
      icon: 'bi-sliders',
      title: 'Cookies and similar tech',
      summary: 'We use essential cookies to keep you signed in and the product reliable.',
      points: [
        'Essential cookies support login sessions, security, and basic site function.',
        'We may use limited analytics to understand feature usage and improve reliability.',
        'We do not use advertising trackers to sell or profile your business records.',
        'You can control non-essential cookies in your browser settings where available.',
      ],
    },
    {
      id: 'contact-privacy',
      icon: 'bi-envelope-open',
      title: 'Privacy questions',
      summary: 'Reach a human if anything here is unclear.',
      points: [
        'Email support@businessos.com with “Privacy” in the subject line.',
        'Use the Contact page for general questions about security or compliance.',
        'We aim to respond within one business day on weekdays.',
        'For account access issues, include the work email tied to your organization.',
      ],
    },
  ];

  readonly badges: ComplianceBadge[] = [
    {
      icon: 'bi-shield-lock-fill',
      label: 'Secure login',
      detail: 'Authenticated sessions with protected credentials',
    },
    {
      icon: 'bi-key-fill',
      label: 'Role-based access',
      detail: 'Module-level permissions for every teammate',
    },
    {
      icon: 'bi-hdd-network-fill',
      label: 'Isolated tenants',
      detail: 'Organization data stays within your account',
    },
    {
      icon: 'bi-clipboard-check-fill',
      label: 'Audit-minded',
      detail: 'Access scoped for accountability and control',
    },
  ];
}
