import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppEmptyStateComponent } from '../../../shared/components/app-empty-state/app-empty-state.component';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { CrmAnalytics, DealRow, FollowUpRow, LeadRow, SegmentRow, StageRow, WorkspaceApiService, workspaceError } from '../workspace-api.service';

type CrmScreen = 'leads' | 'deals' | 'followups' | 'segments' | 'analytics';

@Component({
  selector: 'app-crm-page',
  standalone: true,
  imports: [FormsModule, AppCurrencyPipe, AppAlertComponent, AppBreadcrumbComponent, AppEmptyStateComponent, AppPageHeaderComponent, AppSkeletonComponent],
  templateUrl: './crm-page.component.html',
  styleUrl: '../people/workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrmPageComponent implements OnInit {
  private readonly api = inject(WorkspaceApiService);
  private readonly route = inject(ActivatedRoute);
  readonly screen = signal<CrmScreen>('leads');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly stages = signal<StageRow[]>([]);
  readonly leads = signal<LeadRow[]>([]);
  readonly deals = signal<DealRow[]>([]);
  readonly followUps = signal<FollowUpRow[]>([]);
  readonly segments = signal<SegmentRow[]>([]);
  readonly analytics = signal<CrmAnalytics | null>(null);
  lead = { name: '', companyName: '', email: '', source: 'Manual', priority: 'Normal', estimatedValue: 0, stageId: '' };
  deal = { title: '', customerId: '', value: 0, probability: 50, notes: '' };
  followUp = { title: '', dueAt: '', priority: 'Normal', notes: '' };
  segment = { name: '', customerType: '', industry: '', country: '', tag: '', minSpend: null as number | null };
  interaction = { customerId: '', channel: 'Note', summary: '' };

  ngOnInit(): void {
    this.screen.set((this.route.snapshot.data['screen'] as CrmScreen) ?? 'leads');
    this.reload();
  }

  title(): string {
    return { leads: 'Lead pipeline', deals: 'Deals', followups: 'Follow-ups', segments: 'Segments', analytics: 'CRM analytics' }[this.screen()];
  }

  leadsIn(stageId: string): LeadRow[] {
    return this.leads().filter((lead) => lead.stageId === stageId);
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    const done = () => this.loading.set(false);
    const fail = (error: unknown) => { this.error.set(workspaceError(error)); done(); };
    if (this.screen() === 'leads') {
      this.api.stages().subscribe({
        next: (stages) => {
          this.stages.set(stages);
          this.api.leads().subscribe({ next: (page) => { this.leads.set(page.items); done(); }, error: fail });
        },
        error: fail,
      });
      return;
    }
    if (this.screen() === 'deals') {
      this.api.deals().subscribe({ next: (page) => { this.deals.set(page.items); done(); }, error: fail });
      return;
    }
    if (this.screen() === 'followups') {
      this.api.followUps(false).subscribe({ next: (page) => { this.followUps.set(page.items); done(); }, error: fail });
      return;
    }
    if (this.screen() === 'segments') {
      this.api.segments().subscribe({ next: (rows) => { this.segments.set(rows); done(); }, error: fail });
      return;
    }
    this.api.analytics().subscribe({ next: (row) => { this.analytics.set(row); done(); }, error: fail });
  }

  saveLead(): void {
    this.run(() => this.api.saveLead({
      name: this.lead.name,
      companyName: this.lead.companyName || null,
      email: this.lead.email || null,
      phone: null,
      source: this.lead.source,
      priority: this.lead.priority,
      stageId: this.lead.stageId || null,
      assignedUserId: null,
      estimatedValue: Number(this.lead.estimatedValue),
      expectedCloseDate: null,
      notes: null,
    }));
  }

  move(lead: LeadRow, stageId: string): void {
    this.run(() => this.api.moveLead(lead.id, stageId));
  }

  convert(lead: LeadRow): void {
    this.run(() => this.api.convertLead(lead.id));
  }

  saveDeal(): void {
    this.run(() => this.api.saveDeal({
      title: this.deal.title,
      customerId: this.deal.customerId || null,
      leadId: null,
      stageId: null,
      assignedUserId: null,
      value: Number(this.deal.value),
      probability: Number(this.deal.probability),
      expectedCloseDate: null,
      notes: this.deal.notes || null,
    }));
  }

  win(deal: DealRow): void {
    this.run(() => this.api.winDeal(deal.id));
  }

  saveFollowUp(): void {
    this.run(() => this.api.saveFollowUp({
      title: this.followUp.title,
      dueAt: new Date(this.followUp.dueAt).toISOString(),
      priority: this.followUp.priority,
      assignedUserId: null,
      leadId: null,
      customerId: null,
      dealId: null,
      notes: this.followUp.notes || null,
    }));
  }

  complete(row: FollowUpRow): void {
    this.run(() => this.api.completeFollowUp(row.id));
  }

  saveSegment(): void {
    this.run(() => this.api.saveSegment({
      name: this.segment.name,
      customerType: this.segment.customerType || null,
      industry: this.segment.industry || null,
      country: this.segment.country || null,
      tag: this.segment.tag || null,
      minSpend: this.segment.minSpend,
      notes: null,
    }));
  }

  saveInteraction(): void {
    this.run(() => this.api.addInteraction({
      customerId: this.interaction.customerId,
      leadId: null,
      dealId: null,
      channel: this.interaction.channel,
      summary: this.interaction.summary,
      occurredAt: null,
    }));
  }

  private run(request: () => Observable<unknown>): void {
    this.saving.set(true);
    this.error.set(null);
    request().subscribe({
      next: () => { this.saving.set(false); this.reload(); },
      error: (error: unknown) => { this.saving.set(false); this.error.set(workspaceError(error)); },
    });
  }
}
