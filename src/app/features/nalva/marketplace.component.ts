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
  readonly savingKey = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly actionMessage = signal<string | null>(null);

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

  toggleActivation(employee: AgentEmployee): void {
    if (!this.mine() || employee.isDefault || this.savingKey()) return;

    const nextActive = !employee.isActive;
    this.savingKey.set(employee.key);
    this.actionError.set(null);
    this.actionMessage.set(null);

    this.api.setEmployeeActivation(employee.key, nextActive).subscribe({
      next: (updated) => {
        this.employees.update((rows) => rows.map((row) => row.key === updated.key ? updated : row));
        this.actionMessage.set(`${updated.displayName} ${updated.isActive ? 'activated' : 'deactivated'} for this business.`);
        this.savingKey.set(null);
      },
      error: (error: { status?: number }) => {
        this.actionError.set(error.status === 403
          ? 'Only a business Owner or Admin can manage AI employee activation.'
          : 'Could not update this AI employee. Confirm the backend activation API is deployed and try again.');
        this.savingKey.set(null);
      },
    });
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
