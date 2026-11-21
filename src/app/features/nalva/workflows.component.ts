import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaWorkflow } from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-nalva-workflows',
  standalone: true,
  imports: [DatePipe, RouterLink],
  templateUrl: './workflows.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaWorkflowsComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly routes = ROUTES;
  readonly workflows = signal<NalvaWorkflow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actingId = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.workflows().subscribe({
      next: (rows) => {
        this.workflows.set(rows);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Navla workflow definitions could not be loaded.');
        this.loading.set(false);
      },
    });
  }

  setActive(workflow: NalvaWorkflow, active: boolean): void {
    if (this.actingId()) return;
    this.actingId.set(workflow.id);
    this.api.setWorkflowActive(workflow.id, active).subscribe({
      next: (updated) => {
        this.workflows.update((rows) => rows.map((row) => row.id === updated.id ? updated : row));
        this.notice.set(`Workflow "${updated.name}" is now ${updated.isActive ? 'active' : 'inactive'}.`);
        this.actingId.set(null);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not change workflow activation.');
        this.actingId.set(null);
      },
    });
  }
}
