import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROUTES } from '../../../core/constants/route.constants';
import { ApiError } from '../../../core/models/api-error.model';
import { ConnectedAccount } from '../../../core/models/marketing.model';
import { IntegrationProviderCard, NalvaService } from '../../../core/services/nalva.service';
import { MarketingService } from '../../../core/services/marketing.service';

const MARKETING_PROVIDERS = new Set(['meta', 'linkedin', 'facebook']);
const UNAVAILABLE_PLATFORMS = [
  { key: 'instagram', name: 'Instagram', reason: 'Not implemented — publishing is unavailable.' },
  { key: 'tiktok', name: 'TikTok', reason: 'Not implemented — publishing is unavailable.' },
  { key: 'youtube', name: 'YouTube', reason: 'Not implemented — publishing is unavailable.' },
] as const;

@Component({
  selector: 'app-marketing-accounts',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './marketing-accounts.component.html',
  styleUrls: ['../nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketingAccountsComponent implements OnInit {
  private readonly marketing = inject(MarketingService);
  private readonly nalva = inject(NalvaService);

  readonly routes = ROUTES;
  readonly accounts = signal<ConnectedAccount[]>([]);
  readonly unavailable = UNAVAILABLE_PLATFORMS;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly source = signal<'marketing' | 'integrations'>('marketing');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.marketing.accounts().subscribe({
      next: (rows) => {
        this.source.set('marketing');
        this.accounts.set(rows ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.source.set('integrations');
        this.nalva.integrationMarketplace().subscribe({
          next: (rows) => {
            this.accounts.set(this.fromIntegrations(rows));
            this.loading.set(false);
          },
          error: (err: ApiError) => {
            this.error.set(err.detail || err.title || 'Could not load marketing accounts.');
            this.loading.set(false);
          },
        });
      },
    });
  }

  displayName(account: ConnectedAccount): string {
    return account.externalAccountLabel || account.externalAccountId || account.provider;
  }

  publishNote(account: ConnectedAccount): string {
    return account.notes
      || (account.publishAvailable ? 'Publish available when connected.' : 'Publish unavailable.');
  }

  private fromIntegrations(rows: IntegrationProviderCard[]): ConnectedAccount[] {
    return (rows ?? [])
      .filter((row) => MARKETING_PROVIDERS.has(row.key.toLowerCase()) || row.category?.toLowerCase() === 'marketing')
      .map((row) => ({
        provider: row.key,
        connectionId: row.connectionId,
        status: row.connectionStatus || 'unknown',
        externalAccountLabel: row.name,
        publishAvailable: row.writeOperations?.some((op) => /publish|post/i.test(op)) ?? false,
        notes: row.implementationStatus || 'See Nalva integrations.',
      }));
  }
}
