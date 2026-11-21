import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NalvaService } from '../../core/services/nalva.service';
import { ApiError } from '../../core/models/api-error.model';
import { SalesAgentCommandCenter, SalesCampaignReport } from '../../core/models/sales-agent.model';

@Component({
  selector: 'app-nalva-sales-agent-command-center',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './sales-agent-command-center.component.html',
  styleUrls: ['./nalva.shared.scss', './sales-agent-command-center.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaSalesAgentCommandCenterComponent implements OnInit {
  private readonly api = inject(NalvaService);

  readonly center = signal<SalesAgentCommandCenter | null>(null);
  readonly report = signal<SalesCampaignReport | null>(null);
  readonly loading = signal(true);
  readonly working = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly objective = signal('Find 50 potential international customers for my software development agency who may need .NET and Angular development services.');
  readonly targetCount = signal(10);
  readonly allowFixture = signal(true);
  readonly dailyLimit = signal(10);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.salesCommandCenter().subscribe({
      next: (center) => {
        this.center.set(center);
        this.allowFixture.set(center.settings.allowFixtureResearch);
        this.dailyLimit.set(center.settings.dailyResearchLimit);
        if (center.currentObjective) this.objective.set(center.currentObjective);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not load the Sales Agent command center.');
        this.loading.set(false);
      },
    });
    this.api.salesCampaignReport().subscribe({
      next: (report) => this.report.set(report),
      error: () => this.report.set(null),
    });
  }

  saveSettings(): void {
    if (this.working()) return;
    this.working.set(true);
    this.api.saveSalesSettings({
      allowFixtureResearch: this.allowFixture(),
      dailyResearchLimit: this.dailyLimit(),
      researchProviderKey: this.allowFixture() ? 'fixture' : null,
    }).subscribe({
      next: () => {
        this.notice.set('Sales Agent settings saved.');
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not save settings.');
        this.working.set(false);
      },
    });
  }

  assignObjective(): void {
    const text = this.objective().trim();
    if (!text || this.working()) return;
    this.working.set(true);
    this.notice.set(null);
    this.api.assignSalesObjective({
      objective: text,
      targetProspectCount: this.targetCount(),
      queueExecution: true,
    }).subscribe({
      next: (row) => {
        this.notice.set(`Objective assigned (${row.id}). Research will use the connected provider or enabled fixture.`);
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not assign objective.');
        this.working.set(false);
      },
    });
  }

  pause(): void {
    if (this.working()) return;
    this.working.set(true);
    this.api.pauseSalesAgent().subscribe({
      next: () => {
        this.notice.set('Sales Agent paused.');
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Pause failed.');
        this.working.set(false);
      },
    });
  }

  resume(): void {
    if (this.working()) return;
    this.working.set(true);
    this.api.resumeSalesAgent().subscribe({
      next: () => {
        this.notice.set('Sales Agent resumed.');
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Resume failed.');
        this.working.set(false);
      },
    });
  }

}
