import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginationHelper } from '../../core/helpers/pagination.helper';
import { BaseApiService } from '../../core/services/base-api.service';

export interface Page<T> {
  items: T[];
  totalCount: number;
}

export interface EmployeeRow {
  id: string;
  employeeCode?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  departmentName?: string;
  teamName?: string;
  employmentStatus: string;
  isActive: boolean;
  salary?: number | null;
}

export interface DepartmentRow {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface TeamRow {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  memberCount: number;
  isActive: boolean;
}

export interface AttendanceRow {
  id: string;
  employeeName: string;
  workDate: string;
  checkInAt?: string;
  checkOutAt?: string;
  workedHours?: number;
  isLate: boolean;
  isEarlyDeparture: boolean;
}

export interface LeaveTypeRow {
  id: string;
  name: string;
  defaultDays: number;
  isPaid: boolean;
}

export interface LeaveRow {
  id: string;
  employeeName: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason?: string;
  remainingBalance?: number | null;
}

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  audience: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

export interface GoalRow {
  id: string;
  employeeId: string;
  title: string;
  kpiName?: string;
  targetValue: number;
  currentValue: number;
  status: string;
}

export interface StageRow {
  id: string;
  name: string;
  sortOrder: number;
  isWon: boolean;
  isLost: boolean;
}

export interface LeadRow {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  source: string;
  priority: string;
  stageId?: string;
  stageName?: string;
  estimatedValue: number;
  customerId?: string;
}

export interface DealRow {
  id: string;
  title: string;
  value: number;
  probability: number;
  status: string;
  expectedCloseDate?: string;
  customerId?: string;
}

export interface FollowUpRow {
  id: string;
  title: string;
  dueAt: string;
  priority: string;
  status: string;
  isOverdue: boolean;
}

export interface SegmentRow {
  id: string;
  name: string;
  customerType?: string;
  industry?: string;
  country?: string;
  tag?: string;
  minSpend?: number | null;
  matchCount: number;
}

export interface CrmAnalytics {
  totalLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  activeDeals: number;
  wonDeals: number;
  pipelineValue: number;
  conversionRate: number;
}

export interface WarehouseRow {
  id: string;
  name: string;
  code?: string;
  address?: string;
  isDefault: boolean;
}

export interface WarehouseStockRow {
  productId: string;
  productName: string;
  onHand: number;
  reserved: number;
  available: number;
}

export interface AlertRow {
  productId: string;
  productName: string;
  onHand: number;
  reorderLevel: number;
  alert: string;
}

export interface ReturnRow {
  id: string;
  returnNumber: string;
  orderId: string;
  status: string;
  restock: boolean;
  refundAmount: number;
}

export interface IncomeRow {
  id: string;
  category: string;
  amount: number;
  occurredOn: string;
  paymentMethod: string;
  status: string;
  reference?: string;
}

export interface PurchaseInvoiceRow {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  total: number;
  amountPaid: number;
  status: string;
  dueDate: string;
}

export interface TaxRateRow {
  id: string;
  name: string;
  ratePercent: number;
  isInclusive: boolean;
  isDefault: boolean;
}

export interface SubscriptionRow {
  id: string;
  provider: string;
  name: string;
  billingCycle: string;
  cost: number;
  currency: string;
  renewalDate: string;
  paymentStatus: string;
}

export interface CashFlowRow {
  openingBalance: number;
  inflows: number;
  outflows: number;
  closingBalance: number;
  outstandingReceivables: number;
  outstandingPayables: number;
}

export interface ProfitRow {
  recognizedRevenue: number;
  invoicedAmount: number;
  cashReceived: number;
  costOfGoodsSold: number;
  grossProfit: number;
  operatingExpenses: number;
  netProfit: number;
}

export interface ProjectRow {
  id: string;
  name: string;
  code?: string;
  status: string;
  workflow: string;
  deadline?: string;
  budget?: number | null;
  customerId?: string;
}

export interface ProjectProgress {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  milestonesOpen: number;
  milestonesDone: number;
  hoursLogged: number;
  budget?: number | null;
  billableAmount: number;
  remainingBudget: number;
  progressPercent: number;
}

export interface MilestoneRow {
  id: string;
  name: string;
  status: string;
  dueDate?: string;
  isClientVisible: boolean;
}

export interface TaskRow {
  id: string;
  projectId: string;
  title: string;
  status: string;
  stage?: string;
  taskKind: string;
  priority: number;
  dueDate?: string;
  assignedUserId?: string;
  isClientVisible: boolean;
}

export interface TimeRow {
  id: string;
  projectId?: string;
  userId: string;
  hours: number;
  isBillable: boolean;
  hourlyRate?: number | null;
  status: string;
  startedAt?: string;
  endedAt?: string;
}

export interface ClientAccessRow {
  id: string;
  email: string;
  expiresAt: string;
  token: string;
}

export interface PortalProject {
  id: string;
  name: string;
  status: string;
  deadline?: string;
  milestones: MilestoneRow[];
  tasks: TaskRow[];
  files: { id: string; fileName: string; sizeBytes: number }[];
}

export function workspaceError(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as { title?: string; detail?: string } | string | null;
    if (typeof body === 'string' && body.trim()) {
      return body;
    }
    if (body && typeof body === 'object') {
      return body.detail || body.title || error.message;
    }
    return error.message;
  }
  return 'The request could not be completed.';
}

