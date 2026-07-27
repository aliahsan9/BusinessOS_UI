import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { NavbarComponent } from '../navbar/navbar.component';

interface ContactChannel {
  icon: string;
  title: string;
  value: string;
  href: string;
}

interface HelpTopic {
  icon: string;
  title: string;
  description: string;
  link: string;
  linkLabel: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  private fb = inject(FormBuilder);

  submitted = signal(false);

  readonly channels: ContactChannel[] = [
    {
      icon: 'bi-envelope',
      title: 'Email',
      value: 'support@businessos.com',
      href: 'mailto:support@businessos.com'
    },
    {
      icon: 'bi-telephone',
      title: 'Phone',
      value: '+92 300 1234567',
      href: 'tel:+923001234567'
    },
    {
      icon: 'bi-geo-alt',
      title: 'Office',
      value: 'Faisalabad, Pakistan',
      href: '#'
    }
  ];

  readonly helpTopics: HelpTopic[] = [
    {
      icon: 'bi-question-circle',
      title: 'Common questions',
      description:
        'Trials, modules, team access, billing, and setup — answered in plain language.',
      link: '/faq',
      linkLabel: 'Browse FAQ',
    },
    {
      icon: 'bi-shield-check',
      title: 'Privacy & data',
      description:
        'How we collect, use, and protect business information — without selling your records.',
      link: '/privacy',
      linkLabel: 'Read privacy policy',
    },
    {
      icon: 'bi-layers',
      title: 'What we offer',
      description:
        'Inventory, sales, CRM, finance, analytics, and secure access — see each service in detail.',
      link: '/services',
      linkLabel: 'Explore services',
    },
  ];

  contactForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: [''],
    subject: ['', Validators.required],
    message: ['', Validators.required]
  });

  submit(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    console.log(this.contactForm.value);
    this.contactForm.reset();
    this.submitted.set(true);
  }
}
