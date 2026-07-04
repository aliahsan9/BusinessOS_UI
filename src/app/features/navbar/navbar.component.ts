import {
  Component,
  HostListener,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  fragment: string;
}

@Component({
  selector: 'app-home-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  isScrolled = signal(false);
  isSidebarOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Home', fragment: 'home' },
    { label: 'About', fragment: 'about' },
    { label: 'Services', fragment: 'services' },
    { label: 'Contact', fragment: 'contact' },
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 30);
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update((state) => !state);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }

  scrollToSection(fragment: string): void {
    const element = document.getElementById(fragment);

    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    this.closeSidebar();
  }
}