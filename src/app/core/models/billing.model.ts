export interface SubscriptionPlanDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  monthlyPrice: number;
  annualPrice: number;
  annualSavingsPercent: number;
  maxUsers: number;
  maxCustomers: number;
  maxProducts: number;
  maxProjects: number;
  maxTasks: number;
  maxStorageMb: number;
  maxAiRequests: number;
  hasAiAssistant: boolean;
  hasAdvancedAnalytics: boolean;
  hasPdfReports: boolean;
  hasAdvancedReports: boolean;
  hasPrioritySupport: boolean;
  hasApiAccess: boolean;
  hasMultiBranch: boolean;
  inventoryAccess: string;
  salesAccess: string;
  trialDays: number;
  isCustomPricing: boolean;
  isRecommended: boolean;
  currency: string;
  settlementCurrency: string;
  baseCurrency: string;
  baseMonthlyPrice: number;
  baseAnnualPrice: number;
  currencyScale: number;
  priceNote?: string;
  features: string[];
  sortOrder: number;
}

export interface PlanFeatureFlagsDto {
  hasAiAssistant: boolean;
  hasAdvancedAnalytics: boolean;
  hasPdfReports: boolean;
  hasAdvancedReports: boolean;
  hasPrioritySupport: boolean;
}

export interface CurrentPlanDto {
  planId: string;
  planName: string;
  planSlug: string;
  status: string;
  billingInterval: string;
  paymentProvider: string;
  startDate: string;
  trialEndDate?: string;
  currentPeriodEnd?: string;
  renewalDate?: string;
  cancelAtPeriodEnd: boolean;
  scheduledCancellationDate?: string;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  currentPrice: number;
  currency: string;
  settlementCurrency: string;
  billingCountry?: string;
  autoRenew: boolean;
  paymentMethodSummary?: string;
  currencyScale: number;
  featureFlags: PlanFeatureFlagsDto;
}

export interface BillingUsageDto {
  userCount: number;
  maxUsers: number;
  customerCount: number;
  maxCustomers: number;
  productCount: number;
  maxProducts: number;
  projectCount: number;
  maxProjects: number;
  taskCount: number;
  maxTasks: number;
  storageUsedMb: number;
  maxStorageMb: number;
  aiRequestsUsed: number;
  maxAiRequests: number;
  aiRequestsRemaining: number;
  usersAreCustom: boolean;
  aiRequestsAreCustom: boolean;
  resetDate?: string;
  lastCalculatedAt: string;
  pendingInvitationCount?: number;
  activeUserCount?: number;
  usersRemaining?: number;
  customersRemaining?: number;
  productsRemaining?: number;
  projectsRemaining?: number;
  tasksRemaining?: number;
  storageUsedBytes?: number;
  storageRemainingMb?: number;
  usersOverLimit?: boolean;
  customersOverLimit?: boolean;
  productsOverLimit?: boolean;
  projectsOverLimit?: boolean;
  tasksOverLimit?: boolean;
  storageOverLimit?: boolean;
  aiRequestsOverLimit?: boolean;
  subscriptionStatus?: string;
}

export interface BillingInvoiceDto {
  id: string;
  invoiceNumber: string;
  planName: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: string;
  billingInterval: string;
  paymentMethod?: string;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  createdAt: string;
}

export interface BillingTransactionDto {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  paymentMethod?: string;
  description?: string;
  createdAt: string;
  completedAt?: string;
}

export interface BillingDashboardDto {
  currentPlan: CurrentPlanDto;
  usage: BillingUsageDto;
  recentInvoices: BillingInvoiceDto[];
  recentTransactions: BillingTransactionDto[];
}

export interface CheckoutSessionDto {
  sessionId: string;
  planId: string;
  billingInterval: string;
  checkoutUrl?: string;
  provider: string;
  amount: number;
  currency: string;
  requiresServerConfirmation: boolean;
  priceNote?: string;
}

export interface PlanChangePreviewDto {
  planId: string;
  planName: string;
  billingInterval: string;
  amountDue: number;
  currency: string;
  settlementCurrency: string;
  isDowngrade: boolean;
  requiresCheckout: boolean;
  isTrial: boolean;
  prorationNote: string;
  priceNote?: string;
}

