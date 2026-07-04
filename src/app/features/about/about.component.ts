import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ServicesComponent } from "../services/services.component";

interface Stat {
  value: string;
  label: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, ServicesComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent {
  readonly stats: Stat[] = [
    {
      value: '10K+',
      label: 'Businesses Managed',
    },
    {
      value: '99.9%',
      label: 'Platform Uptime',
    },
    {
      value: '50M+',
      label: 'Transactions Processed',
    },
    {
      value: '24/7',
      label: 'Business Monitoring',
    },
  ];
}