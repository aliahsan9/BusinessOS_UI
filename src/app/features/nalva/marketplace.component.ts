import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AgentEmployeeService } from '../../core/services/agent-employee.service';
import { AgentEmployee, UpdateAgentConfigurationRequest } from '../../core/models/agent.model';

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
  readonly editingKey = signal<string | null>(null);
  readonly configurationDraft = signal<UpdateAgentConfigurationRequest>({
    displayName: '', roleTitle: '', specialty: '', defaultLanguage: 'en',
  });

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

  startConfiguration(employee: AgentEmployee): void {
    if (!this.mine() || this.savingKey()) return;
    this.actionError.set(null);
    this.actionMessage.set(null);
    this.configurationDraft.set({
      displayName: employee.displayName,
      roleTitle: employee.roleTitle,
      specialty: employee.specialty,
      defaultLanguage: employee.defaultLanguage || 'en',
    });
    this.editingKey.set(employee.key);
  }

  updateDraft(field: keyof UpdateAgentConfigurationRequest, value: string): void {
    this.configurationDraft.update((draft) => ({ ...draft, [field]: value }));
  }

  saveConfiguration(employee: AgentEmployee): void {
    if (!this.mine() || this.savingKey()) return;
    this.savingKey.set(employee.key);
    this.actionError.set(null);
    this.actionMessage.set(null);
    this.api.updateEmployeeConfiguration(employee.key, this.configurationDraft()).subscribe({
      next: (updated) => {
        this.employees.update((rows) => rows.map((row) => row.key === updated.key ? updated : row));
        this.actionMessage.set(`${updated.displayName} configuration saved for this business.`);
        this.editingKey.set(null);
        this.savingKey.set(null);
      },
      error: (error: { status?: number; error?: { error?: string } }) => {
        this.actionError.set(error.error?.error || (error.status === 403
          ? 'Only a business Owner or Admin can configure AI employees.'
          : 'Could not save this configuration. Confirm the backend configuration API is deployed and try again.'));
        this.savingKey.set(null);
      },
    });
  }

  cancelConfiguration(): void {
    if (!this.savingKey()) this.editingKey.set(null);
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
