import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NalvaApprovalsComponent } from './approvals.component';
import { NalvaService } from '../../core/services/nalva.service';
import { NalvaApproval, NalvaRunResult } from '../../core/models/nalva.model';

describe('NalvaApprovalsComponent', () => {
  let fixture: ComponentFixture<NalvaApprovalsComponent>;
  let component: NalvaApprovalsComponent;
  let api: jasmine.SpyObj<NalvaService>;

  const pending: NalvaApproval = {
    id: 'apr-1',
    executionId: 'ex-1',
    agentKey: 'sales',
    action: 'SendExternalEmail',
    toolName: 'SendExternalEmail',
    risk: 'High',
    status: 'Pending',
    requestedAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj('NalvaService', ['approvals', 'decide']);
    api.approvals.and.returnValue(of([pending]));
    const decideResult: NalvaRunResult = {
      executionId: 'ex-1',
      status: 'Completed',
      agentKey: 'sales',
      summary: 'Approval recorded',
      estimatedCostUsd: 0,
      costIsEstimate: true,
    };
    api.decide.and.returnValue(of(decideResult));

    await TestBed.configureTestingModule({
      imports: [NalvaApprovalsComponent],
      providers: [{ provide: NalvaService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(NalvaApprovalsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads pending approvals on init', () => {
    expect(api.approvals).toHaveBeenCalledWith('Pending');
    expect(component.rows()).toEqual([pending]);
    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeNull();
  });

  it('shows a permission error when the API returns 403', () => {
    api.approvals.and.returnValue(throwError(() => ({ status: 403, title: 'Forbidden' })));
    component.load();
    expect(component.error()).toContain('permission');
    expect(component.loading()).toBeFalse();
  });

  it('approves a pending row and reloads', () => {
    api.approvals.calls.reset();
    api.approvals.and.returnValue(of([]));
    component.decide(pending, 'approve');

    expect(api.decide).toHaveBeenCalledWith('apr-1', 'approve', undefined, undefined);
    expect(component.notice()).toContain('Approval recorded');
    expect(api.approvals).toHaveBeenCalled();
  });

  it('surfaces decide failures without clearing the row list', () => {
    api.decide.and.returnValue(throwError(() => ({ status: 404, title: 'Missing' })));
    component.decide(pending, 'reject');

    expect(component.error()).toContain('no longer available');
    expect(component.savingId()).toBeNull();
    expect(component.rows().length).toBe(1);
  });

  it('switches filter between pending and all', () => {
    api.approvals.calls.reset();
    api.approvals.and.returnValue(of([pending]));
    component.setFilter('all');
    expect(api.approvals).toHaveBeenCalledWith(undefined);
    expect(component.filter()).toBe('all');
  });
});
