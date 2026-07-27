import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Testimonial {
  name: string;
  designation: string;
  initials: string;
  rating: number;
  review: string;
}

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrls: ['./testimonials.component.scss'],
})
export class TestimonialsComponent {
  testimonials: Testimonial[] = [
    {
      name: 'Michael Anderson',
      designation: 'CEO, Apex Traders',
      initials: 'MA',
      rating: 5,
      review:
        'BusinessOS transformed how we manage inventory, sales, and finance. Everything is centralized and our team finally works from the same source of truth.',
    },
    {
      name: 'Sarah Williams',
      designation: 'Operations Manager, Northline Retail',
      initials: 'SW',
      rating: 5,
      review:
        'The analytics dashboard gives us real-time visibility into performance. We catch issues early instead of discovering them at month-end.',
    },
    {
      name: 'David Chen',
      designation: 'Founder, SmartTech Solutions',
      initials: 'DC',
      rating: 5,
      review:
        'We replaced three separate systems with BusinessOS. Productivity improved within weeks, and onboarding new staff became far simpler.',
    },
    {
      name: 'Emma Rodriguez',
      designation: 'Finance Director, Harbor Goods',
      initials: 'ER',
      rating: 5,
      review:
        'From invoicing to expense tracking, the finance tools feel professional, reliable, and tightly connected to live order data.',
    },
    {
      name: 'James Parker',
      designation: 'Managing Director, Parker Supply',
      initials: 'JP',
      rating: 5,
      review:
        'The best operational investment we made this year. BusinessOS simplified our workflow without forcing us into a rigid process.',
    },
    {
      name: 'Sophia Miller',
      designation: 'Business Consultant',
      initials: 'SM',
      rating: 5,
      review:
        'Clean interface, strong permissions, and clear reporting. Exactly what growing businesses need when they outgrow spreadsheets.',
    },
  ];
}
