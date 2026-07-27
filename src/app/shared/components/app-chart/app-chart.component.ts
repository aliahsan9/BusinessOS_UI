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
import { Chart, ChartConfiguration, Plugin, registerables } from 'chart.js';
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
  private themeKey = '';

  constructor() {
    effect(() => {
      const canvas = this.canvasRef()?.nativeElement;
      const chartData = this.data();
      const themeKey = `${this.themeService.themeId()}|${this.themeService.resolvedAppearance()}`;

      if (!canvas || !chartData) {
        return;
      }

      const nextType = this.mapChartType(chartData.chartType);
      const needsRebuild = !this.chart || this.chartType !== nextType || this.themeKey !== themeKey;

      if (needsRebuild) {
        this.chart?.destroy();
        this.chart = null;
        this.createChart(canvas, chartData, nextType);
        this.themeKey = themeKey;
        return;
      }

      this.applyData(chartData);
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private createChart(
    canvas: HTMLCanvasElement,
    chartData: ChartDataResponse,
    chartType: 'line' | 'bar' | 'doughnut',
  ): void {
    const colors = this.getChartColors();
    const palette = this.getDatasetPalette();
    const isDoughnut = chartType === 'doughnut';
    const isLine = chartType === 'line';

    const config = {
      type: chartType,
      data: {
        labels: chartData.labels,
        datasets: this.buildDatasets(chartData, palette, colors, isDoughnut, chartType),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: isDoughnut ? 'nearest' : 'index',
          intersect: isDoughnut,
        },
        animation: {
          duration: 900,
          easing: 'easeInOutQuart',
        },
        plugins: {
          legend: {
            display: !isDoughnut && chartData.datasets.length > 1,
            position: 'bottom',
            labels: {
              color: colors.text,
              boxWidth: 10,
              usePointStyle: true,
              padding: 16,
            },
          },
          tooltip: {
            enabled: true,
            backgroundColor: colors.tooltipBg,
            titleColor: colors.text,
            bodyColor: colors.textMuted,
            borderColor: colors.border,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 10,
            displayColors: true,
            mode: isDoughnut ? 'nearest' : 'index',
            intersect: isDoughnut,
          },
        },
        scales: isDoughnut
          ? {}
          : {
              y: {
                beginAtZero: true,
                grid: {
                  color: colors.grid,
                  drawTicks: false,
                },
                ticks: {
                  color: colors.textMuted,
                  font: { size: 11 },
                  padding: 8,
                  callback: (value: string | number) => this.formatAxisTick(value),
                },
                border: { display: false },
              },
              x: {
                grid: { display: false },
                ticks: {
                  color: colors.textMuted,
                  font: { size: 11 },
                  padding: 6,
                  maxRotation: 0,
                },
                border: { display: false },
              },
            },
        ...(isDoughnut
          ? {
              cutout: '68%',
              elements: {
                arc: {
                  borderWidth: 3,
                  borderColor: colors.surface,
                  hoverOffset: 8,
                },
              },
            }
          : {}),
        ...(isLine
          ? {
              elements: {
                line: {
                  borderJoinStyle: 'round' as const,
                  borderCapStyle: 'round' as const,
                },
                point: {
                  hoverBorderWidth: 3,
                },
              },
            }
          : {}),
      },
      plugins: isLine ? [this.createGlowPlugin(palette[0]?.border ?? colors.primary)] : [],
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
    this.chart.data.datasets = this.buildDatasets(
      chartData,
      palette,
      colors,
      isDoughnut,
      this.chartType,
    ) as never;
    this.chart.update();
  }

  private buildDatasets(
    chartData: ChartDataResponse,
    palette: Array<{ border: string; fillTop: string; fillMid: string; solid: string }>,
    colors: ReturnType<AppChartComponent['getChartColors']>,
    isDoughnut: boolean,
    chartType: 'line' | 'bar' | 'doughnut',
  ) {
    const doughnutColors = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#94a3b8', '#ec4899'];

    return chartData.datasets.map((ds, index) => {
      const color = palette[index % palette.length];

      if (isDoughnut) {
        return {
          label: ds.label,
          data: ds.data,
          backgroundColor: doughnutColors.slice(0, Math.max(ds.data.length, 1)),
          borderColor: colors.surface,
          borderWidth: 3,
          hoverOffset: 8,
          hoverBorderWidth: 2,
        };
      }

      if (chartType === 'line') {
        return {
          label: ds.label,
          data: ds.data,
          borderColor: color.border,
          borderWidth: 3,
          tension: 0.45,
          fill: true,
          backgroundColor: (ctx: { chart: Chart }) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) {
              return color.fillMid;
            }
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, color.fillTop);
            gradient.addColorStop(0.55, color.fillMid);
            gradient.addColorStop(1, this.withAlpha(color.border, 0));
            return gradient;
          },
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: color.border,
          pointBorderColor: colors.surface,
          pointBorderWidth: 2,
          pointHoverBorderColor: colors.surface,
          pointHoverBackgroundColor: color.border,
        };
      }

      return {
        label: ds.label,
        data: ds.data,
        borderColor: color.border,
        backgroundColor: color.solid,
        tension: 0.35,
        fill: false,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 42,
        pointRadius: 0,
      };
    });
  }

  private createGlowPlugin(glowColor: string): Plugin {
    return {
      id: 'lineGlow',
      beforeDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 0;
      },
      afterDatasetsDraw(chart) {
        chart.ctx.restore();
      },
    };
  }

  private formatAxisTick(value: string | number): string {
    const n = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(n)) return String(value);
    if (Math.abs(n) >= 1_000_000) {
      const scaled = n / 1_000_000;
      return `${scaled % 1 === 0 ? scaled.toFixed(0) : scaled.toFixed(1)}M`;
    }
    if (Math.abs(n) >= 1_000) {
      return `${Math.round(n / 1_000)}K`;
    }
    return String(n);
  }

  private getChartColors(): {
    primary: string;
    grid: string;
    text: string;
    textMuted: string;
    surface: string;
    border: string;
    tooltipBg: string;
  } {
    const root = document.documentElement;
    const primary =
      getComputedStyle(root).getPropertyValue('--chart-primary-color').trim() ||
      getComputedStyle(root).getPropertyValue('--primary-color').trim() ||
      '#7c5cfc';
    const isDark = this.themeService.resolvedAppearance() === 'dark';
    return {
      primary,
      grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
      text: isDark ? '#f3f5f9' : '#111827',
      textMuted: isDark ? '#8b93a7' : '#6b7280',
      surface: isDark ? '#151a24' : '#ffffff',
      border: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      tooltipBg: isDark ? 'rgba(21, 26, 36, 0.95)' : 'rgba(255,255,255,0.96)',
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

  private getDatasetPalette(): Array<{
    border: string;
    fillTop: string;
    fillMid: string;
    solid: string;
  }> {
    const colors = this.getChartColors();
    const extras = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const bases = [colors.primary, ...extras];
    return bases.map((base) => ({
      border: base,
      fillTop: this.withAlpha(base, 0.42),
      fillMid: this.withAlpha(base, 0.14),
      solid: this.withAlpha(base, 0.75),
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
