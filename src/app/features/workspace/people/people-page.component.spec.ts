import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { PeoplePageComponent } from './people-page.component';
import { WorkspaceApiService } from '../workspace-api.service';

describe('PeoplePageComponent', () => {
  let fixture: ComponentFixture<PeoplePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PeoplePageComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { screen: 'employees' } } },
        },
        {
          provide: WorkspaceApiService,
          useValue: {
            employees: () => of({ items: [], totalCount: 0 }),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PeoplePageComponent);
    fixture.detectChanges();
  });

  it('loads the employee workspace', () => {
    expect(fixture.componentInstance.title()).toBe('Employees');
    expect(fixture.nativeElement.textContent).toContain('Employees');
  });
});
