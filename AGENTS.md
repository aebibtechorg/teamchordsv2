# AGENTS.md — TeamChords v2 (for AI coding agents)

Purpose: a compact, actionable guide for automated or human-AI coding agents to be productive in this repo.

Quick start (what to run)
- Full stack (orchestrator): cd tcv2.AppHost && dotnet run
- API only (hot reload): cd tcv2.Api && dotnet watch run
- Frontend dev: cd web && npm install && npm run dev
- EF migrations: cd tcv2.Api && dotnet ef migrations add <Name> --project tcv2.Api.csproj && dotnet ef database update

High-level architecture (files to read first)
- API: `tcv2.Api/Program.cs` (wiring), `tcv2.Api/Endpoints/` (routes), `tcv2.Api/Hubs/` (SignalR), `tcv2.Api/Data/AppDbContext.cs` (EF DbSets)
- App host/orchestration: `tcv2.AppHost/AppHost.cs` — used for running the whole stack
- Frontend: `web/` — entry `web/src/main.tsx`, router `web/src/router.jsx`, utils `web/src/utils/*`, stores `web/src/store/`

Project-specific conventions (must follow these)
- Endpoint pattern: create an internal static class in `tcv2.Api/Endpoints/{Resource}Endpoints.cs` with an extension method Map{Resource}Endpoints(this RouteGroupBuilder api); register in `Program.cs` via `api.Map{Resource}Endpoints();`. See `tcv2.Api/Endpoints/OutputEndpoints.cs`.
- DTO/Entity/Mapper triad: every resource has
  - Entity: `tcv2.Api/Data/Entities/{Resource}.cs` (Guid Id, DateTime CreatedAt, DateTime? UpdatedAt)
  - DTO: `tcv2.Api/Data/Dto/{Resource}Dto.cs` (DataAnnotations for validation)
  - Mapper: `tcv2.Api/Data/Mappers/{Resource}Mappers.cs` with ToDto, ToEntity (sets CreatedAt = DateTime.UtcNow), UpdateFromDto (sets UpdatedAt = DateTime.UtcNow)
  See `tcv2.Api/Data/Mappers` and `tcv2.Api/Endpoints/*` for usage.
- Validation & errors: use `EndpointHelpers.Validate(dto)` and catch EF exceptions with `EndpointHelpers.HandleDbUpdateException(ex)` (used throughout `tcv2.Api/Endpoints`).

Auth, secrets, and config
- Auth0-backed: config keys `Auth0:Domain` and `Auth0:Audience` for backend; front-end keys are `WebAuth0:*` and are served via `/api/config`.
- Never commit secrets — dotnet user-secrets or env vars. DB: `ConnectionStrings:TeamChords`. Redis (SignalR backplane): `ConnectionStrings:Redis` (optional).

Realtime / SignalR
- Hubs live in `tcv2.Api/Hubs/` and define server-to-client interfaces (`I{Resource}Client`). Hubs inherit `Hub<I{Resource}Client>`; register with `app.MapHub<MyHub>("/hubs/...")` in `Program.cs`. Example: `tcv2.Api/Hubs/SetListHub.cs` and `ISetListClient`.

Frontend conventions
- Always use `apiFetch` from `web/src/utils/api.js` (never raw fetch). See usages in `web/src/utils/chordsheets.ts` and `web/src/utils/setlists.ts`.
- File placement: pages `web/src/pages/`, components `web/src/components/`, resource utils `web/src/utils/{resource}.ts`, stores `web/src/store/use{Domain}Store.js`.

Where to look (concrete examples)
- Add endpoint: `tcv2.Api/Endpoints/SetListEndpoints.cs` and registration in `Program.cs`.
- Mapper and DTO example: `tcv2.Api/Data/Mappers/ChordSheetMappers.cs` (or check other resources in that folder).
- Endpoint helper usage: `tcv2.Api/Endpoints/OutputEndpoints.cs` shows ApplyPagingAndFilter, AllowAnonymous, SignalR hub injection and examples of ToDto/ToDetailDto usage.

Agent guidance (how AI should modify code)
- Prefer small localized changes: add DbSet in `AppDbContext.cs`, create Entity/Dto/Mapper and Endpoint trio together.
- Follow existing naming and folder patterns; copy structure from existing resource endpoints (Outputs/SetLists/ChordSheets).
- Use `EndpointHelpers` for validation/paging consistency.

Limitations / non-goals
- This file documents only discoverable patterns in the repo (not process decisions outside the code); consult `.github/copilot-instructions.md` and `README.md` for higher-level context.

Relevant files scanned: `.github/copilot-instructions.md`, `tcv2.Api/Endpoints/*`, `tcv2.Api/Data/*`, `tcv2.Api/Hubs/*`, `tcv2.AppHost/AppHost.cs`, `web/src/utils/*`.

---
Small note: this is intentionally concise — ask for a longer contributor-facing `CONTRIBUTING.md` or an expanded agent playbook if you want tests/CI, PR checklist, or code-style rules.

