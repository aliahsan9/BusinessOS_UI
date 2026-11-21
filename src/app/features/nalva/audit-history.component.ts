import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaExecution } from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-nalva-audit-history',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './audit-history.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaAuditHistoryComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly routes = ROUTES;
  readonly rows = signal<NalvaExecution[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    // Dedicated /agents/audit-history is not implemented. Execution history is the verified audit trail.
    this.api.executions().subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.status === 403
          ? 'Your account does not have permission to view Navla execution history.'
          : err.detail || err.title || 'Execution audit history could not be loaded.');
        this.loading.set(false);
      },
    });
  }
}
