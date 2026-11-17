import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { AgentEmployeeService } from '../../core/services/agent-employee.service';
import { AgentActionProposal } from '../../core/models/agent.model';

@Component({
  selector: 'app-nalva-approvals',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './approvals.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaApprovalsComponent implements OnInit {
  private readonly api = inject(AgentEmployeeService);

  readonly rows = signal<AgentActionProposal[]>([]);
  readonly filter = signal<'pending' | 'all'>('pending');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly savingId = signal<string | null>(null);
  readonly commentDrafts = signal<Record<string, string>>({});

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listActionProposals(this.filter() === 'pending', 100).subscribe({
      next: (rows) => {
        this.rows.set(rows);
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.error.set(err.status === 404 || err.status === 405
          ? 'The approval API is not available on this backend yet. Merge and deploy the Sales Agent approval backend first.'
          : err.status === 403
            ? 'Your account does not have permission to view these proposals.'
            : 'Could not load Sales Agent proposals. Check your connection and try again.');
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

  decide(row: AgentActionProposal, decision: 'approved' | 'rejected'): void {
    if (this.savingId() || this.status(row.status) !== 'AwaitingApproval') return;

    this.savingId.set(row.id);
    this.error.set(null);
    this.notice.set(null);
    this.api.decideActionProposal(row.id, {
      decision,
      comment: this.commentDrafts()[row.id]?.trim() || null,
    }).subscribe({
      next: (updated) => {
        this.rows.update((items) => items.map((item) => item.id === updated.id ? updated : item));
        this.notice.set(decision === 'approved'
          ? 'Proposal approved. No message has been sent and no business data has been changed.'
          : 'Proposal rejected. No business action was executed.');
        this.savingId.set(null);
        if (this.filter() === 'pending') {
          this.rows.update((items) => items.filter((item) => item.id !== updated.id));
        }
      },
      error: (err: { status?: number }) => {
        this.error.set(err.status === 403
          ? 'Only a business Owner, Admin or Manager can decide proposals.'
          : err.status === 404
            ? 'This proposal is no longer available in your business.'
            : err.status === 409
              ? 'This proposal has already been decided or has expired. Refresh to see its latest status.'
              : 'The decision could not be saved. Please try again.');
        this.savingId.set(null);
      },
    });
  }

  execute(row: AgentActionProposal): void {
    if (this.savingId() || this.status(row.status) !== 'Approved') return;

    this.savingId.set(row.id);
    this.error.set(null);
    this.notice.set(null);
    this.api.executeActionProposal(row.id).subscribe({
      next: (updated) => {
        this.rows.update((items) => items.map((item) => item.id === updated.id ? updated : item));
        this.notice.set(updated.executionMessage
          || 'Execution request completed. Check the proposal status for the recorded outcome.');
        this.savingId.set(null);
      },
      error: (err: { status?: number }) => {
        this.error.set(err.status === 403
          ? 'Only a business Owner, Admin or Manager can execute an approved proposal.'
          : err.status === 404
            ? 'This proposal or its customer is no longer available.'
            : err.status === 409
              ? 'This proposal is not approved or has already been claimed for execution. Refresh to see its latest status.'
              : err.status === 503
                ? 'Email delivery is not configured. The proposal was marked as failed and will not be retried automatically.'
                : err.status === 502
                  ? 'Email delivery failed. Automatic retry is disabled to prevent duplicate messages.'
                  : 'The execution request failed. Refresh the proposal before taking further action.');
        this.savingId.set(null);
        this.load();
      },
    });
  }

  status(value: number | string): string {
    if (typeof value === 'number') {
      return ['Pending', 'Running', 'Completed', 'Failed', 'Cancelled', 'AwaitingApproval', 'Approved', 'Rejected', 'Executing', 'Executed', 'ExecutionFailed'][value] ?? 'Unknown';
    }
    const numeric = Number(value);
    if (value.trim() !== '' && Number.isInteger(numeric)) return this.status(numeric);
    return value;
  }

  isPending(row: AgentActionProposal): boolean {
    return this.status(row.status) === 'AwaitingApproval';
  }

  actionLabel(actionType: string): string {
    return actionType === 'SendCustomerFollowUp' ? 'Customer follow-up' : actionType;
  }

  trackById(_index: number, row: AgentActionProposal): string {
    return row.id;
  }
}
