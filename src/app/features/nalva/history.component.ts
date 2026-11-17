import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaExecution } from '../../core/models/nalva.model';

@Component({
  selector: 'app-nalva-history',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './history.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaHistoryComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly rows = signal<NalvaExecution[]>([]);
  readonly agentKey = signal('');
  readonly status = signal('');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.executions(this.agentKey() || undefined, this.status() || undefined).subscribe({ next: (rows) => this.rows.set(rows) });
  }
}
