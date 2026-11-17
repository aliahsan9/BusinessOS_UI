# Tenant AI employee tool access UI

The "My agents" marketplace exposes a tool-access editor backed by:

- `GET /api/v1/agents/employees/{agentKey}/permissions`
- `PUT /api/v1/agents/employees/{agentKey}/permissions`

The backend returns the valid tool-name catalog and the effective tenant allowlist. Owners/Admins can select the exact tools available to an employee. Saving updates the UI only after a successful API response.

An empty selection means the employee cannot invoke any tools. This does not grant the signed-in user additional permissions: the server requires both the employee allowlist and the user's BusinessOS RBAC permission. Existing write confirmation requirements remain in force.

This UI requires the backend migration and endpoint from BusinessOS PR #23 to be merged and deployed.
