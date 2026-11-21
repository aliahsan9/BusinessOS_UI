import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppChartComponent } from '../../shared/components/app-chart/app-chart.component';
import { ChartDataResponse } from '../../core/models/dashboard.model';
import { ApiError } from '../../core/models/api-error.model';
import {
  BiRecommendation,
  DecisionBrief,
  ExecutiveDashboard,
} from '../../core/models/executive-intelligence.model';
import { NalvaService } from '../../core/services/nalva.service';

@Component({
  selector: 'app-nalva-executive-intelligence',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule, AppChartComponent],
  templateUrl: './executive-intelligence.component.html',
  styleUrls: ['./nalva.shared.scss', './executive-intelligence.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaExecutiveIntelligenceComponent implements OnInit {
  private readonly api = inject(NalvaService);

  readonly dashboard = signal<ExecutiveDashboard | null>(null);
  readonly brief = signal<DecisionBrief | null>(null);
  readonly loading = signal(true);
  readonly asking = signal(false);
  readonly working = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly period = signal('month');
  readonly question = signal('How is my business performing?');

  readonly revenueChart = computed<ChartDataResponse | null>(() => {
    const d = this.dashboard();
    if (!d) return null;
    const history = d.revenueForecast.history.slice(-8);
    const forecastPts = d.revenueForecast.available ? d.revenueForecast.horizon : [];
    const labels = [
      ...history.map((h) => new Date(h.periodStart).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })),
      ...forecastPts.map((h) => `Est ${new Date(h.periodStart).toLocaleDateString(undefined, { month: 'short' })}`),
    ];
    const actualData = [...history.map((h) => h.actualValue), ...forecastPts.map(() => Number.NaN)];
    const predictedData = [
      ...history.slice(0, -1).map(() => Number.NaN),
      ...(history.length ? [history[history.length - 1].actualValue] : []),
      ...forecastPts.map((h) => h.predictedValue),
    ];
    while (predictedData.length < labels.length) predictedData.unshift(Number.NaN);
    return {
      chartType: 'line',
      title: 'Historical vs predicted revenue',
      labels,
      datasets: [
        { label: 'Actual revenue', data: actualData, chartStyle: 'line' },
        { label: 'Predicted (estimate)', data: predictedData.slice(-labels.length), chartStyle: 'line' },
      ],
      dateRange: {
        startDate: d.periodComparison.currentStart,
        endDate: d.periodComparison.currentEnd,
        period: d.health.period,
      },
      currency: d.health.currency,
    };
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.executiveDashboard({ period: this.period() }).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(this.messageOf(err));
        this.loading.set(false);
      },
    });
  }

  ask(): void {
    this.asking.set(true);
    this.error.set(null);
    this.api.executiveAsk(this.question()).subscribe({
      next: (brief) => {
        this.brief.set(brief);
        this.asking.set(false);
      },
      error: (err: unknown) => {
        this.error.set(this.messageOf(err));
        this.asking.set(false);
      },
    });
  }

  askPreset(q: string): void {
    this.question.set(q);
    this.ask();
  }

  createTask(rec: BiRecommendation): void {
    if (!rec.suggestedObjective && !rec.title) return;
    this.working.set(true);
    this.notice.set(null);
    this.api
      .createIntelligenceTask({
        agentKey: rec.suggestedAgentKey ?? 'analyst',
        objective: rec.suggestedObjective ?? rec.title,
        recommendationId: rec.id,
        requiresApproval: rec.requiresHumanApproval,
      })
      .subscribe({
        next: (result) => {
          this.notice.set(result.message);
          this.working.set(false);
        },
        error: (err: unknown) => {
          this.error.set(this.messageOf(err));
          this.working.set(false);
        },
      });
  }

  private messageOf(err: unknown): string {
    if (err && typeof err === 'object') {
      const api = err as ApiError;
      if (api.detail || api.title) return api.detail || api.title;
      if ('message' in err) return String((err as { message: string }).message);
    }
    return 'Unable to load executive intelligence.';
  }
}
