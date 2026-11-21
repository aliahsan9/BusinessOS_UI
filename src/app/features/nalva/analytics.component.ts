import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaAnalytics, NalvaAgentOutcome } from '../../core/models/nalva.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-nalva-analytics',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './analytics.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaAnalyticsComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly data = signal<NalvaAnalytics | null>(null);
  readonly outcomes = signal<NalvaAgentOutcome[]>([]);
  readonly category = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    forkJoin({
      analytics: this.api.analytics(undefined, this.category() || undefined),
      outcomes: this.api.outcomes(),
    }).subscribe({
      next: ({ analytics, outcomes }) => {
        this.data.set(analytics);
        this.outcomes.set(outcomes);
      },
    });
  }
}
