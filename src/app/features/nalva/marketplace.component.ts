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
  readonly selectedTools = signal<string[]>([]);
  readonly permissionSavingKey = signal<string | null>(null);
  readonly permissionError = signal<string | null>(null);
  readonly permissionMessage = signal<string | null>(null);
  readonly toolGroups = [
    { label: 'Read business data', tools: ['GetCustomers', 'GetProjects', 'GetTasks', 'GetInvoices', 'GetExpenses', 'GetProducts', 'GetRevenue', 'GetSalesSummary', 'GetBestSellingProducts', 'GetSalesTrends', 'GetBusinessHealth', 'GetDailyPriorities', 'GetCustomerInsights', 'GetBusinessSettings', 'GetNotificationsSummary'] },
    { label: 'Customers and sales', tools: ['SearchCustomer', 'CreateCustomer', 'UpdateCustomer', 'DeleteCustomer', 'CreateSale'] },
    { label: 'Products and inventory', tools: ['SearchProduct', 'CreateProduct', 'UpdateProduct', 'DeleteProduct', 'GetInventorySummary', 'GetInventoryHealth', 'GetLowStock', 'GetOutOfStock', 'GetDeadStock', 'AdjustInventory', 'ReceiveStock'] },
    { label: 'Invoices and purchasing', tools: ['CreateInvoice', 'SearchInvoice', 'CancelInvoice', 'CreatePurchaseOrderDraft', 'CreatePurchaseOrder', 'ApprovePurchaseOrder', 'ReceivePurchase', 'SearchSupplier', 'CreateSupplier', 'UpdateSupplier', 'DeleteSupplier', 'GetPurchaseRecommendations'] },
    { label: 'Projects, reports and settings', tools: ['CreateProject', 'CreateTask', 'SearchDocuments', 'GenerateInventoryReport', 'GenerateSalesReport', 'ApplyOnboardingProfile', 'ShowProfit', 'UpdateCompanyProfile', 'UpdateTaxDefaults'] },
  ];
  readonly allToolNames = [...new Set(this.toolGroups.flatMap((group) => group.tools))];
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
    // An unconfigured policy preserves the legacy tool behavior. Preselect all
    // currently registered tools so the first save does not accidentally remove access.
    this.selectedTools.set([...(employee.allowedTools ?? this.allToolNames)]);
    this.permissionError.set(null);
    this.permissionMessage.set(null);
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

  isToolSelected(tool: string): boolean {
    return this.selectedTools().includes(tool);
  }

  toggleTool(tool: string, checked: boolean): void {
    this.selectedTools.update((current) => checked
      ? [...new Set([...current, tool])]
      : current.filter((item) => item !== tool));
    this.permissionError.set(null);
    this.permissionMessage.set(null);
  }

  selectAllTools(): void {
    this.selectedTools.set([...this.allToolNames]);
  }

  clearAllTools(): void {
    this.selectedTools.set([]);
  }

  saveToolPermissions(employee: AgentEmployee): void {
    if (!this.mine() || this.savingKey() || this.permissionSavingKey()) return;
    this.permissionSavingKey.set(employee.key);
    this.permissionError.set(null);
    this.permissionMessage.set(null);
    const allowedTools = [...this.selectedTools()];
    this.api.updateEmployeeToolPermissions(employee.key, { allowedTools }).subscribe({
      next: (updated) => {
        this.employees.update((rows) => rows.map((row) => row.key === updated.key ? updated : row));
        this.permissionMessage.set(allowedTools.length === 0
          ? 'All tool access has been disabled for this employee.'
          : `${allowedTools.length} tool permissions saved.`);
        this.permissionSavingKey.set(null);
      },
      error: (error: { status?: number; error?: { error?: string } }) => {
        this.permissionError.set(error.error?.error || (error.status === 403
          ? 'Only a business Owner or Admin can manage employee tool permissions.'
          : error.status === 404 || error.status === 405
            ? 'The backend permissions endpoint is not deployed yet. Merge and deploy the backend permissions change first.'
            : 'Could not save tool permissions. Check the API connection and try again.'));
        this.permissionSavingKey.set(null);
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
