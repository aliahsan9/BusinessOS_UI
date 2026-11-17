import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AgentEmployeeService } from './agent-employee.service';
import { AiContextService } from './ai-context.service';
import { TokenService } from './token.service';
import { AiConversationSessionStore } from './ai-conversation-session.store';
import { environment } from '../../../environments/environment';

describe('AgentEmployeeService tool permissions API', () => {
  let service: AgentEmployeeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AgentEmployeeService,
        { provide: AiContextService, useValue: {} },
        { provide: TokenService, useValue: {} },
        { provide: AiConversationSessionStore, useValue: {} },
      ],
    });

    service = TestBed.inject(AgentEmployeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loads the registered tool catalog from the backend', () => {
    const catalog = [
      { name: 'GetInventorySummary', description: 'Read inventory totals.' },
      { name: 'CreateProduct', description: 'Create a product.' },
    ];

    service.listToolCatalog().subscribe((result) => {
      expect(result).toEqual(catalog);
    });

    const request = httpMock.expectOne(`${environment.apiUrl}/agents/tools`);
    expect(request.request.method).toBe('GET');
    request.flush(catalog);
  });

  it('saves the complete employee allow-list, including an intentionally empty list', () => {
    const employee = {
      key: 'sales-assistant',
      displayName: 'Sales Assistant',
      roleTitle: 'Sales',
      specialty: 'Sales',
      defaultLanguage: 'en',
      isDefault: false,
      isActive: true,
      allowedTools: [],
    };

    service.updateEmployeeToolPermissions('sales-assistant', { allowedTools: [] }).subscribe((result) => {
      expect(result.allowedTools).toEqual([]);
    });

    const request = httpMock.expectOne(
      `${environment.apiUrl}/agents/employees/sales-assistant/permissions`,
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ allowedTools: [] });
    request.flush(employee);
  });

  it('encodes an employee key before building the permissions URL', () => {
    service.updateEmployeeToolPermissions('sales/assistant', {
      allowedTools: ['GetCustomers'],
    }).subscribe();

    const request = httpMock.expectOne(
      `${environment.apiUrl}/agents/employees/sales%2Fassistant/permissions`,
    );
    expect(request.request.method).toBe('PUT');
    request.flush({
      key: 'sales/assistant',
      displayName: 'Sales Assistant',
      roleTitle: 'Sales',
      specialty: 'Sales',
      defaultLanguage: 'en',
      isDefault: false,
      isActive: true,
      allowedTools: ['GetCustomers'],
    });
  });
});
