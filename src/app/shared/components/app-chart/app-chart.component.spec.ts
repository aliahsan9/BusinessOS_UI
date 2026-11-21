import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AppChartComponent } from './app-chart.component';

describe('AppChartComponent', () => {
  let fixture: ComponentFixture<AppChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppChartComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(AppChartComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
