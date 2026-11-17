import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaApproval } from '../../core/models/nalva.model';

@Component({
  selector: 'app-nalva-approvals',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './approvals.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaApprovalsComponent implements OnInit {
  private readonly api = inject(NalvaService);
  readonly rows = signal<NalvaApproval[]>([]);
  readonly notice = signal<string | null>(null);
  readonly status = signal('Pending');

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.approvals(this.status() || undefined).subscribe({ next: (rows) => this.rows.set(rows) });
  }

  decide(row: NalvaApproval, decision: 'approve' | 'reject' | 'changes'): void {
    this.api.decide(row.id, decision).subscribe({
      next: (result) => { this.notice.set(result.summary || result.status); this.load(); },
      error: () => this.notice.set('The decision was not saved. Approval permission is required.'),
    });
  }
}
