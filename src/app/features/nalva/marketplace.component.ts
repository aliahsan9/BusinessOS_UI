import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AgentEmployeeService } from '../../core/services/agent-employee.service';
import { AgentEmployee } from '../../core/models/agent.model';

@Component({
  selector: 'app-nalva-marketplace',
  standalone: true,
  imports: [],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./nalva.shared.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaMarketplaceComponent implements OnInit {
  private readonly api = inject(AgentEmployeeService);
  private readonly route = inject(ActivatedRoute);

  readonly mine = signal(false);
  readonly employees = signal<AgentEmployee[]>([]);
  readonly error = signal<string | null>(null);
  readonly loading = signal(true);
  readonly category = signal('All');

  ngOnInit(): void {
    this.mine.set(this.route.snapshot.data['mine'] === true);
    this.load();
  }

  categories(): string[] {
    return ['All', ...new Set(this.employees().map((employee) => employee.specialty).filter(Boolean))];
  }

  visible(): AgentEmployee[] {
    const selected = this.category();
    return this.employees().filter((employee) =>
      selected === 'All' || employee.specialty === selected
    );
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listEmployees().subscribe({
      next: (rows) => {
        this.employees.set(rows);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('The AI employee catalog could not be loaded. Check your API connection and permissions.');
        this.loading.set(false);
      },
    });
  }
}
