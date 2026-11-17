# Navla AI employee tool permissions UI

## Location
The permission editor is part of the tenant-scoped AI Employee configuration panel in the marketplace's **My Agents** view.

## Behavior
- Displays tool checkboxes based on the current backend registered tool catalog from `GET /api/v1/agents/tools`.
- Tool names and descriptions come directly from the dependency-injected `IAiToolRegistry`; the frontend no longer maintains a duplicate hardcoded tool list.
- Loads a saved tenant-specific allow-list from the employee DTO.
- If the API returns `allowedTools: null`, the editor preselects the currently known tools so the first save preserves existing broad access rather than unexpectedly disabling tools.
- `Save tool permissions` sends the full selected list to `PUT /api/v1/agents/employees/{agentKey}/permissions`.
- An empty list is intentional and means no tools are allowed.
- Owners/Admins are authorized by the backend; the UI does not treat client-side visibility as a security boundary.
- The existing user permission check still limits the effective access at execution time.

## Backend dependency
This UI depends on BusinessOS backend PR #22, which adds the permissions endpoint, returns `allowedTools` on the employee DTO, and exposes the registered tool catalog at `GET /api/v1/agents/tools`. PR #22 is currently stacked on backend PR #21. Merge and deploy the backend changes before enabling this UI in production.

## Verification
Angular build and tests have not been executed in this environment. Run the frontend production build and relevant unit tests after checking out this branch. Verify these cases against a backend with the migration applied:
1. Save a subset of tools and reload the page.
2. Save an empty list and verify the employee cannot execute tools.
3. Attempt the endpoint as a non-Owner/Admin and expect 403.
4. Verify one tenant's saved permissions do not appear in another tenant.
5. Verify the effective permission remains the intersection of employee policy and user permissions.


## Automated API contract coverage
`src/app/core/services/agent-employee.service.spec.ts` covers:
- Fetching the registered tool catalog from `GET /agents/tools`.
- Saving a full allow-list, including an intentionally empty list.
- URL-encoding employee keys in the permissions route.

The specs are committed but have not been executed in this environment.
