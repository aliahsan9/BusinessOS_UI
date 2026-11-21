import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../navbar/navbar.component';
import { FooterComponent } from '../../footer/footer.component';

@Component({
  selector: 'app-security-page',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  templateUrl: './security-page.component.html',
  styleUrl: './security-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SecurityPageComponent {
  readonly pillars = [
    {
      title: 'Tenant isolation',
      body: 'Company records are scoped by tenant context and global query filters. Cross-tenant reads are treated as defects, not features.',
    },
    {
      title: 'Authentication',
      body: 'Password login, Google sign-in, rotating refresh tokens, revocation, and login rate limits protect account access.',
    },
    {
      title: 'Authorization',
      body: 'Role and permission checks run on the API. UI menus are convenience only and never the source of truth.',
    },
    {
      title: 'Billing safety',
      body: 'Paid status is set after verified payment webhooks or reconciliation. The browser success page is not payment proof.',
    },
    {
      title: 'AI controls',
      body: 'Agent tools respect permissions, approval policies, and plan entitlements. Usage and estimated cost are tracked per company.',
    },
    {
      title: 'Data rights',
      body: 'Companies can request export and deletion through the product. Enterprise contracts may require a signed DPA.',
    },
  ];
}
