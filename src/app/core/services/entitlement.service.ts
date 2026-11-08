import { Injectable, inject, signal } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';
import { BillingService } from './billing.service';
import {
  BillingUsageDto,
  isAtLimit,
  isOverLimit,
  remainingAllowance,
} from '../models/billing.model';

export type QuotaResourceKey = 'users' | 'customers' | 'products' | 'projects' | 'tasks' | 'storage' | 'ai';

@Injectable({ providedIn: 'root' })
export class EntitlementService {
  private readonly billing = inject(BillingService);
  private inFlight: Observable<BillingUsageDto> | null = null;

  readonly usage = signal<BillingUsageDto | null>(null);

  refresh(force = false): Observable<BillingUsageDto> {
    const current = this.usage();
    if (!force && current) {
      return of(current);
    }
    if (!force && this.inFlight) {
      return this.inFlight;
    }

    this.inFlight = this.billing.getUsage().pipe(
      tap((usage) => this.usage.set(usage)),
      shareReplay(1),
      finalize(() => {
        this.inFlight = null;
      }),
    );
    return this.inFlight;
  }

  isBlocked(resource: QuotaResourceKey, usage = this.usage()): boolean {
    if (!usage) return false;
    const { current, max } = this.pair(resource, usage);
    return isAtLimit(current, max) || isOverLimit(current, max);
  }

  isOver(resource: QuotaResourceKey, usage = this.usage()): boolean {
    if (!usage) return false;
    const { current, max } = this.pair(resource, usage);
    return isOverLimit(current, max);
  }

  summary(resource: QuotaResourceKey, usage = this.usage()): string | null {
    if (!usage) return null;
    const { current, max, label } = this.pair(resource, usage);
    if (max === -1) return `${label}: unlimited`;
    const remaining = remainingAllowance(current, max);
    if (resource === 'storage') {
      return `Storage: ${this.storageLabel(usage)} / ${max.toLocaleString()} MB`;
    }
    return `${label}: ${current.toLocaleString()} / ${max.toLocaleString()} · ${remaining.toLocaleString()} remaining`;
  }

  message(resource: QuotaResourceKey, usage = this.usage()): string | null {
    if (!usage || !this.isBlocked(resource, usage)) return null;
    const { current, max, noun } = this.pair(resource, usage);
    if (max === 0) {
      return `Your current plan does not include additional ${noun}. Upgrade your subscription to continue.`;
    }
    if (current > max) {
      return `${this.title(resource)} is over the plan allowance (${current.toLocaleString()} of ${max.toLocaleString()}). Existing records stay available. You cannot add more until you upgrade or reduce usage.`;
    }
    return `Maximum ${noun} allowance reached (${current.toLocaleString()} / ${max.toLocaleString()}). You cannot add another on your current plan. Upgrade your subscription to increase capacity.`;
  }

  private storageLabel(usage: BillingUsageDto): string {
    const mb = (usage.storageUsedBytes ?? usage.storageUsedMb * 1024 * 1024) / (1024 * 1024);
    if (mb === 0) return '0';
    if (mb >= 100) return mb.toFixed(0);
    if (mb >= 10) return mb.toFixed(1);
    return mb.toFixed(2);
  }

  private title(resource: QuotaResourceKey): string {
    return this.pair(resource, this.usage() ?? emptyUsage()).label;
  }

  private pair(resource: QuotaResourceKey, usage: BillingUsageDto): { current: number; max: number; label: string; noun: string } {
    switch (resource) {
      case 'users':
        return { current: usage.userCount, max: usage.maxUsers, label: 'Users', noun: 'user' };
      case 'customers':
        return { current: usage.customerCount, max: usage.maxCustomers, label: 'Customers', noun: 'customer' };
      case 'products':
        return { current: usage.productCount, max: usage.maxProducts, label: 'Products', noun: 'product' };
      case 'projects':
        return { current: usage.projectCount, max: usage.maxProjects, label: 'Projects', noun: 'project' };
      case 'tasks':
        return { current: usage.taskCount, max: usage.maxTasks, label: 'Tasks', noun: 'task' };
      case 'ai':
        return { current: usage.aiRequestsUsed, max: usage.maxAiRequests, label: 'AI requests', noun: 'AI request' };
      case 'storage':
        return {
          current: usage.storageOverLimit ? usage.maxStorageMb + 1 : usage.storageUsedMb,
          max: usage.maxStorageMb,
          label: 'Storage',
          noun: 'storage',
        };
    }
  }
}

function emptyUsage(): BillingUsageDto {
  return {
    userCount: 0,
    maxUsers: 0,
    customerCount: 0,
    maxCustomers: 0,
    productCount: 0,
    maxProducts: 0,
    projectCount: 0,
    maxProjects: 0,
    taskCount: 0,
    maxTasks: 0,
    storageUsedMb: 0,
    maxStorageMb: 0,
    aiRequestsUsed: 0,
    maxAiRequests: 0,
    aiRequestsRemaining: 0,
    usersAreCustom: false,
    aiRequestsAreCustom: false,
    lastCalculatedAt: '',
  };
}
