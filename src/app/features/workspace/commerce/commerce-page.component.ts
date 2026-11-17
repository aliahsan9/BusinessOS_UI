import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AppAlertComponent } from '../../../shared/components/app-alert/app-alert.component';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb/app-breadcrumb.component';
import { AppEmptyStateComponent } from '../../../shared/components/app-empty-state/app-empty-state.component';
import { AppPageHeaderComponent } from '../../../shared/components/app-page-header/app-page-header.component';
import { AppSkeletonComponent } from '../../../shared/components/app-skeleton/app-skeleton.component';
import { AlertRow, ReturnRow, WarehouseRow, WarehouseStockRow, WorkspaceApiService, workspaceError } from '../workspace-api.service';

type CommerceScreen = 'warehouses' | 'returns';

@Component({
  selector: 'app-commerce-page',
  standalone: true,
  imports: [FormsModule, AppAlertComponent, AppBreadcrumbComponent, AppEmptyStateComponent, AppPageHeaderComponent, AppSkeletonComponent],
  templateUrl: './commerce-page.component.html',
  styleUrl: '../people/workspace-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommercePageComponent implements OnInit {
  private readonly api = inject(WorkspaceApiService);
  private readonly route = inject(ActivatedRoute);
  readonly screen = signal<CommerceScreen>('warehouses');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly warehouses = signal<WarehouseRow[]>([]);
  readonly stock = signal<WarehouseStockRow[]>([]);
  readonly alerts = signal<AlertRow[]>([]);
  readonly returns = signal<ReturnRow[]>([]);
  readonly selectedWarehouse = signal('');
  warehouse = { name: '', code: '', address: '', isDefault: false };
  transfer = { fromWarehouseId: '', toWarehouseId: '', productId: '', quantity: 1 };
  returnRequest = { orderId: '', productId: '', quantity: 1, reason: '' };

  ngOnInit(): void {
    this.screen.set((this.route.snapshot.data['screen'] as CommerceScreen) ?? 'warehouses');
    this.reload();
  }

  title(): string {
    return this.screen() === 'warehouses' ? 'Warehouses' : 'Returns';
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    const done = () => this.loading.set(false);
    const fail = (error: unknown) => { this.error.set(workspaceError(error)); done(); };
    if (this.screen() === 'returns') {
      this.api.returns().subscribe({ next: (rows) => { this.returns.set(rows); done(); }, error: fail });
      return;
    }
    this.api.warehouses().subscribe({
      next: (rows) => {
        this.warehouses.set(rows);
        this.api.alerts().subscribe({ next: (alerts) => { this.alerts.set(alerts); done(); }, error: fail });
      },
      error: fail,
    });
  }

  saveWarehouse(): void {
    this.run(() => this.api.saveWarehouse(this.warehouse));
  }

  loadStock(id: string): void {
    this.selectedWarehouse.set(id);
    this.api.warehouseStock(id).subscribe({
      next: (rows) => this.stock.set(rows),
      error: (error: unknown) => this.error.set(workspaceError(error)),
    });
  }

  saveTransfer(): void {
    this.run(() => this.api.transfer({
      fromWarehouseId: this.transfer.fromWarehouseId,
      toWarehouseId: this.transfer.toWarehouseId,
      notes: null,
      lines: [{ productId: this.transfer.productId, quantity: Number(this.transfer.quantity) }],
    }));
  }

  saveReturn(): void {
    this.run(() => this.api.createReturn({
      orderId: this.returnRequest.orderId,
      reason: this.returnRequest.reason,
      lines: [{ productId: this.returnRequest.productId, quantity: Number(this.returnRequest.quantity) }],
    }));
  }

  decide(row: ReturnRow, approve: boolean, restock: boolean): void {
    this.run(() => this.api.decideReturn(row.id, { approve, restock, refundAmount: 0, paymentId: null, notes: null }));
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
