# Sales Agent approval inbox (Angular)

The existing Nalva approvals route now uses the real BusinessOS Sales Agent proposal API instead of the legacy `NalvaService` approval endpoints.

## API dependency

This UI depends on backend PR #24 (proposal approval API) and PR #27 (one-time email execution):

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
- Provides a tenant-level toggle for Emma's `SendCustomerFollowUp` capability while preserving the employee's other allowed tools; only Owner/Admin can change it.
- Shows execution states: Executing, Executed, and ExecutionFailed.
- Warns reviewers that SMTP delivery attempts cannot be automatically retried.
- Handles missing backend endpoint, authorization failures, not-found and conflict responses.
- Removes a decided item from the pending list immediately after a successful server response.

## Safety boundary

The tenant Owner/Admin must first enable Emma's `SendCustomerFollowUp` capability. The user must then approve a proposal and explicitly click Execute. The backend revalidates the customer within the current tenant and claims the proposal once before sending a plain-text email. SMTP attempts are not automatically retried; failed or interrupted delivery requires manual reconciliation. No order, invoice, inventory, or customer data is mutated.

## Verification

The source changes are committed, but Angular build and tests have not been run in this environment. Deploy backend PRs #24 and #27 before enabling execution in this screen. Tenant-specific agent tool allow-lists must also be enforced before production use.
