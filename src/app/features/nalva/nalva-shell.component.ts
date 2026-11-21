import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-nalva-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './nalva-shell.component.html',
  styleUrl: './nalva-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaShellComponent {
  readonly links = [
    { label: 'Overview', route: ROUTES.nalva.base },
    { label: 'Command', route: ROUTES.nalva.command },
    { label: 'Marketplace', route: ROUTES.nalva.marketplace },
    { label: 'My agents', route: ROUTES.nalva.agents },
    { label: 'Marketing', route: ROUTES.nalva.marketing.base },
    { label: 'Tasks', route: ROUTES.nalva.tasks },
    { label: 'Workflows', route: ROUTES.nalva.workflows },
    { label: 'Builder', route: ROUTES.nalva.builder },
    { label: 'Automation', route: ROUTES.nalva.automation },
    { label: 'Integrations', route: ROUTES.nalva.integrations },
    { label: 'Approvals', route: ROUTES.nalva.approvals },
    { label: 'Support', route: ROUTES.nalva.support },
    { label: 'Sales Agent', route: ROUTES.nalva.salesAgent },
    { label: 'Procurement', route: ROUTES.nalva.procurement },
    { label: 'Knowledge', route: ROUTES.nalva.knowledge },
    { label: 'History', route: ROUTES.nalva.history },
    { label: 'Audit history', route: ROUTES.nalva.base + '/audit-history' },
    { label: 'Analytics', route: ROUTES.nalva.analytics },
    { label: 'Settings', route: ROUTES.nalva.settings },
  ];
}
