import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppCurrencyPipe } from '../../../shared/pipes/app-currency.pipe';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { CashFlowRow, IncomeRow, ProfitRow, PurchaseInvoiceRow, SubscriptionRow, TaxRateRow, WorkspaceApiService, workspaceError } from '../workspace-api.service';

type FinanceScreen = 'income' | 'purchase-invoices' | 'cash-flow' | 'tax' | 'subscriptions';

@Component({
  selector: 'app-finance-ops-page',
  standalone: true,
  imports: [FormsModule, AppCurrencyPipe, AppAlertComponent, AppBreadcrumbComponent, AppPageHeaderComponent, AppSkeletonComponent],
  templateUrl: './finance-ops-page.component.html',
  styleUrl: '../people/workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceOpsPageComponent implements OnInit {
  private readonly api = inject(WorkspaceApiService);
  private readonly route = inject(ActivatedRoute);
  readonly screen = signal<FinanceScreen>('income');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly income = signal<IncomeRow[]>([]);
  readonly invoices = signal<PurchaseInvoiceRow[]>([]);
  readonly taxes = signal<TaxRateRow[]>([]);
  readonly subscriptions = signal<SubscriptionRow[]>([]);
  readonly cash = signal<CashFlowRow | null>(null);
  readonly profit = signal<ProfitRow | null>(null);
  incomeForm = { category: '', amount: 0, occurredOn: new Date().toISOString().slice(0, 10), paymentMethod: 'Bank transfer', reference: '' };
  invoice = { invoiceNumber: '', supplierId: '', issueDate: '', dueDate: '', subTotal: 0, tax: 0 };
  payment = { invoiceId: '', amount: 0, paymentMethod: 'Bank transfer', reference: '' };
  tax = { name: '', ratePercent: 0, isInclusive: false, isDefault: false };
  subscription = { provider: '', name: '', billingCycle: 'Monthly', cost: 0, currency: 'USD', renewalDate: '', expenseCategory: '' };
  from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  to = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    this.screen.set((this.route.snapshot.data['screen'] as FinanceScreen) ?? 'income');
    this.reload();
  }

  title(): string {
    return { income: 'Income', 'purchase-invoices': 'Purchase invoices', 'cash-flow': 'Cash flow and profit', tax: 'Tax rates', subscriptions: 'Operational subscriptions' }[this.screen()];
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    const done = () => this.loading.set(false);
    const fail = (error: unknown) => { this.error.set(workspaceError(error)); done(); };
    const screen = this.screen();
    if (screen === 'income') {
      this.api.income().subscribe({ next: (page) => { this.income.set(page.items); done(); }, error: fail });
    } else if (screen === 'purchase-invoices') {
      this.api.purchaseInvoices().subscribe({ next: (rows) => { this.invoices.set(rows); done(); }, error: fail });
    } else if (screen === 'tax') {
      this.api.taxRates().subscribe({ next: (rows) => { this.taxes.set(rows); done(); }, error: fail });
    } else if (screen === 'subscriptions') {
      this.api.subscriptions().subscribe({ next: (rows) => { this.subscriptions.set(rows); done(); }, error: fail });
    } else {
      this.loadReports(done, fail);
    }
  }

  loadReports(done: () => void = () => this.loading.set(false), fail: (error: unknown) => void = (error) => this.error.set(workspaceError(error))): void {
    const from = `${this.from}T00:00:00Z`;
    const to = `${this.to}T23:59:59Z`;
    this.api.cashFlow(from, to).subscribe({
      next: (cash) => {
        this.cash.set(cash);
        this.api.profitAndLoss(from, to).subscribe({ next: (profit) => { this.profit.set(profit); done(); }, error: fail });
      },
      error: fail,
    });
  }

  saveIncome(): void {
    this.run(() => this.api.saveIncome({
      category: this.incomeForm.category,
      amount: Number(this.incomeForm.amount),
      occurredOn: `${this.incomeForm.occurredOn}T00:00:00Z`,
      paymentMethod: this.incomeForm.paymentMethod,
      reference: this.incomeForm.reference || null,
      notes: null,
      isRecurring: false,
    }));
  }

  saveInvoice(): void {
    this.run(() => this.api.savePurchaseInvoice({
      invoiceNumber: this.invoice.invoiceNumber,
      supplierId: this.invoice.supplierId,
      purchaseId: null,
      issueDate: `${this.invoice.issueDate}T00:00:00Z`,
      dueDate: `${this.invoice.dueDate}T00:00:00Z`,
      subTotal: Number(this.invoice.subTotal),
      tax: Number(this.invoice.tax),
      notes: null,
      attachmentUrl: null,
    }));
  }

  pay(): void {
    this.run(() => this.api.payPurchaseInvoice(this.payment.invoiceId, {
      amount: Number(this.payment.amount),
      paymentMethod: this.payment.paymentMethod,
      reference: this.payment.reference || null,
    }));
  }

  saveTax(): void {
    this.run(() => this.api.saveTaxRate({ ...this.tax, ratePercent: Number(this.tax.ratePercent) }));
  }

  saveSubscription(): void {
    this.run(() => this.api.saveSubscription({
      ...this.subscription,
      cost: Number(this.subscription.cost),
      renewalDate: `${this.subscription.renewalDate}T00:00:00Z`,
      expenseCategory: this.subscription.expenseCategory || null,
    }));
  }

  private run(request: () => Observable<unknown>): void {
    this.saving.set(true);
    this.error.set(null);
    request().subscribe({
      next: () => { this.saving.set(false); this.reload(); },
      error: (error: unknown) => { this.saving.set(false); this.error.set(workspaceError(error)); },
    });
  }
}
