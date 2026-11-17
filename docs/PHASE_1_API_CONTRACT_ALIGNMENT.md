# Phase 1 API Contract Alignment

 phase-1/api-contract-alignment
This document tracks the frontend/backend integration work for Phase 1. It is based on the currently inspected `main` frontend and `master` backend source. It is not a runtime test report.

## Verified fix in this branch

| Frontend operation | Backend contract | Change |
| --- | --- | --- |
| `BillingService.downloadReceipt(id)` | `GET /api/v1/billing/invoices/{id}/download` | Reuse `downloadInvoice(id)`; the previous `/receipt` URL is not mapped by the backend. |

The API currently returns the issued invoice PDF. The frontend method name remains for compatibility with existing callers.

## Confirmed integration gaps

| Frontend service surface | Current backend surface | Phase 1 disposition |
| --- | --- | --- |
| `/nalva/overview`, `/nalva/agents/*`, `/nalva/tasks/*`, `/nalva/approvals/*`, `/nalva/knowledge/*`, `/nalva/settings` | `/agents/*` exposes chat, employee catalog, voice preferences, onboarding and workflow summaries. It does not expose the frontend's full Nalva resource contract. | Do not alias these routes blindly. Define DTOs and endpoint behavior before implementing the missing resource APIs, or adapt individual frontend screens to a verified backend contract. |
| `/experience/dashboard`, `/experience/workspace` | `/dashboard/overview` and analytics endpoints | Compare response DTOs and required dashboard widgets before adapting. Do not cast one response to the other. |
| `/storefront/*`, `/public/companies/*`, `/companies/*`, `/supplier-portal/*` | No corresponding endpoint groups are registered in the inspected API endpoint map. | Treat as unsupported until a backend implementation and authorization model exist. |
| `/integrations/*` | No corresponding integration endpoint group was found in the inspected API endpoint map. | Keep unavailable integrations clearly disabled; do not simulate successful connections. |
=======
This work is based on source inspection of the frontend `main` and backend `master` repositories. It is not a runtime verification report.

## Implemented in this branch

### Supported agent workflow reads

The backend exposes:

- `GET /api/v1/agents/workflows?limit=20` → `AgentWorkflowSummaryDto[]`
- `GET /api/v1/agents/workflows/{workflowId}` → `AgentWorkflowDto` or 404

The frontend now defines matching `AgentWorkflowSummary` and `AgentWorkflowDetail` DTOs and exposes them through `AgentEmployeeService.listWorkflows()` and `getWorkflow()`.

These are persisted agent execution workflows. They are not the same thing as saved automation definitions in the Nalva workflow builder. The builder's create, activate, run and test operations remain unsupported by the inspected backend surface and must not be mapped to these read endpoints.

The existing `/agents/employees`, chat, voice-preference, onboarding and TTS operations are already represented by `AgentEmployeeService`; avoid duplicating them under `/nalva`.

## Confirmed gaps

| Frontend surface | Backend contract | Disposition |
| --- | --- | --- |
| `/nalva/overview` | No equivalent aggregate overview endpoint found | Requires a defined DTO and tenant-scoped query/service; do not synthesize counters in the client |
| `/nalva/marketplace`, `/nalva/agents/*` | `/agents/employees` lists employee catalog only | Activation/configuration/execution lifecycle is not equivalent; do not infer it |
| `/nalva/tasks/*` | No task queue endpoints found in the registered agent API | Requires persistent task domain, authorization and lifecycle implementation |
| `/nalva/workflows/*` | `/agents/workflows` reads execution history only | Saved automation definitions and run controls need a separate backend feature |
| `/nalva/approvals/*` | No approval endpoints found in the registered agent API | Requires approval persistence, authorization and decision audit |
| `/nalva/knowledge/*`, `/nalva/memory/*` | No matching CRUD endpoints found in the registered agent API | Requires tenant-scoped storage and retention/security rules |
| `/nalva/analytics`, `/nalva/executions`, `/nalva/settings`, `/nalva/models` | No matching endpoints found in the registered agent API | Requires explicit contracts and backed data sources |
| `/integrations/*` | No corresponding integration endpoint group found in inspected API map | Keep unavailable integrations disabled; do not simulate success |

