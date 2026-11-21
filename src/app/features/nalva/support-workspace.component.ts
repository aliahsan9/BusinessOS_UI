import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NalvaService } from '../../core/services/nalva.service';
import { ApiError } from '../../core/models/api-error.model';
import { SupportOverview, SupportTicketDetail, SupportTicketListItem } from '../../core/models/support.model';

@Component({
  selector: 'app-nalva-support-workspace',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './support-workspace.component.html',
  styleUrls: ['./nalva.shared.scss', './support-workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaSupportWorkspaceComponent implements OnInit {
  private readonly api = inject(NalvaService);
  private readonly route = inject(ActivatedRoute);

  readonly overview = signal<SupportOverview | null>(null);
  readonly tickets = signal<SupportTicketListItem[]>([]);
  readonly selected = signal<SupportTicketDetail | null>(null);
  readonly loading = signal(true);
  readonly working = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly statusFilter = signal<string>('');
  readonly replyDraft = signal('');
  readonly sandboxBody = signal('What is your return policy?');

  ngOnInit(): void {
    const ticketId = this.route.snapshot.queryParamMap.get('ticket');
    this.reload(ticketId);
  }

  reload(selectId?: string | null): void {
    this.loading.set(true);
    this.error.set(null);
    const status = this.statusFilter() || undefined;
    this.api.supportOverview().subscribe({
      next: (overview) => this.overview.set(overview),
      error: (err: ApiError) => this.error.set(err.detail || err.title || 'Could not load support overview.'),
    });
    this.api.supportTickets(status).subscribe({
      next: (rows) => {
        this.tickets.set(rows);
        this.loading.set(false);
        const pick = selectId || rows[0]?.id;
        if (pick) this.openTicket(pick);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not load support tickets.');
        this.loading.set(false);
      },
    });
  }

  setStatusFilter(value: string): void {
    this.statusFilter.set(value);
    this.reload(this.selected()?.id);
  }

  openTicket(id: string): void {
    this.api.supportTicket(id).subscribe({
      next: (ticket) => {
        this.selected.set(ticket);
        this.replyDraft.set('');
      },
      error: (err: ApiError) => this.error.set(err.detail || err.title || 'Could not load ticket.'),
    });
  }

  sendSandbox(): void {
    if (this.working()) return;
    this.working.set(true);
    this.notice.set(null);
    this.api.supportInbound({
      channel: 'sandbox',
      body: this.sandboxBody(),
      subject: 'Sandbox inquiry',
      processWithAgent: true,
      idempotencyKey: `ui-sandbox-${Date.now()}`,
    }).subscribe({
      next: (result) => {
        this.notice.set(result.summary);
        this.working.set(false);
        this.reload(result.ticketId);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Inbound processing failed.');
        this.working.set(false);
      },
    });
  }

  reply(sendToCustomer = true): void {
    const ticket = this.selected();
    const body = this.replyDraft().trim();
    if (!ticket || !body || this.working()) return;
    this.working.set(true);
    this.api.supportReply(ticket.id, body, {
      sendToCustomer,
      isInternalNote: !sendToCustomer,
      channel: ticket.channel,
    }).subscribe({
      next: () => {
        this.working.set(false);
        this.notice.set(sendToCustomer ? 'Reply submitted to the channel adapter.' : 'Internal note saved.');
        this.openTicket(ticket.id);
        this.reload(ticket.id);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Reply failed.');
        this.working.set(false);
      },
    });
  }

  escalate(): void {
    const ticket = this.selected();
    if (!ticket || this.working()) return;
    this.working.set(true);
    this.api.supportEscalate(ticket.id, 'Owner requested escalation from the Support workspace.', ticket.recommendedAction || undefined).subscribe({
      next: (updated) => {
        this.selected.set(updated);
        this.working.set(false);
        this.notice.set('Ticket escalated.');
        this.reload(updated.id);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Escalation failed.');
        this.working.set(false);
      },
    });
  }

  resolve(): void {
    const ticket = this.selected();
    if (!ticket || this.working()) return;
    this.working.set(true);
    this.api.supportResolve(ticket.id, 'Resolved from Support workspace.').subscribe({
      next: (updated) => {
        this.selected.set(updated);
        this.working.set(false);
        this.notice.set('Ticket resolved.');
        this.reload(updated.id);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Resolve failed.');
        this.working.set(false);
      },
    });
  }

  takeover(enabled: boolean): void {
    const ticket = this.selected();
    if (!ticket || this.working()) return;
    this.working.set(true);
    this.api.supportTakeover(ticket.id, enabled, enabled ? 'Human takeover enabled.' : 'AI handling resumed.').subscribe({
      next: (updated) => {
        this.selected.set(updated);
        this.working.set(false);
        this.notice.set(enabled ? 'Human takeover enabled.' : 'AI handling resumed.');
        this.reload(updated.id);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Takeover failed.');
        this.working.set(false);
      },
    });
  }
}