@Injectable({ providedIn: 'root' })
export class WorkspaceApiService extends BaseApiService {
  employees(search?: string): Observable<Page<EmployeeRow>> {
    return this.get('/workforce/employees', { search, page: 1, pageSize: 50 });
  }

  saveEmployee(body: unknown): Observable<EmployeeRow> {
    return this.post('/workforce/employees', body);
  }

  setEmployeeActive(id: string, active: boolean): Observable<void> {
    return this.post(`/workforce/employees/${id}/${active ? 'activate' : 'deactivate'}`, {});
  }

  departments(): Observable<DepartmentRow[]> {
    return this.get('/workforce/departments');
  }

  saveDepartment(body: unknown): Observable<DepartmentRow> {
    return this.post('/workforce/departments', body);
  }

  teams(): Observable<TeamRow[]> {
    return this.get('/workforce/teams');
  }

  saveTeam(body: unknown): Observable<TeamRow> {
    return this.post('/workforce/teams', body);
  }

  attendance(): Observable<Page<AttendanceRow>> {
    return this.get('/workforce/attendance', { page: 1, pageSize: 31 });
  }

  checkIn(): Observable<AttendanceRow> {
    return this.http.post<AttendanceRow>(`${this.baseUrl}/workforce/attendance/check-in`, {}, { withCredentials: true });
  }

  checkOut(): Observable<AttendanceRow> {
    return this.http.post<AttendanceRow>(`${this.baseUrl}/workforce/attendance/check-out`, {}, { withCredentials: true });
  }

  leaveTypes(): Observable<LeaveTypeRow[]> {
    return this.get('/workforce/leave-types');
  }

  saveLeaveType(body: unknown): Observable<LeaveTypeRow> {
    return this.post('/workforce/leave-types', body);
  }

  leaveRequests(): Observable<Page<LeaveRow>> {
    return this.get('/workforce/leave-requests', { page: 1, pageSize: 50 });
  }

  applyLeave(body: unknown): Observable<LeaveRow> {
    return this.post('/workforce/leave-requests', body);
  }

  decideLeave(id: string, approve: boolean, reason?: string): Observable<LeaveRow> {
    return approve
      ? this.post(`/workforce/leave-requests/${id}/approve`, {})
      : this.post(`/workforce/leave-requests/${id}/reject`, { reason });
  }

  announcements(): Observable<AnnouncementRow[]> {
    return this.get('/workforce/announcements');
  }

