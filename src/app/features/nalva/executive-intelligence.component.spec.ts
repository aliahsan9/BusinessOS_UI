import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { NalvaExecutiveIntelligenceComponent } from './executive-intelligence.component';
import { NalvaService } from '../../core/services/nalva.service';
import { ExecutiveDashboard } from '../../core/models/executive-intelligence.model';

describe('NalvaExecutiveIntelligenceComponent', () => {
  const dashboard: ExecutiveDashboard = {
    health: {
      currency: 'USD',
      period: 'month',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      salesRevenue: { value: 100, available: true, isPrediction: false, confidence: 'high' },
      collectedCash: { value: 80, available: true, isPrediction: false, confidence: 'high' },
      expenses: { value: 20, available: true, isPrediction: false, confidence: 'high' },
      grossProfit: { value: null, available: false, isPrediction: false, confidence: 'unavailable' },
      outstandingReceivables: { value: 10, available: true, isPrediction: false, confidence: 'high' },
      outstandingPayables: { value: 5, available: true, isPrediction: false, confidence: 'high' },
      lowStockCount: 0,
      churnRiskCount: 0,
      overdueInvoiceCount: 0,
      overallHealthLabel: 'healthy',
      formulas: [],
      limitations: [],
      dataClassification: 'REAL',
    },
    revenueForecast: {
      currency: 'USD',
      available: false,
      confidence: 'unavailable',
      method: 'none',
      nextPeriodPredicted: null,
      history: [],
      horizon: [],
      backtestMapePercent: null,
      assumptions: [],
      limitations: ['Insufficient history'],
      dataClassification: 'REAL',
      isPrediction: true,
    },
    periodComparison: {
      currency: 'USD',
      currentStart: new Date().toISOString(),
      currentEnd: new Date().toISOString(),
      priorStart: new Date().toISOString(),
      priorEnd: new Date().toISOString(),
      currentRevenue: 100,
      priorRevenue: 90,
      revenueChangePercent: 11.1,
      currentOrderCount: 2,
      priorOrderCount: 1,
      currentExpenses: 20,
      priorExpenses: 15,
      expenseChangePercent: 33.3,
      dataClassification: 'REAL',
    },
    sales: {
      currency: 'USD',
      period: 'month',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      salesRevenue: 100,
      averageOrderValue: 50,
      completedOrders: 2,
      forecast: {
        currency: 'USD',
        available: false,
        confidence: 'unavailable',
        method: 'none',
        nextPeriodPredicted: null,
        history: [],
        horizon: [],
        backtestMapePercent: null,
        assumptions: [],
        limitations: [],
        dataClassification: 'REAL',
        isPrediction: true,
      },
      topProducts: [],
      decliningProducts: [],
      conversion: {
        totalLeads: 0,
        convertedLeads: 0,
        leadConversionRate: 0,
        completedOrders: 2,
        cancelledOrders: 0,
        orderCompletionRate: 1,
        dataClassification: 'REAL',
        limitations: [],
      },
      opportunities: [],
      assumptions: [],
      limitations: [],
      dataClassification: 'REAL',
    },
    customers: {
      retention: {
        activeCustomers: 1,
        repeatCustomers: 0,
        repeatRate: 0,
        atRiskCustomers: 0,
        lostCustomers: 0,
        retentionEstimatePercent: null,
        confidence: 'unavailable',
        assumptions: [],
        limitations: [],
        isPrediction: false,
      },
      segments: [],
      churnRisks: [],
      retentionStrategies: [],
      dataClassification: 'REAL',
    },
    inventoryRisks: [],
    inventoryDemand: [],
    inventoryTurnover: [],
    cashFlow: null,
    finance: null,
    risks: [],
    recommendations: [],
    predictionAccuracy: {
      totalRecorded: 0,
      evaluated: 0,
      pending: 0,
      averageAbsolutePercentError: null,
      recent: [],
      dataClassification: 'REAL',
    },
    dataClassification: 'REAL',
    globalLimitations: ['Forecasts are estimates.'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NalvaExecutiveIntelligenceComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: NalvaService,
          useValue: {
            executiveDashboard: () => of(dashboard),
            executiveAsk: () =>
              of({
                questionKey: 'business-performance',
                question: 'How is my business performing?',
                answer: 'Healthy based on recorded data.',
                supportingMetrics: [],
                recommendedActions: [],
                assumptions: [],
                limitations: [],
                confidence: 'high',
                containsPredictions: false,
                dataClassification: 'REAL',
              }),
            createIntelligenceTask: () =>
              of({ created: true, taskId: '1', status: 'Queued', message: 'queued', requiresHumanApproval: false }),
          },
        },
      ],
    }).compileComponents();
  });

  it('creates and loads health label from recorded dashboard', () => {
    const fixture = TestBed.createComponent(NalvaExecutiveIntelligenceComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('healthy');
    expect(fixture.nativeElement.textContent).toContain('unavailable');
  });
});
