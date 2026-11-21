import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaAgentCard, NalvaAgentDetail } from '../../core/models/nalva.model';
import { ApiError } from '../../core/models/api-error.model';

@Component({
  selector: 'app-nalva-marketplace',
  standalone: true,
  imports: [],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaMarketplaceComponent implements OnInit {
  private readonly api = inject(NalvaService);
  private readonly route = inject(ActivatedRoute);

  readonly mine = signal(false);
  readonly agents = signal<NalvaAgentCard[]>([]);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);
  readonly category = signal('All');
  readonly savingKey = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);
  readonly editingKey = signal<string | null>(null);
  readonly detail = signal<NalvaAgentDetail | null>(null);
  readonly toolsDraft = signal<string[]>([]);

  ngOnInit(): void {
    this.mine.set(this.route.snapshot.data['mine'] === true);
    this.load();
  }

  categories(): string[] {
    return ['All', ...new Set(this.agents().map((agent) => agent.category).filter(Boolean))];
  }

  visible(): NalvaAgentCard[] {
    const selected = this.category();
    const rows = this.mine()
      ? this.agents().filter((agent) => agent.status === 'Active')
      : this.agents();
    return rows.filter((agent) => selected === 'All' || agent.category === selected);
  }

  toggleActivation(agent: NalvaAgentCard): void {
    if (!this.mine() || this.savingKey()) return;

    const activate = agent.status !== 'Active';
    this.savingKey.set(agent.key);
    this.actionError.set(null);
    this.actionMessage.set(null);

    const request = activate ? this.api.activate(agent.key) : this.api.deactivate(agent.key);
    request.subscribe({
      next: (updated) => {
        this.agents.update((rows) => rows.map((row) => row.key === updated.key
          ? { ...row, status: updated.status, autonomyLevel: updated.autonomyLevel }
          : row));
        this.actionMessage.set(`${updated.name} ${updated.status === 'Active' ? 'activated' : 'deactivated'} for this business.`);
        this.savingKey.set(null);
        if (this.mine()) this.load();
      },
      error: (error: ApiError) => {
        this.actionError.set(error.status === 403
          ? 'Only accounts with Navla manage permission can change agent activation.'
          : error.detail || error.title || 'Could not update this agent. No activation change was confirmed.');
        this.savingKey.set(null);
      },
    });
  }

  startConfiguration(agent: NalvaAgentCard): void {
    if (!this.mine() || this.savingKey()) return;
    this.actionError.set(null);
    this.actionMessage.set(null);
    this.savingKey.set(agent.key);
    this.api.agent(agent.key).subscribe({
      next: (detail) => {
        this.detail.set(detail);
        this.toolsDraft.set(detail.tools?.map((tool) => tool.name) ?? []);
        this.editingKey.set(agent.key);
        this.savingKey.set(null);
      },
      error: (error: ApiError) => {
        this.actionError.set(error.detail || error.title || 'Could not load agent configuration.');
        this.savingKey.set(null);
      },
    });
  }

  isToolAllowed(tool: string): boolean {
    return this.toolsDraft().includes(tool);
  }

  toggleToolPermission(tool: string, checked: boolean): void {
    this.toolsDraft.update((current) => {
      const next = new Set(current);
      if (checked) next.add(tool);
      else next.delete(tool);
      return [...next].sort();
    });
  }

  saveConfiguration(agent: NalvaAgentCard): void {
    if (!this.mine() || this.savingKey()) return;
    this.savingKey.set(agent.key);
    this.actionError.set(null);
    this.actionMessage.set(null);
    this.api.configure(agent.key, { tools: this.toolsDraft() }).subscribe({
      next: (updated) => {
        this.agents.update((rows) => rows.map((row) => row.key === updated.key
          ? { ...row, status: updated.status, autonomyLevel: updated.autonomyLevel }
          : row));
        this.actionMessage.set(`${updated.name} tool configuration saved for this business.`);
        this.editingKey.set(null);
        this.detail.set(null);
        this.savingKey.set(null);
      },
      error: (error: ApiError) => {
        this.actionError.set(error.status === 403
          ? 'Only accounts with Navla manage permission can configure agents.'
          : error.detail || error.title || 'Could not save this configuration. No changes were confirmed.');
        this.savingKey.set(null);
      },
    });
  }

  cancelConfiguration(): void {
    if (!this.savingKey()) {
      this.editingKey.set(null);
      this.detail.set(null);
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const request = this.mine() ? this.api.myAgents() : this.api.marketplace();
    request.subscribe({
      next: (rows) => {
        this.agents.set(rows);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'The Navla agent catalog could not be loaded.');
        this.loading.set(false);
      },
    });
  }
}