  saveAnnouncement(body: unknown): Observable<AnnouncementRow> {
    return this.post('/workforce/announcements', body);
  }

  markAnnouncementRead(id: string): Observable<void> {
    return this.post(`/workforce/announcements/${id}/read`, {});
  }

  goals(): Observable<GoalRow[]> {
    return this.get('/workforce/goals');
  }

  saveGoal(body: unknown): Observable<GoalRow> {
    return this.post('/workforce/goals', body);
  }

  reviews(employeeId: string): Observable<{ id: string; periodLabel: string; rating: number; feedback?: string; status: string }[]> {
    return this.get('/workforce/reviews', { employeeId });
  }

  saveReview(body: unknown): Observable<unknown> {
    return this.post('/workforce/reviews', body);
  }

  stages(): Observable<StageRow[]> {
    return this.get('/crm/stages');
  }

  leads(): Observable<Page<LeadRow>> {
    return this.get('/crm/leads', { page: 1, pageSize: 100 });
  }

  saveLead(body: unknown): Observable<LeadRow> {
    return this.post('/crm/leads', body);
  }

  moveLead(id: string, stageId: string): Observable<LeadRow> {
    return this.post(`/crm/leads/${id}/stage`, { stageId });
  }

  convertLead(id: string): Observable<{ customerId: string; dealId?: string; customerCreated: boolean }> {
    return this.post(`/crm/leads/${id}/convert`, {});
  }

  deals(): Observable<Page<DealRow>> {
    return this.get('/crm/deals', { page: 1, pageSize: 50 });
  }

  saveDeal(body: unknown): Observable<DealRow> {
    return this.post('/crm/deals', body);
  }

  winDeal(id: string): Observable<DealRow> {
    return this.http.post<DealRow>(`${this.baseUrl}/crm/deals/${id}/win`, {}, {
      params: PaginationHelper.toHttpParams({ createProject: false }),
      withCredentials: true,
    });
  }

  followUps(overdue = false): Observable<Page<FollowUpRow>> {
    return this.get('/crm/follow-ups', { overdue, page: 1, pageSize: 50 });
  }

  saveFollowUp(body: unknown): Observable<FollowUpRow> {
    return this.post('/crm/follow-ups', body);
  }

  completeFollowUp(id: string): Observable<FollowUpRow> {
    return this.post(`/crm/follow-ups/${id}/complete`, {});
  }

  segments(): Observable<SegmentRow[]> {
    return this.get('/crm/segments');
  }

  saveSegment(body: unknown): Observable<SegmentRow> {
    return this.post('/crm/segments', body);
  }

  analytics(): Observable<CrmAnalytics> {
    return this.get('/crm/analytics');
  }

  addInteraction(body: unknown): Observable<unknown> {
    return this.post('/crm/interactions', body);
  }

  warehouses(): Observable<WarehouseRow[]> {
    return this.get('/operations/warehouses');
  }

  saveWarehouse(body: unknown): Observable<WarehouseRow> {
    return this.post('/operations/warehouses', body);
  }

  warehouseStock(id: string): Observable<WarehouseStockRow[]> {
    return this.get(`/operations/warehouses/${id}/stock`);
  }

  alerts(): Observable<AlertRow[]> {
    return this.get('/operations/alerts');
  }

  transfer(body: unknown): Observable<void> {
    return this.post('/operations/transfers', body);
  }

  returns(): Observable<ReturnRow[]> {
    return this.get('/operations/returns');
  }

  createReturn(body: unknown): Observable<ReturnRow> {
    return this.post('/operations/returns', body);
  }

  decideReturn(id: string, body: unknown): Observable<ReturnRow> {
    return this.post(`/operations/returns/${id}/decide`, body);
  }

  income(): Observable<Page<IncomeRow>> {
    return this.get('/operations/income', { page: 1, pageSize: 50 });
  }

  saveIncome(body: unknown): Observable<IncomeRow> {
    return this.post('/operations/income', body);
  }

