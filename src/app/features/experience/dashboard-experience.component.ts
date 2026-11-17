import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppCurrencyPipe } from '../../shared/pipes/app-currency.pipe';
import { DashboardExperience, DashboardWidget, ExperienceService } from '../../core/services/experience.service';

@Component({
  selector: 'app-dashboard-experience',
  standalone: true,
  imports: [RouterLink, AppCurrencyPipe],
  templateUrl: './dashboard-experience.component.html',
  styleUrl: './experience.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardExperienceComponent implements OnInit {
  private readonly experience = inject(ExperienceService);

  readonly data = signal<DashboardExperience | null>(null);
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly visible = (id: string) => this.experience.visible(id);

  ngOnInit(): void {
    this.experience.loadDashboard().subscribe({
      next: (data) => this.data.set(data),
      error: () => this.error.set('Business insights could not be loaded.'),
    });
  }

  widgets(): DashboardWidget[] {
    return this.data()?.widgets ?? [];
  }

  sizeClass(id: string): string {
    const size = this.widgets().find((widget) => widget.id === id)?.size ?? 'md';
    if (size === 'lg') return 'ux__stat ux__stat--lg';
    if (size === 'sm') return 'ux__stat ux__stat--sm';
    return 'ux__stat';
  }

  move(index: number, direction: -1 | 1): void {
    const widgets = [...this.widgets()];
    const target = index + direction;
    if (target < 0 || target >= widgets.length) return;
    const [item] = widgets.splice(index, 1);
    widgets.splice(target, 0, item);
    this.data.update((current) => current ? { ...current, widgets } : current);
  }

  toggle(id: string): void {
    this.data.update((current) => current ? {
      ...current,
      widgets: current.widgets.map((widget) => widget.id === id ? { ...widget, visible: !widget.visible } : widget),
    } : current);
  }

  resize(id: string): void {
    const order = ['sm', 'md', 'lg'];
    this.data.update((current) => current ? {
      ...current,
      widgets: current.widgets.map((widget) => {
        if (widget.id !== id) return widget;
        const next = order[(order.indexOf(widget.size) + 1) % order.length];
        return { ...widget, size: next };
      }),
    } : current);
  }

  save(): void {
    this.saving.set(true);
    this.experience.saveLayout(this.widgets()).subscribe({
      next: (data) => {
        this.data.set(data);
        this.saving.set(false);
        this.editing.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('The layout could not be saved.');
      },
    });
  }

  restore(): void {
    this.saving.set(true);
    this.experience.restoreLayout().subscribe({
      next: (data) => {
        this.data.set(data);
        this.saving.set(false);
        this.editing.set(false);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('The default layout could not be restored.');
      },
    });
  }
}
