import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IntegrationConnectionRow,
  IntegrationLogRow,
  IntegrationProviderCard,
  NalvaService,
} from '../../core/services/nalva.service';

@Component({
  selector: 'app-nalva-integrations',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './integrations.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaIntegrationsComponent implements OnInit {
  private readonly api = inject(NalvaService);
  private readonly route = inject(ActivatedRoute);
  readonly providers = signal<IntegrationProviderCard[]>([]);
  readonly connections = signal<IntegrationConnectionRow[]>([]);
  readonly logs = signal<IntegrationLogRow[]>([]);
  readonly notice = signal<string | null>(null);
  readonly shop = signal('');
  readonly selectedConnectionId = signal<string | null>(null);
  readonly metadataJson = signal('{}');
  readonly webhookSecret = signal('');

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');
    const state = this.route.snapshot.queryParamMap.get('state');
    const provider = sessionStorage.getItem('nalva-integration-provider');
    if (code && state && provider) {
      this.api.completeIntegration(provider, code, state).subscribe({
        next: () => {
          sessionStorage.removeItem('nalva-integration-provider');
          this.notice.set('The provider returned a token. It is stored only on the server.');
          this.load();
        },
        error: () => this.notice.set('The provider did not complete the connection. Nothing was stored.'),
      });
      return;
    }
    this.load();
  }

  load(): void {
    this.api.integrationMarketplace().subscribe({ next: (rows) => this.providers.set(rows) });
    this.api.integrationConnections().subscribe({ next: (rows) => this.connections.set(rows) });
    this.api.integrationLogs().subscribe({ next: (rows) => this.logs.set(rows) });
  }

  selectConnection(connection: IntegrationConnectionRow): void {
    this.selectedConnectionId.set(connection.id);
    this.api.integrationLogs(connection.id).subscribe({ next: (rows) => this.logs.set(rows) });
  }

  connect(provider: IntegrationProviderCard): void {
    if (!provider.serverConfigured) {
      this.notice.set(provider.name + ' is not configured on the server. No connection was started.');
      return;
    }
    const redirectUri = window.location.origin + '/nalva/integrations/callback';
    this.api.beginIntegration(provider.key, redirectUri, this.shop() || undefined).subscribe({
      next: (result) => {
        if (!result.serverConfigured || !result.authorizationUrl) {
          this.notice.set(result.message);
          return;
        }
        sessionStorage.setItem('nalva-integration-provider', provider.key);
        window.location.assign(result.authorizationUrl);
      },
      error: () => this.notice.set('Authorization could not be started.'),
    });
  }

  reauthorize(provider: IntegrationProviderCard): void {
    this.connect(provider);
  }

  test(provider: IntegrationProviderCard): void {
    if (!provider.connectionId) return;
    this.api.testIntegration(provider.connectionId).subscribe({
      next: (result) => this.notice.set(provider.name + ': ' + result.message),
      error: () => this.notice.set(provider.name + ' test failed before a provider call completed.'),
    });
  }

  disconnect(provider: IntegrationProviderCard): void {
    if (!provider.connectionId) return;
    this.api.disconnectIntegration(provider.connectionId).subscribe({
      next: () => {
        this.notice.set(provider.name + ' was disconnected and its tokens were removed.');
        this.load();
      },
    });
  }

  saveMetadata(): void {
    const id = this.selectedConnectionId();
    if (!id) {
      this.notice.set('Select a connection before saving metadata.');
      return;
    }
    this.api.updateIntegrationMetadata(id, this.metadataJson()).subscribe({
      next: () => {
        this.notice.set('Connection metadata was saved.');
        this.load();
      },
      error: () => this.notice.set('Metadata could not be saved.'),
    });
  }

  saveWebhookSecret(): void {
    const id = this.selectedConnectionId();
    if (!id) {
      this.notice.set('Select a connection before saving a webhook secret.');
      return;
    }
    if (!this.webhookSecret().trim()) {
      this.notice.set('Enter a webhook secret.');
      return;
    }
    this.api.setIntegrationWebhookSecret(id, this.webhookSecret().trim()).subscribe({
      next: () => {
        this.webhookSecret.set('');
        this.notice.set('Webhook secret was stored encrypted on the server.');
        this.load();
      },
      error: () => this.notice.set('Webhook secret could not be saved.'),
    });
  }

  needsReauth(provider: IntegrationProviderCard): boolean {
    return provider.connectionStatus === 'NeedsReauth';
  }
}
