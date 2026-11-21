import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { NalvaService } from '../../core/services/nalva.service';
import { ApiError } from '../../core/models/api-error.model';
import {
  DeliveryTracking,
  DemandInsight,
  InventoryRisk,
  PreparedPurchaseOrder,
  ProcurementActivity,
  ProcurementAutomationSettings,
  ProcurementOverview,
  ProcurementRecommendation,
  SupplierOption,
} from '../../core/models/procurement-agent.model';

@Component({
  selector: 'app-nalva-procurement-workspace',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  templateUrl: './procurement-workspace.component.html',
  styleUrls: ['./nalva.shared.scss', './procurement-workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NalvaProcurementWorkspaceComponent implements OnInit {
  private readonly api = inject(NalvaService);

  readonly overview = signal<ProcurementOverview | null>(null);
  readonly risks = signal<InventoryRisk[]>([]);
  readonly demand = signal<DemandInsight[]>([]);
  readonly recommendations = signal<ProcurementRecommendation[]>([]);
  readonly deliveries = signal<DeliveryTracking[]>([]);
  readonly activity = signal<ProcurementActivity[]>([]);
  readonly automation = signal<ProcurementAutomationSettings | null>(null);
  readonly supplierOptions = signal<SupplierOption[]>([]);
  readonly lastPrepared = signal<PreparedPurchaseOrder | null>(null);

  readonly loading = signal(true);
  readonly working = signal(false);
  readonly comparing = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly selectedRecommendationId = signal<string>('');
  readonly compareQuantity = signal<number>(1);
  readonly selectedSupplierId = signal<string>('');

  readonly receivePurchaseOrderId = signal('');
  readonly receivePurchaseItemId = signal('');
  readonly receiveQuantity = signal<number>(0);
  readonly receiveDamaged = signal<number>(0);
  readonly receiveNotes = signal('');

  readonly selectedRecommendation = computed(() => {
    const id = this.selectedRecommendationId();
    return this.recommendations().find((r) => r.id === id) ?? null;
  });

  readonly risksByKind = computed(() => {
    const groups = new Map<string, InventoryRisk[]>();
    for (const risk of this.risks()) {
      const key = risk.riskKind || 'other';
      const list = groups.get(key) ?? [];
      list.push(risk);
      groups.set(key, list);
    }
    return [...groups.entries()].map(([kind, rows]) => ({ kind, rows }));
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      overview: this.api.procurementOverview(),
      risks: this.api.procurementRisks(),
      demand: this.api.procurementDemand(),
      recommendations: this.api.procurementRecommendations(),
      deliveries: this.api.procurementDeliveries(),
      activity: this.api.procurementActivity(),
      automation: this.api.procurementAutomation(),
    }).subscribe({
      next: (data) => {
        this.overview.set(data.overview);
        this.risks.set(data.risks);
        this.demand.set(data.demand);
        this.recommendations.set(data.recommendations);
        this.deliveries.set(data.deliveries);
        this.activity.set(data.activity);
        this.automation.set(data.automation);

        const current = this.selectedRecommendationId();
        if (!current || !data.recommendations.some((r) => r.id === current)) {
          const first = data.recommendations[0];
          if (first) {
            this.selectedRecommendationId.set(first.id);
            this.compareQuantity.set(Math.max(1, first.suggestedQuantity || 1));
          } else {
            this.selectedRecommendationId.set('');
          }
        }
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Could not load procurement workspace.');
        this.loading.set(false);
      },
    });
  }

  selectRecommendation(id: string): void {
    this.selectedRecommendationId.set(id);
    const row = this.recommendations().find((r) => r.id === id);
    if (row) {
      this.compareQuantity.set(Math.max(1, row.suggestedQuantity || 1));
    }
    this.supplierOptions.set([]);
    this.selectedSupplierId.set('');
  }

  compareSuppliers(): void {
    const rec = this.selectedRecommendation();
    if (!rec || this.comparing()) return;
    const qty = Math.max(1, this.compareQuantity() || 1);
    this.comparing.set(true);
    this.error.set(null);
    this.api.procurementCompareSuppliers(rec.productId, qty).subscribe({
      next: (rows) => {
        this.supplierOptions.set(rows);
        const preferred = rows.find((r) => r.supplierId && r.supplierId === rec.preferredSupplierId)
          ?? rows.find((r) => !!r.supplierId);
        this.selectedSupplierId.set(preferred?.supplierId ?? '');
        this.comparing.set(false);
        if (!rows.length) {
          this.notice.set('No supplier options returned for this product and quantity.');
        }
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Supplier comparison failed.');
        this.comparing.set(false);
      },
    });
  }

  prepareFromRecommendation(): void {
    const rec = this.selectedRecommendation();
    if (!rec || this.working()) return;

    const compared = this.supplierOptions().find((s) => s.supplierId === this.selectedSupplierId());
    const supplierId = compared?.supplierId || rec.preferredSupplierId;
    const unitPrice = compared?.unitPrice ?? rec.preferredUnitPrice;
    const quantity = compared?.quantity || Math.max(1, this.compareQuantity() || rec.suggestedQuantity || 1);

    if (!supplierId || unitPrice == null) {
      this.error.set('Select a catalog supplier from comparison (or use a recommendation with a preferred supplier and price) before preparing.');
      return;
    }

    this.working.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.procurementPrepare({
      productId: rec.productId,
      supplierId,
      quantity,
      unitPrice,
      paymentTerms: compared?.paymentTerms ?? undefined,
      reason: rec.reason,
      idempotencyKey: `ui-prep-${rec.id}-${Date.now()}`,
      source: 'ui',
    }).subscribe({
      next: (prepared) => {
        this.lastPrepared.set(prepared);
        this.notice.set(prepared.summary);
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Prepare purchase order failed.');
        this.working.set(false);
      },
    });
  }

  submitPrepared(approved: boolean): void {
    const prepared = this.lastPrepared();
    if (!prepared?.recommendationId || this.working()) return;
    this.working.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.procurementSubmit(prepared.recommendationId, {
      approved,
      approvalFingerprint: prepared.approvalFingerprint,
      idempotencyKey: `ui-submit-${prepared.recommendationId}-${Date.now()}`,
    }).subscribe({
      next: (result) => {
        this.lastPrepared.set(result);
        this.notice.set(result.summary);
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Submit failed.');
        this.working.set(false);
      },
    });
  }

  submitRecommendation(rec: ProcurementRecommendation, approved: boolean): void {
    if (this.working()) return;
    this.working.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.procurementSubmit(rec.id, {
      approved,
      approvalFingerprint: rec.approvalFingerprint,
      idempotencyKey: `ui-submit-${rec.id}-${Date.now()}`,
    }).subscribe({
      next: (result) => {
        this.lastPrepared.set(result);
        this.notice.set(result.summary);
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Submit failed.');
        this.working.set(false);
      },
    });
  }

  fillReceiveFromDelivery(row: DeliveryTracking): void {
    this.receivePurchaseOrderId.set(row.purchaseOrderId);
    this.receiveQuantity.set(Math.max(0, row.remainingQuantity));
  }

  receiveGoods(): void {
    const purchaseOrderId = this.receivePurchaseOrderId().trim();
    const purchaseItemId = this.receivePurchaseItemId().trim();
    const receivedQuantity = this.receiveQuantity();
    if (!purchaseOrderId || !purchaseItemId || receivedQuantity <= 0 || this.working()) {
      this.error.set('Enter purchase order id, purchase line id, and a received quantity greater than zero.');
      return;
    }

    this.working.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.procurementReceive({
      purchaseOrderId,
      notes: this.receiveNotes().trim() || undefined,
      lines: [{
        purchaseItemId,
        receivedQuantity,
        damagedQuantity: Math.max(0, this.receiveDamaged()),
        discrepancyNotes: this.receiveNotes().trim() || undefined,
      }],
    }).subscribe({
      next: (result) => {
        this.notice.set(result.summary);
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Receive verification failed.');
        this.working.set(false);
      },
    });
  }

  setAutomationToggle(
    key: keyof Pick<
      ProcurementAutomationSettings,
      | 'dailyInventoryMonitoring'
      | 'lowStockDetection'
      | 'demandAnalysis'
      | 'procurementRecommendations'
      | 'purchaseOrderStatusMonitoring'
      | 'deliveryFollowUps'
      | 'inventoryDiscrepancyAlerts'
    >,
    value: boolean,
  ): void {
    const current = this.automation();
    if (!current) return;
    this.automation.set({ ...current, [key]: value });
  }

  setAutomationNumber(
    key: 'slowMovingDays' | 'overstockMultiplier' | 'minimumHistoryDays',
    value: number,
  ): void {
    const current = this.automation();
    if (!current) return;
    this.automation.set({ ...current, [key]: value });
  }

  setPreferredCriterion(value: string): void {
    const current = this.automation();
    if (!current) return;
    this.automation.set({ ...current, preferredSupplierCriterion: value });
  }

  saveAutomation(): void {
    const settings = this.automation();
    if (!settings || this.working()) return;
    this.working.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.saveProcurementAutomation({
      dailyInventoryMonitoring: settings.dailyInventoryMonitoring,
      lowStockDetection: settings.lowStockDetection,
      demandAnalysis: settings.demandAnalysis,
      procurementRecommendations: settings.procurementRecommendations,
      purchaseOrderStatusMonitoring: settings.purchaseOrderStatusMonitoring,
      deliveryFollowUps: settings.deliveryFollowUps,
      inventoryDiscrepancyAlerts: settings.inventoryDiscrepancyAlerts,
      slowMovingDays: settings.slowMovingDays,
      overstockMultiplier: settings.overstockMultiplier,
      minimumHistoryDays: settings.minimumHistoryDays,
      preferredSupplierCriterion: settings.preferredSupplierCriterion,
    }).subscribe({
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

  runMonitor(): void {
    if (this.working()) return;
    this.working.set(true);
    this.notice.set(null);
    this.error.set(null);
    this.api.procurementMonitorRun().subscribe({
      next: () => {
        this.notice.set('Inventory monitor run completed.');
        this.working.set(false);
        this.reload();
      },
      error: (err: ApiError) => {
        this.error.set(err.detail || err.title || 'Monitor run failed.');
        this.working.set(false);
      },
    });
  }
}
