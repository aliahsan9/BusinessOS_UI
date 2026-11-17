import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaAuditEntry } from '../../core/models/nalva.model';

@Component({
  selector: 'app-nalva-audit-history',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './audit-history.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaAuditHistoryComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly rows = signal<NalvaAuditEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.agentAuditHistory(100).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Audit history is unavailable. Only workspace Owners and Admins can view these records.');
        this.loading.set(false);
      },
    });
  }
}
