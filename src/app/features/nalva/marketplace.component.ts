import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaAgentCard } from '../../core/models/nalva.model';
import { ROUTES } from '../../core/constants/route.constants';

@Component({
  selector: 'app-nalva-marketplace',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaMarketplaceComponent implements OnInit {
  private readonly api = inject(NalvaService);
  private readonly route = inject(ActivatedRoute);
  readonly routes = ROUTES;
  readonly mine = signal(false);
  readonly agents = signal<NalvaAgentCard[]>([]);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly category = signal('All');

  ngOnInit(): void {
    this.mine.set(this.route.snapshot.data['mine'] === true);
    this.load();
  }

  categories(): string[] {
    return ['All', ...new Set(this.agents().map((agent) => agent.category))];
  }

  visible(): NalvaAgentCard[] {
    const selected = this.category();
    return this.agents().filter((agent) => selected === 'All' || agent.category === selected);
  }

  load(): void {
    const request = this.mine() ? this.api.myAgents() : this.api.marketplace();
    request.subscribe({
      next: (rows) => this.agents.set(rows),
      error: () => this.error.set('Agents could not be loaded.'),
    });
  }

  activate(agent: NalvaAgentCard): void {
    this.api.activate(agent.key).subscribe({
      next: () => { this.notice.set(`${agent.name} is active.`); this.load(); },
      error: () => this.error.set('Activation failed.'),
    });
  }

  deactivate(agent: NalvaAgentCard): void {
    this.api.deactivate(agent.key).subscribe({
      next: () => { this.notice.set(`${agent.name} is inactive.`); this.load(); },
      error: () => this.error.set('Deactivation failed.'),
    });
  }
}
