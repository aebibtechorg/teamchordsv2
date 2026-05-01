using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Mappers;
using tcv2.Api.Hubs;
using tcv2.Api.Services;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Endpoints;

internal static class SetListEndpoints
{
    public static RouteGroupBuilder MapSetListEndpoints(this RouteGroupBuilder api)
    {
        var setlists = api.MapGroup("/setlists");
        setlists.MapGet("/", async (HttpRequest req, AppDbContext db) =>
        {
            var q = db.SetLists.AsQueryable();
            if (req.Query.TryGetValue("id", out var id) && Guid.TryParse(id, out var gid)) q = q.Where(x => x.Id == gid);

            if (!req.Query.TryGetValue("orgId", out var orgId) || string.IsNullOrWhiteSpace(orgId) || !Guid.TryParse(orgId, out var g))
            {
                return Results.BadRequest("orgId is required.");
            }

            // Require caller to be a member of the organization
            var authCheck = await EndpointHelpers.RequireOrgMember(req, db, g);
            if (authCheck != null) return authCheck;

            q = q.Where(x => x.OrgId == g);
            // support unified search param on name
            if (req.Query.TryGetValue("search", out var s) && !string.IsNullOrWhiteSpace(s))
            {
                var sv = s.ToString();
                q = q.Where(x => EF.Functions.ILike(x.Name!, $"%{sv}%"));
            }
            if (req.Query.TryGetValue("createdFrom", out var cf) && DateTime.TryParse(cf, out var cfrom)) q = q.Where(x => x.CreatedAt >= cfrom);
            if (req.Query.TryGetValue("createdTo", out var ct) && DateTime.TryParse(ct, out var cto)) q = q.Where(x => x.CreatedAt <= cto);
            if (req.Query.TryGetValue("updatedFrom", out var uf) && DateTime.TryParse(uf, out var ufrom)) q = q.Where(x => x.UpdatedAt != null && x.UpdatedAt >= ufrom);
            if (req.Query.TryGetValue("updatedTo", out var ut) && DateTime.TryParse(ut, out var uto)) q = q.Where(x => x.UpdatedAt != null && x.UpdatedAt <= uto);

            // Keyset ordering: newest first
            q = q.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id);

            return await EndpointHelpers.ApplyCursorPaging(q, req, x => x.ToDto());
        }).WithOpenApi(operation =>
        {
            operation.Parameters = new List<OpenApiParameter>
            {
                new OpenApiParameter { Name = "pageSize", In = ParameterLocation.Query, Description = "Page size (max 100)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(20) } },
                new OpenApiParameter { Name = "search", In = ParameterLocation.Query, Description = "Search name (contains)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "afterCreatedAt", In = ParameterLocation.Query, Description = "Cursor: createdAt of last item (ISO date-time)", Schema = new OpenApiSchema { Type = "string", Format = "date-time" } },
                new OpenApiParameter { Name = "afterId", In = ParameterLocation.Query, Description = "Cursor: id of last item (guid)", Schema = new OpenApiSchema { Type = "string", Format = "uuid" } },
                new OpenApiParameter { Name = "orgId", In = ParameterLocation.Query, Description = "Filter by OrgId (guid)", Schema = new OpenApiSchema { Type = "string", Format = "uuid" } },
                new OpenApiParameter { Name = "sortBy", In = ParameterLocation.Query, Description = "Sort field (createdAt,name,updatedAt)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "sortDir", In = ParameterLocation.Query, Description = "Sort direction (asc|desc)", Schema = new OpenApiSchema { Type = "string" } }
            };
            return operation;
        });

        setlists.MapGet("/{id}", async (Guid id, HttpRequest req, AppDbContext db) =>
        {
            var s = await db.SetLists.Include(s => s.Outputs).FirstOrDefaultAsync(s => s.Id == id);
            if (s == null) return Results.NotFound();

            // if (s.OrgId.HasValue)
            // {
            //     var auth = await EndpointHelpers.RequireOrgMember(req, db, s.OrgId.Value);
            //     if (auth != null) return auth;
            // }
            // else
            // {
            //     if (!EndpointHelpers.IsPlatformAdminOrSupport(req)) return Results.Forbid();
            // }

            return Results.Ok(s.ToDetailDto());
        }).AllowAnonymous();

        setlists.MapPost("/", async (SetListDto dto, HttpRequest req, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            // if (dto.OrgId.HasValue && !string.IsNullOrWhiteSpace(dto.Name) && await db.SetLists.AnyAsync(x => x.OrgId == dto.OrgId && x.Name == dto.Name))
            // {
            //     return Results.Conflict(new { message = "SetList with this name already exists in the organization" });
            // }

            Organization? org = null;
            if (dto.OrgId.HasValue)
            {
                org = await db.Organizations.FindAsync(dto.OrgId);
                if (org == null) return Results.NotFound("Organization not found");

                var auth = await EndpointHelpers.RequireOrgMember(req, db, dto.OrgId.Value);
                if (auth != null) return auth;
            }
            else
            {
                if (!EndpointHelpers.IsPlatformAdminOrSupport(req)) return Results.Forbid();
            }

            var currentSetListCount = dto.OrgId.HasValue ? await db.SetLists.CountAsync(s => s.OrgId == dto.OrgId) : 0;
            if (org != null)
            {
                var gate = FeatureGate.CheckLimits(org, 0, currentSetListCount + 1, 0, 0);
                if (gate != null) return gate;
            }

            var s = dto.ToEntity();
            s.Id = Guid.NewGuid();
            
            db.SetLists.Add(s);
            try
            {
                await db.SaveChangesAsync();
                if (s.OrgId.HasValue)
                {
                    await hub.Clients.Group(HubGroupNames.Organization(s.OrgId.Value)).SetListCreated(s.ToDto());
                }
                return Results.Created($"/api/setlists/{s.Id}", s.ToDto());
            }
            catch (DbUpdateException ex)
            {
                return EndpointHelpers.HandleDbUpdateException(ex);
            }
        });

        setlists.MapPut("/{id}", async (Guid id, SetListDto dto, HttpRequest req, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.SetLists.FindAsync(id);
            if (existing == null) return Results.NotFound();
            if (existing.OrgId.HasValue)
            {
                var auth = await EndpointHelpers.RequireOrgMember(req, db, existing.OrgId.Value);
                if (auth != null) return auth;
            }
            else
            {
                if (!EndpointHelpers.IsPlatformAdminOrSupport(req)) return Results.Forbid();
            }
            // if (dto.OrgId.HasValue && !string.IsNullOrWhiteSpace(dto.Name) && (dto.Name != existing.Name || dto.OrgId != existing.OrgId) &&
            //     await db.SetLists.AnyAsync(x => x.OrgId == dto.OrgId && x.Name == dto.Name && x.Id != id))
            // {
            //     return Results.Conflict(new { message = "SetList with this name already exists in the organization" });
            // }
            existing.UpdateFromDto(dto);
            try
            {
                await db.SaveChangesAsync();
                if (existing.OrgId.HasValue)
                {
                    await hub.Clients.Group(HubGroupNames.Organization(existing.OrgId.Value)).SetListUpdated(existing.ToDto());
                }

                await hub.Clients.Group(HubGroupNames.SetList(existing.Id)).SetListUpdated(existing.ToDto());
                return Results.NoContent();
            }
            catch (DbUpdateException ex)
            {
                return EndpointHelpers.HandleDbUpdateException(ex);
            }
        });

        setlists.MapDelete("/{id}", async (Guid id, HttpRequest req, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var existing = await db.SetLists.FindAsync(id);
            if (existing == null) return Results.NotFound();
            if (existing.OrgId.HasValue)
            {
                var auth = await EndpointHelpers.RequireOrgAdminOrOwner(req, db, existing.OrgId.Value);
                if (auth != null) return auth;
            }
            else
            {
                if (!EndpointHelpers.IsPlatformAdminOrSupport(req)) return Results.Forbid();
            }

            var orgId = existing.OrgId;
            db.SetLists.Remove(existing);
            await db.SaveChangesAsync();

            if (orgId.HasValue)
            {
                await hub.Clients.Group(HubGroupNames.Organization(orgId.Value)).SetListDeleted(existing.Id);
            }

            await hub.Clients.Group(HubGroupNames.SetList(existing.Id)).SetListDeleted(existing.Id);
            return Results.NoContent();
        });

        return api;
    }
}
