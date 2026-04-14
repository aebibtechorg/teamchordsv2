# TeamChords v2 — Copilot Instructions

## Project Overview

TeamChords is a multi-tenant SaaS application for managing chord sheets and setlists. Organizations own chord sheets and setlists; outputs wire chord sheets to setlist slots for live display. Real-time collaboration is powered by SignalR.

## Architecture

| Layer | Technology |
|-------|-----------|
| API | ASP.NET Core 9 Minimal APIs, .NET Aspire 13.1 orchestration |
| Database | PostgreSQL via EF Core 9 (`Aspire.Npgsql.EntityFrameworkCore.PostgreSQL`) |
| Auth | Auth0 JWT Bearer — configure `Auth0:Domain` + `Auth0:Audience` in `appsettings.json` |
| Real-time | SignalR with optional Redis backplane (`ConnectionStrings__Redis`) |
| Logging | Serilog (Console + File sinks, configured via `appsettings.json`) |
| API docs | Scalar at `/scalar/v1` (dev only) |
| Frontend | React 19 + Vite 7 + Tailwind CSS 4 |
| State | Zustand 5 stores in `web/src/store/` |
| Routing | React Router v7 (routes defined in `web/src/router.jsx`) |

## Backend Patterns

### Adding a New Resource Endpoint

1. Create `tcv2.Api/Endpoints/{Resource}Endpoints.cs` as an `internal static class` with an extension method on `RouteGroupBuilder`:

```csharp
internal static class WidgetEndpoints
{
    public static RouteGroupBuilder MapWidgetEndpoints(this RouteGroupBuilder api)
    {
        var widgets = api.MapGroup("/widgets");
        // ... handlers here
        return api;
    }
}
```

2. Register in `Program.cs`: `api.MapWidgetEndpoints();`

### DTO / Entity / Mapper Triad

Every resource has three parts — always create all three together:

- **Entity**: `tcv2.Api/Data/Entities/{Resource}.cs` — EF Core model, `Guid Id` PK, `DateTime CreatedAt`, `DateTime? UpdatedAt`
- **DTO**: `tcv2.Api/Data/Dto/{Resource}Dto.cs` — DataAnnotation attributes for validation
- **Mapper**: `tcv2.Api/Data/Mappers/{Resource}Mappers.cs` — three extension methods:
  - `ToDto(this {Resource} entity)` — entity → DTO
  - `ToEntity(this {Resource}Dto dto)` — DTO → new entity, sets `CreatedAt = DateTime.UtcNow`
  - `UpdateFromDto(this {Resource} entity, {Resource}Dto dto)` — mutates entity, sets `UpdatedAt = DateTime.UtcNow`

### Validation & Error Handling

```csharp
// Validate a DTO (returns BadRequest with error list, or null if valid)
var err = EndpointHelpers.Validate(dto);
if (err is not null) return err;

// Handle EF constraint violations (returns 409 Conflict for unique violations)
catch (DbUpdateException ex) { return EndpointHelpers.HandleDbUpdateException(ex); }
```

### Auth0 User Identity

Extract the Auth0 user ID in a handler via:

```csharp
var auth0UserId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
```

### Paginated List Response

All list endpoints use `EndpointHelpers.ApplyPagingAndFilter()` which returns:

```json
{ "items": [...], "total": 0, "page": 1, "pageSize": 20 }
```

Query params: `page` (1-based, default 1), `pageSize` (default 20), `sortBy`, `sortDir` (asc|desc).

### Text Search

Use `EF.Functions.ILike(x.Field!, $"%{value}%")` for case-insensitive PostgreSQL text filtering.

### Database Context

`AppDbContext` is in `tcv2.Api/Data/AppDbContext.cs`. Register new `DbSet<T>` properties there and configure relationships in `OnModelCreating`.

### Public Endpoints (no auth)

All routes under `/api` require authorization by default. Add `.AllowAnonymous()` to any handler that should be public.

### SignalR Hubs

- Hubs live in `tcv2.Api/Hubs/`
- Define server-to-client methods in a `I{Resource}Client` interface
- Inherit `Hub<I{Resource}Client>`
- Register a hub in `Program.cs`: `app.MapHub<MyHub>("/hubs/myresource");`

## Frontend Patterns

### All API calls use `apiFetch`

**Never use raw `fetch()`**. Always import and use `apiFetch` from `web/src/utils/api.js` — it automatically injects the Auth0 Bearer token:

```js
import { apiFetch } from '../utils/api';

const res = await apiFetch('/api/widgets');
const data = await res.json();
```

### File Placement

| What | Where |
|------|-------|
| New page | `web/src/pages/{PageName}.jsx` |
| New component | `web/src/components/{ComponentName}.jsx` |
| API utility functions for a resource | `web/src/utils/{resource}.js` |
| Global state store | `web/src/store/use{Domain}Store.js` |

### Routing

Add new routes to `web/src/router.jsx`. Wrap protected routes in `<Protected>`. Use `<App>` layout (with sidebar) or `<NoSidebar>` for auth-only pages.

### State Management

- **Global / cross-page state** → Zustand store in `web/src/store/`
- **Local UI state** → `useState` in the component
- Existing stores: `useAuthStore`, `useProfileStore`, `useSongSelectionStore`

### Real-time (SignalR)

Use `@microsoft/signalr` (`HubConnectionBuilder`) to connect to `/hubs/{resource}`. The hub URL is proxied via Vite in dev (`vite.config.js`).

## Build & Run

```bash
# Full stack (Aspire orchestrator — API + PostgreSQL + Redis + web)
cd tcv2.AppHost && dotnet run

# API only (hot reload)
cd tcv2.Api && dotnet watch run

# Frontend only
cd web && npm run dev

# EF Core migrations
cd tcv2.Api
dotnet ef migrations add <MigrationName> --project tcv2.Api.csproj
dotnet ef database update
```

## Key Entities

| Entity | Key Fields |
|--------|-----------|
| `Organization` | `Id`, `Name` — top-level multi-tenant container |
| `User` | `Id`, `Auth0UserId`, `Email` — linked to Auth0 identity |
| `Profile` | 1:1 with `User`, user preferences |
| `ChordSheet` | `OrgId`, `Title`, `Artist`, `Content`, `Key` |
| `SetList` | `OrgId`, `Name` — ordered collection of chord sheets |
| `Output` | `SetListId`, `ChordSheetId`, `Order` — projection slot in a setlist |
| `Invite` | `OrgId`, `Email`, `InvitedById` |

## Secrets & Configuration

Never commit secrets. Use `dotnet user-secrets` locally or environment variables. Key config keys:

- `Auth0:Domain`, `Auth0:Audience` — backend JWT validation
- `WebAuth0:Domain`, `WebAuth0:ClientId`, `WebAuth0:Audience` — served to the SPA via `/api/config`
- `ConnectionStrings:TeamChords` — PostgreSQL connection string
- `ConnectionStrings:Redis` — optional Redis backplane for SignalR
