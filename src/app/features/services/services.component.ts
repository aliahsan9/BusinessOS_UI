import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-services',
  imports:[CommonModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent {

  services = [
    {
      icon: 'bi bi-code-slash',
      title: 'Custom Software Development',
      description:
        'Tailored software solutions designed to streamline operations and accelerate business growth.',
      features: [
        'Enterprise Applications',
        'Business Automation',
        'Scalable Architecture'
      ]
    },
    {
      icon: 'bi bi-window-stack',
      title: 'Web Application Development',
      description:
        'Modern, responsive, and secure web applications built with the latest technologies.',
      features: [
        'Angular Development',
        '.NET Backend APIs',
        'SEO Optimized'
      ]
    },
    {
      icon: 'bi bi-phone',
      title: 'Mobile App Solutions',
      description:
        'Cross-platform mobile applications delivering exceptional user experiences.',
      features: [
        'Android & iOS',
        'Responsive UI',
        'High Performance'
      ]
    },
    {
      icon: 'bi bi-cloud-arrow-up',
      title: 'Cloud & DevOps',
      description:
        'Reliable cloud infrastructure and deployment pipelines for modern businesses.',
      features: [
        'Azure Deployment',
        'CI/CD Pipelines',
        'Cloud Optimization'
      ]
    },
    {
      icon: 'bi bi-cpu',
      title: 'AI & Automation',
      description:
        'Intelligent solutions leveraging AI, automation, and data-driven workflows.',
      features: [
        'AI Integrations',
        'RAG Solutions',
        'Workflow Automation'
      ]
    },
    {
      icon: 'bi bi-shield-check',
      title: 'Maintenance & Support',
      description:
        'Ongoing maintenance, security updates, and performance optimization.',
      features: [
        'Bug Fixes',
        'Monitoring',
        'Performance Tuning'
      ]
    }
  ];

}