## Navla overview integration

The Navla overview screen now composes two existing, authenticated backend reads:

- `GET /api/v1/agents/employees` for the employee catalog and each employee's active flag.
- `GET /api/v1/agents/workflows?limit=20` for the signed-in user's recent execution workflows.

The screen displays only values present in those responses: employee count, active employee count, recent workflow count, and workflow details. It intentionally no longer calls the unsupported `/nalva/overview` endpoint or displays token, cost, task-queue, or approval figures that are not supplied by these contracts. If either read fails, the overview reports an error rather than substituting zeroes.


## Marketplace and employee detail integration

The marketplace and employee detail screens now use the supported employee catalog API rather than the unimplemented `/nalva/marketplace`, `/nalva/agents`, and `/nalva/agents/{key}` routes.

- Marketplace reads `GET /api/v1/agents/employees` and filters locally by specialty.
- The "My agents" route explicitly warns that tenant-specific activation is not implemented; it does not present the shared catalog as tenant-activated agents.
- Employee detail resolves the selected employee from the catalog and filters the latest 100 persisted execution workflow summaries by `agentKey`.
- Unsupported activation/deactivation, autonomy configuration, direct run, memory, cost, health and detailed execution metrics have been removed from these screens. No unsupported write operation is presented as working.


## Task queue and automation builder boundaries

The current backend does not expose persistent agent-task endpoints or saved automation-definition endpoints. The frontend no longer submits unsupported requests from these surfaces:

- Task queue: creation, scheduling, pause, resume and cancellation are explicitly marked unavailable.
- Automation builder: definition creation, trigger configuration, activation and dry-run are explicitly marked unavailable.
- Workflow history: displays persisted agent execution workflows from `GET /api/v1/agents/workflows`; it does not label those records as reusable automation definitions.
 main

## Contract rules

1. Frontend URLs include the configured API base URL; backend business routes are grouped under `/api/v1`.
 phase-1/api-contract-alignment
2. Preserve authentication and tenant context through the existing HTTP interceptors and API pipeline.
3. Match request DTOs, response DTOs, HTTP methods, status codes and permission requirements—not just route names.
4. Do not create success-shaped mock responses for unsupported server features.
5. Any endpoint addition must include authorization, tenant scoping, validation and focused API tests.

## Verification still required

- Run the Angular unit tests and production build locally.
- Run the backend unit and integration suites locally.
- Exercise the billing invoice download with an authenticated tenant.
- Complete a route-by-route contract matrix for all frontend services before declaring Phase 1 complete.

No runtime build or test result is claimed by this source-only change.
=======
2. Preserve existing authentication and tenant context through the shared HTTP pipeline.
3. Match request/response DTOs and semantics, not just route names.
4. Never map an execution workflow DTO onto a saved automation definition.
5. Do not create success-shaped mock responses for unsupported server features.
6. Any new endpoint requires authorization, tenant scoping, validation and focused API tests.

## Verification still required

- Run Angular unit tests and a production build locally.
- Run backend unit and integration suites locally.
- Exercise agent workflow list/detail endpoints with an authenticated tenant.
- Complete the remaining service-by-service contract matrix.

No runtime build or test result is claimed by this source-only change.


## Tenant-specific AI employee activation

The marketplace's "My agents" view now calls `PUT /api/v1/agents/employees/{agentKey}/activation` to activate or deactivate a non-default employee for the current tenant. The backend implementation is being delivered separately in BusinessOS PR #18. The API enforces tenant Owner/Admin roles, persists a tenant override, and leaves the shared catalog unchanged. Until the backend PR is merged and deployed, activation requests will fail and the UI will show an explicit error.
 main
