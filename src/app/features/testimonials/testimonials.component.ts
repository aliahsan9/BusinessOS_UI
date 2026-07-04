import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Testimonial {
  name: string;
  designation: string;
  image: string;
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
      image: 'https://i.pravatar.cc/150?img=12',
      review:
        'BusinessOS transformed how we manage inventory, sales, and finance. Everything is now centralized and effortless.',
    },
    {
      name: 'Sarah Williams',
      designation: 'Operations Manager',
      image: 'https://i.pravatar.cc/150?img=32',
      review:
        'The analytics dashboard gives us real-time visibility into business performance. Highly recommended.',
    },
    {
      name: 'David Chen',
      designation: 'Founder, SmartTech Solutions',
      image: 'https://i.pravatar.cc/150?img=15',
      review:
        'We replaced three different systems with BusinessOS. Productivity increased significantly within weeks.',
    },
    {
      name: 'Emma Rodriguez',
      designation: 'Finance Director',
      image: 'https://i.pravatar.cc/150?img=44',
      review:
        'From invoicing to expense tracking, everything feels professional, intuitive, and extremely reliable.',
    },
    {
      name: 'James Parker',
      designation: 'Managing Director',
      image: 'https://i.pravatar.cc/150?img=56',
      review:
        'The best investment we made this year. BusinessOS simplified our entire operational workflow.',
    },
    {
      name: 'Sophia Miller',
      designation: 'Business Consultant',
      image: 'https://i.pravatar.cc/150?img=47',
      review:
        'Clean interface, powerful features, and outstanding performance. Exactly what growing businesses need.',
    },
  ];
}