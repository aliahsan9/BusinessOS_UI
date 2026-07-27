import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-home-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isScrolled = signal(false);
  isSidebarOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Home', route: '/', icon: 'bi-house' },
    { label: 'About', route: '/about', icon: 'bi-building' },
    { label: 'Services', route: '/services', icon: 'bi-layers' },
    { label: 'Contact', route: '/contact', icon: 'bi-envelope' }
  ];

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled.set(window.scrollY > 20);
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update(value => !value);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
  }
}