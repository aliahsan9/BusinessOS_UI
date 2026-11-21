import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FinancialDashboardComponent } from './financial-dashboard.component';

describe('FinancialDashboardComponent', () => {
  let fixture: ComponentFixture<FinancialDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinancialDashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(FinancialDashboardComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
