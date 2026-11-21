export interface ProcurementOverview {
  activeProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  slowMovingCount: number;
  overstockCount: number;
  openPurchaseOrders: number;
  delayedDeliveries: number;
  estimatedProcurementNeed: number;
  dataClassification: string;
}

export interface InventoryRisk {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  maximumStockLevel: number;
  incomingQuantity: number;
  effectiveAvailable: number;
  riskKind: string;
  averageDailyDemand?: number | null;
  daysOfCover?: number | null;
  estimatedStockoutDate?: string | null;
  suggestedReorderQuantity: number;
  confidence: string;
  explanation: string;
}

export interface DemandInsight {
  productId: string;
  productName: string;
  sku: string;
  unitsLast30Days: number;
  unitsLast90Days: number;
  averageDailyDemand?: number | null;
  averageMonthlyDemand?: number | null;
  currentStock: number;
  daysOfCover?: number | null;
  estimatedStockoutDate?: string | null;
  suggestedReorderQuantity: number;
  confidence: string;
  assumptions: string;
  forecastAvailable: boolean;
}

export interface SupplierOption {
  supplierId?: string | null;
  supplierName: string;
  source: string;
  classification: string;
  unitPrice: number;
  quantity: number;
  minimumOrderQuantity: number;
  totalCost: number;
  estimatedDeliveryDays?: number | null;
  paymentTerms?: string | null;
  availability?: string | null;
  notes?: string | null;
}

export interface ProcurementRecommendation {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  incomingQuantity: number;
  suggestedQuantity: number;
  preferredSupplierId?: string | null;
  preferredSupplierName?: string | null;
  preferredUnitPrice?: number | null;
  estimatedTotalCost?: number | null;
  confidence: string;
  reason: string;
  status: string;
  approvalFingerprint: string;
  createdAt: string;
}

export interface PreparePurchaseOrderRequest {
  productId: string;
  supplierId: string;
  quantity: number;
  unitPrice: number;
  expectedDeliveryDate?: string | null;
  paymentTerms?: string | null;
  reason?: string | null;
  idempotencyKey?: string | null;
  source?: string;
}

export interface PreparedPurchaseOrder {
  recommendationId: string;
  purchaseOrderId?: string | null;
  status: string;
  approvalFingerprint: string;
  requiresApproval: boolean;
  created: boolean;
  duplicatePrevented: boolean;
  summary: string;
  productId: string;
  supplierId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  expectedDeliveryDate?: string | null;
}

export interface SubmitPreparedPurchaseRequest {
  approved: boolean;
  idempotencyKey?: string | null;
  approvalFingerprint?: string | null;
}

export interface DeliveryTracking {
  purchaseOrderId: string;
  referenceNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  purchaseDate: string;
  expectedDeliveryDate?: string | null;
  isDelayed: boolean;
  daysLate: number;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
}

export interface ReceiveVerificationLineRequest {
  purchaseItemId: string;
  receivedQuantity: number;
  damagedQuantity: number;
  discrepancyNotes?: string | null;
}

export interface ReceiveVerificationRequest {
  purchaseOrderId: string;
  lines: ReceiveVerificationLineRequest[];
  notes?: string | null;
}

export interface ReceiveVerificationResult {
  purchaseOrderId: string;
  status: string;
  stockIncreasedBy: number;
  discrepancies: string[];
  summary: string;
}

export interface ProcurementAutomationSettings {
  dailyInventoryMonitoring: boolean;
  lowStockDetection: boolean;
  demandAnalysis: boolean;
  procurementRecommendations: boolean;
  purchaseOrderStatusMonitoring: boolean;
  deliveryFollowUps: boolean;
  inventoryDiscrepancyAlerts: boolean;
  slowMovingDays: number;
  overstockMultiplier: number;
  minimumHistoryDays: number;
  preferredSupplierCriterion: string;
  updatedAt?: string | null;
}

export type ProcurementAutomationSettingsWrite = Partial<{
  dailyInventoryMonitoring: boolean;
  lowStockDetection: boolean;
  demandAnalysis: boolean;
  procurementRecommendations: boolean;
  purchaseOrderStatusMonitoring: boolean;
  deliveryFollowUps: boolean;
  inventoryDiscrepancyAlerts: boolean;
  slowMovingDays: number;
  overstockMultiplier: number;
  minimumHistoryDays: number;
  preferredSupplierCriterion: string;
}>;

export interface ProcurementActivity {
  id: string;
  kind: string;
  title: string;
  summary: string;
  status: string;
  createdAt: string;
  relatedPurchaseOrderId?: string | null;
  relatedProductId?: string | null;
}
