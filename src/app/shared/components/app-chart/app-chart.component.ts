import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ChartDataResponse } from '../../../core/models/dashboard.model';
import { ThemeService } from '../../../core/theme/theme.service';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  templateUrl: './app-chart.component.html',
  styleUrl: './app-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppChartComponent implements OnDestroy {
  readonly data = input<ChartDataResponse | null>(null);
  readonly height = input(280);

  private readonly themeService = inject(ThemeService);
  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;
  private chartType: 'line' | 'bar' | 'doughnut' = 'line';

  constructor() {
    effect(() => {
      const canvas = this.canvasRef()?.nativeElement;
      const chartData = this.data();
      this.themeService.themeId();
      this.themeService.resolvedAppearance();

      if (!canvas || !chartData) {
        return;
      }

      const nextType = this.mapChartType(chartData.chartType);
      if (!this.chart || this.chartType !== nextType) {
        this.chart?.destroy();
        this.chart = null;
        this.createChart(canvas, chartData);
        return;
      }

      this.applyData(chartData);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private createChart(canvas: HTMLCanvasElement, chartData: ChartDataResponse): void {
    const colors = this.getChartColors();
    const palette = this.getDatasetPalette();
    const chartType = this.mapChartType(chartData.chartType);
    const isDoughnut = chartType === 'doughnut';

    const config = {
      type: chartType,
      data: {
        labels: chartData.labels,
        datasets: this.buildDatasets(chartData, palette, colors, isDoughnut),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 750, easing: 'easeInOutQuart' },
        plugins: {
          legend: {
            display: !isDoughnut && chartData.datasets.length > 1,
            position: 'bottom',
            labels: { color: colors.text, boxWidth: 10, usePointStyle: true },
          },
          tooltip: {
            enabled: true,
            mode: isDoughnut ? 'nearest' : 'index',
            intersect: isDoughnut,
          },
        },
        scales: isDoughnut
          ? {}
          : {
              y: {
                beginAtZero: true,
                grid: { color: colors.grid },
                ticks: { color: colors.textMuted, font: { size: 11 } },
                border: { display: false },
              },
              x: {
                grid: { display: false },
                ticks: { color: colors.textMuted, font: { size: 11 } },
                border: { display: false },
              },
            },
        ...(isDoughnut ? { cutout: '68%' } : {}),
      },
    } as ChartConfiguration;

    this.chart = new Chart(canvas, config);
    this.chartType = chartType;
  }

  private applyData(chartData: ChartDataResponse): void {
    if (!this.chart) return;
    const colors = this.getChartColors();
    const palette = this.getDatasetPalette();
    const isDoughnut = this.chartType === 'doughnut';
    this.chart.data.labels = chartData.labels;
    this.chart.data.datasets = this.buildDatasets(chartData, palette, colors, isDoughnut) as never;
    this.chart.update();
  }

  private buildDatasets(
    chartData: ChartDataResponse,
    palette: Array<{ border: string; fill: string; solid: string }>,
    colors: ReturnType<AppChartComponent['getChartColors']>,
    isDoughnut: boolean,
  ) {
    const doughnutColors = ['#7c5cfc', '#3b82f6', '#10b981', '#f59e0b', '#94a3b8', '#ec4899'];

    return chartData.datasets.map((ds, index) => {
      const color = palette[index % palette.length];
      const isLine = ds.chartStyle === 'line' || ds.chartStyle === 'area';

      if (isDoughnut) {
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor: doughnutColors.slice(0, Math.max(ds.data.length, 1)),
          borderColor: colors.surface,
          borderWidth: 3,
          hoverOffset: 6,
        };
      }

      return {
        label: ds.label,
        data: ds.data,
        borderColor: color.border,
        backgroundColor: isLine ? color.fill : color.solid,
        tension: 0.4,
        fill: ds.chartStyle === 'line' || ds.chartStyle === 'area',
        borderRadius: 6,
        pointRadius: isLine ? 4 : 0,
        pointHoverRadius: isLine ? 6 : 0,
        pointBackgroundColor: color.border,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      };
    });
  }

  private getChartColors(): {
    primary: string;
    primaryFaded: string;
    primarySolid: string;
    grid: string;
    text: string;
    textMuted: string;
    surface: string;
  } {
    const root = document.documentElement;
    const primary =
      getComputedStyle(root).getPropertyValue('--chart-primary-color').trim() ||
      getComputedStyle(root).getPropertyValue('--primary-color').trim() ||
      '#7c5cfc';
    const isDark = this.themeService.resolvedAppearance() === 'dark';
    return {
      primary,
      primaryFaded: this.withAlpha(primary, 0.18),
      primarySolid: this.withAlpha(primary, 0.7),
      grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      text: isDark ? '#f3f5f9' : '#111827',
      textMuted: isDark ? '#8b93a7' : '#6b7280',
      surface: isDark ? '#151a24' : '#ffffff',
    };
  }

  private withAlpha(hex: string, alpha: number): string {
    if (hex.startsWith('#') && hex.length >= 7) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex;
  }

  private getDatasetPalette(): Array<{ border: string; fill: string; solid: string }> {
    const colors = this.getChartColors();
    const extras = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const bases = [colors.primary, ...extras];
    return bases.map((base) => ({
      border: base,
      fill: this.withAlpha(base, 0.15),
      solid: this.withAlpha(base, 0.7),
    }));
  }

  private mapChartType(type: string): 'line' | 'bar' | 'doughnut' {
    const normalized = type.toLowerCase();
    if (normalized.includes('bar')) return 'bar';
    if (normalized.includes('doughnut') || normalized.includes('pie')) return 'doughnut';
    if (normalized.includes('area')) return 'line';
    return 'line';
  }
}
