# Phase 1 API Contract Alignment

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

## Contract rules

1. Frontend URLs include the configured API base URL; backend business routes are grouped under `/api/v1`.
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
