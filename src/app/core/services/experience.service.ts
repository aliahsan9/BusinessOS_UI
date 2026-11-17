import { Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BaseApiService } from './base-api.service';
import { AuthResponse } from '../models/auth.model';

export interface DashboardWidget {
  id: string;
  label: string;
  size: string;
  visible: boolean;
}

export interface BusinessInsight {
  code: string;
  message: string;
  route?: string | null;
}

export interface DashboardExperience {
  widgets: DashboardWidget[];
  insights: BusinessInsight[];
  pendingOrders?: number | null;
  processingOrders?: number | null;
  completedOrders?: number | null;
  cancelledOrders?: number | null;
  activeProjects?: number | null;
  completedProjects?: number | null;
  overdueTasks?: number | null;
  totalEmployees?: number | null;
  activeEmployees?: number | null;
  pendingLeave?: number | null;
  activeAgents?: number | null;
  runningTasks?: number | null;
  completedTasks?: number | null;
  failedExecutions?: number | null;
  pendingApprovals?: number | null;
  estimatedAiCostUsd?: number | null;
  aiCostIsEstimate?: boolean | null;
  activeWorkflows?: number | null;
  successfulWorkflowRuns?: number | null;
  failedWorkflowRuns?: number | null;
  scheduledWorkflows?: number | null;
  revenue?: number | null;
  previousRevenue?: number | null;
  expenses?: number | null;
  previousExpenses?: number | null;
}

export interface WorkspaceExperience {
  businessType: string;
  workspace: string;
  enabledModules: string[];
  suggestedNavigation: { label: string; route: string }[];
  note: string;
}

export interface StorefrontOffering {
  id: string;
  kind: string;
  productId?: string | null;
  name: string;
  summary?: string | null;
  description?: string | null;
  category?: string | null;
  sku?: string | null;
  pricingModel: string;
  price?: number | null;
  deliverables?: string | null;
  deliveryTime?: string | null;
  imageUrl?: string | null;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
  inStock?: boolean | null;
}

export interface StorefrontPackage {
  id: string;
  offeringId?: string | null;
  name: string;
  scope?: string | null;
  deliverables?: string | null;
  pricingModel: string;
  price?: number | null;
  isPublished: boolean;
  sortOrder: number;
}

export interface StorefrontPortfolio {
  id: string;
  title: string;
  summary?: string | null;
  coverImageUrl?: string | null;
  technologies?: string | null;
  industry?: string | null;
  projectUrl?: string | null;
  results?: string | null;
  isPublished: boolean;
}

export interface StorefrontReview {
  id: string;
  displayName: string;
  rating: number;
  body: string;
  status: string;
  createdAt: string;
}

export interface StorefrontAdmin {
  companyName: string;
  slug: string;
  publicPath: string;
  isPublished: boolean;
  tagline?: string | null;
  publicDescription?: string | null;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  publicEmail?: string | null;
  publicPhone?: string | null;
  website?: string | null;
  location?: string | null;
  industry?: string | null;
  category?: string | null;
  brandColor: string;
  layout: string;
  showProducts: boolean;
  showServices: boolean;
  showPortfolio: boolean;
  showReviews: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  consentNotice?: string | null;
  offerings: StorefrontOffering[];
  packages: StorefrontPackage[];
  portfolio: StorefrontPortfolio[];
  reviews: StorefrontReview[];
}

export interface PublicCompany extends Omit<StorefrontAdmin, 'companyName' | 'publicPath' | 'isPublished' | 'logoUrl'> {
  name: string;
  redirectSlug?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  currency: string;
}

export interface PublicSubmission {
  accepted: boolean;
  leadId?: string | null;
  orderId?: string | null;
  orderNumber?: string | null;
  status?: string | null;
  message: string;
}

export interface SupplierPortalView {
  supplierName: string;
  companyName: string;
  expiresAt: string;
  orders: { reference?: string | null; date: string; status: string; total: number }[];
}

@Injectable({ providedIn: 'root' })
export class ExperienceService extends BaseApiService {
  readonly widgets = signal<DashboardWidget[] | null>(null);

  visible(id: string): boolean {
    const rows = this.widgets();
    if (!rows) return true;
    return rows.some((widget) => widget.id === id && widget.visible);
  }

  loadDashboard(): Observable<DashboardExperience> {
    return this.get<DashboardExperience>('/experience/dashboard').pipe(
      tap((data) => this.widgets.set(data.widgets ?? [])),
    );
  }

  saveLayout(widgets: DashboardWidget[]): Observable<DashboardExperience> {
    return this.put<DashboardExperience>('/experience/dashboard/layout', { widgets }).pipe(
      tap((data) => this.widgets.set(data.widgets ?? [])),
    );
  }

  restoreLayout(): Observable<DashboardExperience> {
    return this.delete<DashboardExperience>('/experience/dashboard/layout').pipe(
      tap((data) => this.widgets.set(data.widgets ?? [])),
    );
  }

  workspace(): Observable<WorkspaceExperience> {
    return this.get<WorkspaceExperience>('/experience/workspace');
  }

  saveWorkspace(workspace: string): Observable<WorkspaceExperience> {
    return this.put<WorkspaceExperience>('/experience/workspace', { workspace });
  }

  storefront(): Observable<StorefrontAdmin> {
    return this.get<StorefrontAdmin>('/storefront');
  }

  saveStorefront(body: unknown): Observable<StorefrontAdmin> {
    return this.put<StorefrontAdmin>('/storefront', body);
  }

  saveOffering(body: unknown): Observable<StorefrontOffering> {
    return this.post<StorefrontOffering>('/storefront/offerings', body);
  }

  savePackage(body: unknown): Observable<StorefrontPackage> {
    return this.post<StorefrontPackage>('/storefront/packages', body);
  }

  savePortfolio(body: unknown): Observable<StorefrontPortfolio> {
    return this.post<StorefrontPortfolio>('/storefront/portfolio', body);
  }

  moderateReview(id: string, status: string): Observable<StorefrontReview> {
    return this.post<StorefrontReview>(`/storefront/reviews/${id}`, { status });
  }

  createSupplierLink(supplierId: string, email: string): Observable<{ id: string; email: string; expiresAt: string; token: string }> {
    return this.post('/storefront/supplier-links', { supplierId, email });
  }

  revokeSupplierLink(id: string): Observable<void> {
    return this.post<void>(`/storefront/supplier-links/${id}/revoke`, {});
  }

  publicCompany(slug: string): Observable<PublicCompany> {
    return this.get<PublicCompany>(`/public/companies/${slug}`);
  }

  submitInquiry(slug: string, body: unknown): Observable<PublicSubmission> {
    return this.post<PublicSubmission>(`/public/companies/${slug}/inquiries`, body);
  }

  submitOrder(slug: string, body: unknown): Observable<PublicSubmission> {
    return this.post<PublicSubmission>(`/public/companies/${slug}/orders`, body);
  }

  submitReview(slug: string, body: unknown): Observable<PublicSubmission> {
    return this.post<PublicSubmission>(`/public/companies/${slug}/reviews`, body);
  }

  companies(): Observable<{ companyId: string; companyName: string; role: string; isCurrent: boolean }[]> {
    return this.get('/companies/mine');
  }

  switchCompany(companyId: string): Observable<AuthResponse> {
    return this.post<AuthResponse>('/companies/switch', { companyId });
  }

  supplierPortal(token: string): Observable<SupplierPortalView> {
    return this.get<SupplierPortalView>(`/supplier-portal/${token}`);
  }
}
