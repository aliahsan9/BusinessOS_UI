import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROUTES } from '../../../core/constants/route.constants';

@Component({
  selector: 'app-marketing-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './marketing-shell.component.html',
  styleUrl: './marketing-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketingShellComponent {
  readonly links = [
    { label: 'Overview', route: ROUTES.nalva.marketing.overview },
    { label: 'Calendar', route: ROUTES.nalva.marketing.calendar },
    { label: 'Studio', route: ROUTES.nalva.marketing.studio },
    { label: 'Campaigns', route: ROUTES.nalva.marketing.campaigns },
    { label: 'Accounts', route: ROUTES.nalva.marketing.accounts },
  ];
}
