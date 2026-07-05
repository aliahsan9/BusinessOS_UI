import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';

import {
  RouterOutlet
} from '@angular/router';
import { FooterComponent } from '../../../features/footer/footer.component';
import { NavbarComponent } from '../../../features/navbar/navbar.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent ,FooterComponent],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthLayoutComponent {}