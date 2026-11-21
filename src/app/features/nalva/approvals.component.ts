import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaApproval } from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';

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
  readonly filter = signal<'pending' | 'all'>('pending');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly savingId = signal<string | null>(null);
  readonly commentDrafts = signal<Record<string, string>>({});
  readonly argsDrafts = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.approvals(this.filter() === 'pending' ? 'Pending' : undefined).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.status === 403
          ? 'Your account does not have permission to view Navla approvals.'
          : err.detail || err.title || 'Could not load approvals. Check your connection and try again.');
        this.loading.set(false);
      },
    });
  }

  setFilter(value: 'pending' | 'all'): void {
    if (this.filter() === value) return;
    this.filter.set(value);
    this.load();
  }

  setComment(id: string, value: string): void {
    this.commentDrafts.update((drafts) => ({ ...drafts, [id]: value }));
  }

  setArgs(id: string, value: string): void {
    this.argsDrafts.update((drafts) => ({ ...drafts, [id]: value }));
  }

  decide(row: NalvaApproval, decision: 'approve' | 'reject' | 'changes'): void {
    if (this.savingId() || (row.status !== 'Pending' && row.status !== 'ChangesRequested')) return;

    this.savingId.set(row.id);
    this.error.set(null);
    this.notice.set(null);
    const modified = this.argsDrafts()[row.id]?.trim() || undefined;
    this.api.decide(row.id, decision, this.commentDrafts()[row.id]?.trim() || undefined, modified).subscribe({
      next: (result) => {
        this.notice.set(result.summary
          || (decision === 'approve'
            ? 'Approval recorded. Check the execution result for whether any write action completed.'
            : decision === 'reject'
              ? 'Approval rejected. No further action was taken for this request.'
              : 'Changes requested. Modified parameters were stored; approve again to execute.'));
        if (result.error) {
          this.error.set(result.error);
        }
        this.savingId.set(null);
        this.load();
      },
      error: (err: ApiError) => {
        this.error.set(err.status === 403
          ? 'Only accounts with Navla approve permission can decide these requests.'
          : err.status === 404
            ? 'This approval is no longer available in your business.'
            : err.detail || err.title || 'The decision could not be saved. Please try again.');
        this.savingId.set(null);
      },
    });
  }

  isPending(row: NalvaApproval): boolean {
    return row.status === 'Pending' || row.status === 'ChangesRequested';
  }

  trackById(_index: number, row: NalvaApproval): string {
    return row.id;
  }
}
