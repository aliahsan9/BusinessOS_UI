# Sales Agent approval inbox (Angular)

The existing Nalva approvals route now uses the real BusinessOS Sales Agent proposal API instead of the legacy `NalvaService` approval endpoints.

## API dependency

This UI depends on backend PR #24 (`feature/sales-action-approval-workflow`):

- `GET /api/v1/agents/actions/proposals?pendingOnly=true&limit=100`
- `GET /api/v1/agents/actions/proposals/{proposalId}`
- `POST /api/v1/agents/actions/proposals/{proposalId}/decision`

The inbox currently uses list and decision operations. Detail retrieval is exposed in the service for future dedicated review pages.

## Behavior

- Defaults to pending proposals; reviewers can switch to all proposals.
- Displays title, action type, summary, created/expiry/decision timestamps, and the JSON payload for inspection.
- Supports optional reviewer comments (maximum 500 characters).
- Supports approve and reject only.
- Handles missing backend endpoint, authorization failures, not-found and conflict responses.
- Removes a decided item from the pending list immediately after a successful server response.

## Safety boundary

The UI explicitly tells reviewers that approval records consent only. It does not send customer messages or mutate orders, invoices, inventory, or other business data. Execution must be implemented separately with server-side permission revalidation, idempotency, and provider result logging.

## Verification

The source changes are committed, but Angular build and tests have not been run in this environment. Deploy backend PR #24 before enabling this screen for users.
