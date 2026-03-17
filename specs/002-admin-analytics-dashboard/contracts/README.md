# Contracts: Platform Analytics Dashboard

**No new external API contracts.**

This feature is a read-only SSR Astro page that consumes existing internal API endpoints via `ApiClient`. It does not expose any new endpoints, commands, or public interfaces.

## Consumed Endpoints (existing)

| Endpoint | Method | Used For |
|----------|--------|----------|
| `/api/v1/labs?fields=projects,kpiresults,transport_modes` | GET | All living labs with KPI results and measures |
| `/api/v1/kpidefinitions` | GET | All KPI definitions |
| `/api/v1/projects` | GET | All measures/projects |
| `/api/v1/users` | GET | All users (requires new `getUsers()` on ApiClient) |

## New ApiClient Method

One new method added to `ApiClient.ts`:

```typescript
async getUsers(options?: { status?: string }): Promise<User[] | null>
```

This method wraps the existing `/api/v1/users` endpoint which already supports status filtering. It follows the same pattern as other ApiClient methods.
