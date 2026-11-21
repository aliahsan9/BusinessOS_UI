import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { NalvaService } from '../../core/services/nalva.service';
import { ApiError } from '../../core/models/api-error.model';
import {
  CashFlowIntelligence,
  ExpenseIntelligence,
  FinanceActivity,
  FinanceAlert,
  FinanceAutomationSettings,
  FinanceBudget,
  FinanceIntelligence,
  FinanceOverview,
  FinanceReminder,
  FinanceReport,
  PayablesIntelligence,
  PreparedReminder,
  ReceivablesIntelligence,
  ReconciliationSummary,
} from '../../core/models/finance-agent.model';

@Component({
  selector: 'app-nalva-finance-workspace',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './finance-workspace.component.html',
  styleUrls: ['./nalva.shared.scss', './finance-workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaFinanceWorkspaceComponent implements OnInit {
  private readonly api = inject(NalvaService);

  readonly overview = signal<FinanceOverview | null>(null);
  readonly intelligence = signal<FinanceIntelligence | null>(null);
  readonly expenses = signal<ExpenseIntelligence | null>(null);
  readonly receivables = signal<ReceivablesIntelligence | null>(null);
  readonly payables = signal<PayablesIntelligence | null>(null);
  readonly cashFlow = signal<CashFlowIntelligence | null>(null);
  readonly reconciliation = signal<ReconciliationSummary | null>(null);
  readonly budgets = signal<FinanceBudget[]>([]);
  readonly alerts = signal<FinanceAlert[]>([]);
  readonly reminders = signal<FinanceReminder[]>([]);
  readonly activity = signal<FinanceActivity[]>([]);
  readonly automation = signal<FinanceAutomationSettings | null>(null);
  readonly report = signal<FinanceReport | null>(null);
  readonly lastReminder = signal<PreparedReminder | null>(null);

  readonly loading = signal(true);
  readonly working = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly period = signal('month');
  readonly reportType = signal('monthly-profit-loss');
  readonly budgetName = signal('');
  readonly budgetAmount = signal(0);
  readonly budgetCategory = signal('');
  readonly budgetStart = signal('');
  readonly budgetEnd = signal('');
  readonly csvContent = signal('');
  readonly csvFileName = signal('statement.csv');

  ngOnInit(): void {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    this.budgetStart.set(start.toISOString().slice(0, 10));
    this.budgetEnd.set(end.toISOString().slice(0, 10));
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    const period = this.period();
    forkJoin({
      overview: this.api.financeOverview({ period }),
      intelligence: this.api.financeIntelligence({ period }),
      expenses: this.api.financeExpenses({ period }),
      receivables: this.api.financeReceivables(),
      payables: this.api.financePayables(),
      cashFlow: this.api.financeCashFlow({ period, projectionDays: 30 }),
      reconciliation: this.api.financeReconciliation(),
      budgets: this.api.financeBudgets(),
      alerts: this.api.financeAlerts(),
      reminders: this.api.financeReminders(),
      activity: this.api.financeActivity(),
      automation: this.api.financeAutomation(),
    }).subscribe({
      next: (data) => {
        this.overview.set(data.overview);
        this.intelligence.set(data.intelligence);
        this.expenses.set(data.expenses);
        this.receivables.set(data.receivables);
        this.payables.set(data.payables);
        this.cashFlow.set(data.cashFlow);
        this.reconciliation.set(data.reconciliation);
        this.budgets.set(data.budgets);
        this.alerts.set(data.alerts);
        this.reminders.set(data.reminders);
        this.activity.set(data.activity);
        this.automation.set(data.automation);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not load finance workspace.');
        this.loading.set(false);
      },
    });
  }

  metric(value: number | null | undefined, available = true, currency?: string): string {
    if (!available || value == null) return 'Unavailable';
    const cur = currency ?? this.overview()?.currency ?? '';
    return `${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`.trim();
  }

  runMonitor(): void {
    this.working.set(true);
    this.notice.set(null);
    this.api.financeMonitorRun().subscribe({
      next: () => {
        this.notice.set('Finance monitor completed.');
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Monitor failed.');
        this.working.set(false);
      },
    });
  }

  generateReport(): void {
    this.working.set(true);
    this.api.financeReport({ reportType: this.reportType(), period: this.period() }).subscribe({
      next: (report) => {
        this.report.set(report);
        this.notice.set(`Generated ${report.reportType} report.`);
        this.working.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Report failed.');
        this.working.set(false);
      },
    });
  }

  prepareReminder(invoiceId: string): void {
    this.working.set(true);
    this.api.prepareFinanceReminder({ invoiceId, idempotencyKey: `ui:${invoiceId}:${Date.now()}` }).subscribe({
      next: (reminder) => {
        this.lastReminder.set(reminder);
        this.notice.set(reminder.summary);
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not prepare reminder.');
        this.working.set(false);
      },
    });
  }

  submitReminder(): void {
    const reminder = this.lastReminder();
    if (!reminder?.reminderId) return;
    this.working.set(true);
    this.api.submitFinanceReminder(reminder.reminderId, {
      approved: true,
      approvalFingerprint: reminder.approvalFingerprint,
    }).subscribe({
      next: (result) => {
        this.lastReminder.set(result);
        this.notice.set(result.summary);
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Reminder approval failed.');
        this.working.set(false);
      },
    });
  }

  saveBudget(): void {
    if (!this.budgetName().trim() || this.budgetAmount() <= 0) {
      this.error.set('Budget name and positive amount are required.');
      return;
    }
    this.working.set(true);
    this.api.saveFinanceBudget({
      name: this.budgetName().trim(),
      categoryName: this.budgetCategory().trim() || null,
      amount: this.budgetAmount(),
      periodStart: new Date(this.budgetStart()).toISOString(),
      periodEnd: new Date(this.budgetEnd()).toISOString(),
      isRecommendation: false,
    }).subscribe({
      next: () => {
        this.notice.set('Budget saved.');
        this.budgetName.set('');
        this.budgetAmount.set(0);
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not save budget.');
        this.working.set(false);
      },
    });
  }

  saveAutomation(): void {
    const current = this.automation();
    if (!current) return;
    this.working.set(true);
    this.api.saveFinanceAutomation(current).subscribe({
      next: (saved) => {
        this.automation.set(saved);
        this.notice.set('Automation settings saved.');
        this.working.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not save automation settings.');
        this.working.set(false);
      },
    });
  }

  importCsv(): void {
    if (!this.csvContent().trim()) {
      this.error.set('Paste CSV content before importing.');
      return;
    }
    this.working.set(true);
    this.api.importFinanceBankStatement({
      fileName: this.csvFileName() || 'statement.csv',
      csvContent: this.csvContent(),
    }).subscribe({
      next: (result) => {
        this.notice.set(result.summary);
        this.csvContent.set('');
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'CSV import failed.');
        this.working.set(false);
      },
    });
  }

  patchAutomation<K extends keyof FinanceAutomationSettings>(key: K, value: FinanceAutomationSettings[K]): void {
    const current = this.automation();
    if (!current) return;
    this.automation.set({ ...current, [key]: value });
  }
}