  purchaseInvoices(): Observable<PurchaseInvoiceRow[]> {
    return this.get('/operations/purchase-invoices');
  }

  savePurchaseInvoice(body: unknown): Observable<PurchaseInvoiceRow> {
    return this.post('/operations/purchase-invoices', body);
  }

  payPurchaseInvoice(id: string, body: unknown): Observable<PurchaseInvoiceRow> {
    return this.post(`/operations/purchase-invoices/${id}/pay`, body);
  }

  taxRates(): Observable<TaxRateRow[]> {
    return this.get('/operations/tax-rates');
  }

  saveTaxRate(body: unknown): Observable<TaxRateRow> {
    return this.post('/operations/tax-rates', body);
  }

  subscriptions(): Observable<SubscriptionRow[]> {
    return this.get('/operations/subscriptions');
  }

  saveSubscription(body: unknown): Observable<SubscriptionRow> {
    return this.post('/operations/subscriptions', body);
  }

  cashFlow(from: string, to: string): Observable<CashFlowRow> {
    return this.get('/operations/reports/cash-flow', { from, to });
  }

  profitAndLoss(from: string, to: string): Observable<ProfitRow> {
    return this.get('/operations/reports/profit-and-loss', { from, to });
  }

  projects(): Observable<Page<ProjectRow>> {
    return this.get('/project-ops/projects', { page: 1, pageSize: 50 });
  }

  saveProject(body: unknown): Observable<ProjectRow> {
    return this.post('/project-ops/projects', body);
  }

  progress(id: string): Observable<ProjectProgress> {
    return this.get(`/project-ops/projects/${id}/progress`);
  }

  milestones(id: string): Observable<MilestoneRow[]> {
    return this.get(`/project-ops/projects/${id}/milestones`);
  }

  saveMilestone(body: unknown): Observable<MilestoneRow> {
    return this.post('/project-ops/milestones', body);
  }

  tasks(projectId?: string): Observable<Page<TaskRow>> {
    return this.get('/project-ops/tasks', { projectId, page: 1, pageSize: 100 });
  }

  saveTask(body: unknown, id?: string): Observable<TaskRow> {
    return id ? this.put(`/project-ops/tasks/${id}`, body) : this.post('/project-ops/tasks', body);
  }

  time(projectId?: string): Observable<Page<TimeRow>> {
    return this.get('/project-ops/time', { projectId, page: 1, pageSize: 50 });
  }

  saveTime(body: unknown): Observable<TimeRow> {
    return this.post('/project-ops/time', body);
  }

  startTimer(projectId?: string): Observable<TimeRow> {
    return this.http.post<TimeRow>(`${this.baseUrl}/project-ops/time/start`, {}, {
      params: PaginationHelper.toHttpParams({ projectId, billable: true }),
      withCredentials: true,
    });
  }

  stopTimer(): Observable<TimeRow> {
    return this.post('/project-ops/time/stop', {});
  }

  approveTime(id: string): Observable<TimeRow> {
    return this.post(`/project-ops/time/${id}/approve`, {});
  }

  clientAccess(projectId: string, email: string): Observable<ClientAccessRow> {
    return this.http.post<ClientAccessRow>(`${this.baseUrl}/project-ops/projects/${projectId}/client-access`, {}, {
      params: PaginationHelper.toHttpParams({ email }),
      withCredentials: true,
    });
  }

  billProject(projectId: string, dueDate: string): Observable<{ invoiceId?: string; orderId?: string }> {
    return this.post('/workflows/projects/bill', { projectId, dueDate });
  }

  portal(token: string): Observable<PortalProject[]> {
    return this.get(`/portal/${encodeURIComponent(token)}`);
  }

  portalFeedback(token: string, projectId: string, message: string): Observable<void> {
    return this.post(`/portal/${encodeURIComponent(token)}/feedback`, { projectId, message });
  }
}
