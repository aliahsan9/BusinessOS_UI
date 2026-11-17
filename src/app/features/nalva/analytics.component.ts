import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaAnalytics } from '../../core/models/nalva.model';

@Component({
  selector: 'app-nalva-analytics',
  standalone: true,
  imports: [],
  templateUrl: './analytics.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaAnalyticsComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly data = signal<NalvaAnalytics | null>(null);
  readonly category = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.analytics(undefined, this.category() || undefined).subscribe({ next: (value) => this.data.set(value) });
  }
}
