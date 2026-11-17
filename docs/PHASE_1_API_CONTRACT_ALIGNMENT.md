# Phase 1 API Contract Alignment

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

## Contract rules

1. Frontend URLs include the configured API base URL; backend business routes are grouped under `/api/v1`.
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