export interface PlanChangeResultDto {
  applied: boolean;
  checkoutRequired: boolean;
  preview: PlanChangePreviewDto;
  checkout?: CheckoutSessionDto;
  subscription?: CurrentPlanDto;
}

export interface DowngradeValidationDto {
  isValid: boolean;
  violations: string[];
}

export interface PaymentProviderDto {
  provider: string;
  name: string;
  isEnabled: boolean;
  isSandbox: boolean;
}

export interface UpgradePlanRequest {
  planId: string;
  billingInterval?: string;
  provider?: string;
}

export interface CheckoutRequest {
  planId: string;
  billingInterval?: string;
  provider?: string;
  successUrl?: string;
  cancelUrl?: string;
  country?: string;
  currency?: string;
}

export interface ChangePlanRequest {
  planId: string;
  billingInterval?: string;
  provider?: string;
  country?: string;
  currency?: string;
  confirm: boolean;
  startTrial?: boolean;
  successUrl?: string;
  cancelUrl?: string;
}

export const BILLING_COUNTRIES: ReadonlyArray<{ country: string; currency: string; label: string }> = [
  { country: 'US', currency: 'USD', label: 'United States (USD)' },
  { country: 'AE', currency: 'AED', label: 'United Arab Emirates (AED)' },
  { country: 'SA', currency: 'SAR', label: 'Saudi Arabia (SAR)' },
  { country: 'QA', currency: 'QAR', label: 'Qatar (QAR)' },
  { country: 'KW', currency: 'KWD', label: 'Kuwait (KWD)' },
  { country: 'BH', currency: 'BHD', label: 'Bahrain (BHD)' },
  { country: 'OM', currency: 'OMR', label: 'Oman (OMR)' },
  { country: 'GB', currency: 'GBP', label: 'United Kingdom (GBP)' },
  { country: 'EU', currency: 'EUR', label: 'Euro area (EUR)' },
  { country: 'CA', currency: 'CAD', label: 'Canada (CAD)' },
  { country: 'AU', currency: 'AUD', label: 'Australia (AUD)' },
  { country: 'SG', currency: 'SGD', label: 'Singapore (SGD)' },
  { country: 'PK', currency: 'PKR', label: 'Pakistan (PKR)' },
];

const THREE_DECIMAL = new Set(['KWD', 'BHD', 'OMR']);

export function formatIsoCurrency(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return '—';
  const code = (currency || 'USD').toUpperCase();
  const digits = THREE_DECIMAL.has(code) ? 3 : code === 'JPY' || code === 'KRW' ? 0 : 2;
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency: code,
    currencyDisplay: 'symbol',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function limitLabel(value: number, custom = false): string {
  if (custom && value === -1) return 'Custom';
  return formatLimit(value);
}

export function usageTone(current: number, max: number): 'ok' | 'warn' | 'high' | 'full' | 'over' {
  if (max === -1) return 'ok';
  if (current > max) return 'over';
  if (max <= 0) return current > 0 ? 'over' : 'full';
  const percent = (current / max) * 100;
  if (percent >= 100) return 'full';
  if (percent >= 90) return 'high';
  if (percent >= 80) return 'warn';
  return 'ok';
}

export function isOverLimit(current: number, max: number): boolean {
  return max !== -1 && current > max;
}

export function isAtLimit(current: number, max: number): boolean {
  return max !== -1 && current >= max;
}

export function remainingAllowance(current: number, max: number): number {
  if (max === -1) return Number.POSITIVE_INFINITY;
  return Math.max(0, max - current);
}

export function usageExplanation(label: string, current: number, max: number): string | null {
  if (max === -1) return null;
  if (current > max) {
    return `${label} is over the plan allowance (${current.toLocaleString()} of ${max.toLocaleString()}). Existing records stay available. New items are blocked until you upgrade or reduce usage.`;
  }
  if (current >= max) {
    return `${label} has reached the plan allowance. Upgrade to add more.`;
  }
  return null;
}

export function formatLimit(value: number): string {
  return value === -1 ? 'Unlimited' : value.toLocaleString();
}

export function usagePercent(current: number, max: number): number {
  if (max === -1 || max === 0) return 0;
  return Math.min(100, Math.round((current / max) * 100));
}
