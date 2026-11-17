# Tenant AI employee configuration UI

The "My agents" view exposes a tenant-scoped configuration editor backed by:

`PUT /api/v1/agents/employees/{agentKey}/configuration`

Editable fields are display name, role title, specialty and default language (English, Urdu, Roman Urdu or Arabic). The frontend intentionally does not send system prompts, agent keys, activation/default state, tool permissions or module access.

The backend implementation is in BusinessOS PR #19, which depends on backend PR #18. This UI branch depends on BusinessOS_UI PR #12 for the existing marketplace and activation changes. Merge those dependencies before deploying this UI.

The form reports backend validation/authorization errors and only updates the local catalog after a successful API response. It does not optimistically claim that a configuration was saved.

The chat client leaves language unset unless the user explicitly selects one, allowing the backend to apply the configured employee default. Explicit user language selection still takes precedence.
