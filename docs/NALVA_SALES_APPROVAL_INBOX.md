# Sales Agent approval inbox (Angular)

The existing Nalva approvals route now uses the real BusinessOS Sales Agent proposal API instead of the legacy `NalvaService` approval endpoints.

## API dependency

This UI depends on backend PR #24 (`feature/sales-action-approval-workflow`) and PR #26 (`feature/sales-agent-email-execution`):

- `GET /api/v1/agents/actions/proposals?pendingOnly=true&limit=100`
- `GET /api/v1/agents/actions/proposals/{proposalId}`
- `POST /api/v1/agents/actions/proposals/{proposalId}/decision`
- `POST /api/v1/agents/actions/proposals/{proposalId}/execute`

The inbox currently uses list and decision operations. Detail retrieval is exposed in the service for future dedicated review pages.

## Behavior

- Defaults to pending proposals; reviewers can switch to all proposals.
- Displays title, action type, summary, created/expiry/decision timestamps, and the JSON payload for inspection.
- Supports optional reviewer comments (maximum 500 characters).
- Supports approve, reject, and one-time execution of approved customer follow-up emails.
- Shows execution states: Executing, Executed, and ExecutionFailed.
- Warns reviewers that SMTP delivery attempts cannot be automatically retried.
- Handles missing backend endpoint, authorization failures, not-found and conflict responses.
- Removes a decided item from the pending list immediately after a successful server response.

## Safety boundary

The UI explicitly tells reviewers that approval records consent only. It does not send customer messages or mutate orders, invoices, inventory, or other business data. Execution must be implemented separately with server-side permission revalidation, idempotency, and provider result logging.

## Verification

The source changes are committed, but Angular build and tests have not been run in this environment. Deploy backend PRs #24 and #26 before enabling execution in this screen. Tenant-specific agent tool allow-lists from backend PR #22 must also be merged and enforced before production use.
