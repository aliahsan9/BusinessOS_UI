import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaModel, NalvaSettings } from '../../core/models/nalva.model';

@Component({
  selector: 'app-nalva-settings',
  standalone: true,
  imports: [],
  templateUrl: './settings.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaSettingsComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly settings = signal<NalvaSettings | null>(null);
  readonly models = signal<NalvaModel[]>([]);
  readonly notice = signal<string | null>(null);

  ngOnInit(): void {
    this.api.settings().subscribe({ next: (value) => this.settings.set(value) });
    this.api.models().subscribe({ next: (rows) => this.models.set(rows) });
  }

  save(): void {
    const current = this.settings();
    if (!current) return;
    this.api.saveSettings({
      defaultModel: current.defaultModel,
      embeddingModel: current.embeddingModel,
      temperature: current.temperature,
      monthlyTokenBudget: current.monthlyTokenBudget,
      monthlyBudgetUsd: current.monthlyBudgetUsd,
      dailyExecutionLimit: current.dailyExecutionLimit,
      alertThresholdPercent: current.alertThresholdPercent,
      autonomyCeiling: current.autonomyCeiling,
    }).subscribe({
      next: (value) => { this.settings.set(value); this.notice.set('Settings saved. API keys stay on the server.'); },
    });
  }

  patch(partial: Partial<NalvaSettings>): void {
    const current = this.settings();
    if (current) this.settings.set({ ...current, ...partial });
  }
}
