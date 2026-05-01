using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;
using tcv2.Api.Data.Mappers;
using tcv2.Api.Hubs;

namespace tcv2.Api.Endpoints;

internal static class OutputEndpoints
{
    private static async Task<Guid?> GetOrganizationIdForSetList(AppDbContext db, Guid? setListId)
    {
        if (!setListId.HasValue)
        {
            return null;
        }

        return await db.SetLists
            .Where(s => s.Id == setListId.Value)
            .Select(s => s.OrgId)
            .FirstOrDefaultAsync();
    }

    public static RouteGroupBuilder MapOutputEndpoints(this RouteGroupBuilder api)
    {
        var outputs = api.MapGroup("/outputs");
        outputs.MapGet("/", async (HttpRequest req, AppDbContext db) =>
        {
            var q = db.Outputs.AsQueryable();
            if (req.Query.TryGetValue("id", out var id) && Guid.TryParse(id, out var gid)) q = q.Where(x => x.Id == gid);
            Guid? filterOrgId = null;
            if (req.Query.TryGetValue("setListId", out var sl) && Guid.TryParse(sl, out var slg))
            {
                var orgId = await GetOrganizationIdForSetList(db, slg);
                if (orgId == null) return Results.BadRequest("Invalid setListId");
                filterOrgId = orgId;
                q = q.Where(x => x.SetListId == slg);
            }
            if (req.Query.TryGetValue("targetKey", out var key)) q = q.Where(x => EF.Functions.ILike(x.TargetKey!, $"%{key}%"));
            if (req.Query.TryGetValue("chordSheetId", out var csid) && Guid.TryParse(csid, out var csg))
            {
                var cs = await db.ChordSheets.FindAsync(csg);
                if (cs == null) return Results.BadRequest("Invalid chordSheetId");
                if (cs.OrgId.HasValue) filterOrgId = cs.OrgId;
                q = q.Where(x => x.ChordSheetId == csg);
            }
            if (req.Query.TryGetValue("capo", out var capo) && short.TryParse(capo, out var capov)) q = q.Where(x => x.Capo == capov);
            if (req.Query.TryGetValue("createdFrom", out var cf) && DateTime.TryParse(cf, out var cfrom)) q = q.Where(x => x.CreatedAt >= cfrom);
            if (req.Query.TryGetValue("createdTo", out var ct) && DateTime.TryParse(ct, out var cto)) q = q.Where(x => x.CreatedAt <= cto);

            // Require that caller belongs to the org implied by setListId/chordSheetId
            // if (filterOrgId.HasValue)
            // {
            //     var auth = await EndpointHelpers.RequireOrgMember(req, db, filterOrgId.Value);
            //     if (auth != null) return auth;
            // }
            // else
            // {
            //     return Results.BadRequest("setListId or chordSheetId is required to filter outputs.");
            // }

            var sortBy = req.Query.TryGetValue("sortBy", out var sb) ? sb.ToString() : "createdAt";
            var sortDir = req.Query.TryGetValue("sortDir", out var sd) ? sd.ToString().ToLowerInvariant() : "desc";
            q = sortBy switch
            {
                "targetKey" => sortDir == "asc" ? q.OrderBy(x => x.TargetKey) : q.OrderByDescending(x => x.TargetKey),
                "capo" => sortDir == "asc" ? q.OrderBy(x => x.Capo) : q.OrderByDescending(x => x.Capo),
                "order" => sortDir == "asc" ? q.OrderBy(x => x.Order) : q.OrderByDescending(x => x.Order),
                _ => sortDir == "asc" ? q.OrderBy(x => x.CreatedAt) : q.OrderByDescending(x => x.CreatedAt),
            };

            return await EndpointHelpers.ApplyPagingAndFilter(q.Select(x => x.ToDto()), req);
        }).WithOpenApi(operation =>
        {
            operation.Parameters = new List<OpenApiParameter>
            {
                new OpenApiParameter { Name = "page", In = ParameterLocation.Query, Description = "Page number (1-based)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(1) } },
                new OpenApiParameter { Name = "pageSize", In = ParameterLocation.Query, Description = "Page size (max 100)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(20) } },
                new OpenApiParameter { Name = "setListId", In = ParameterLocation.Query, Description = "Filter by SetListId (guid)", Schema = new OpenApiSchema { Type = "string", Format = "uuid" } },
                new OpenApiParameter { Name = "targetKey", In = ParameterLocation.Query, Description = "Filter by targetKey (contains)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "chordSheetId", In = ParameterLocation.Query, Description = "Filter by ChordSheetId (guid)", Schema = new OpenApiSchema { Type = "string", Format = "uuid" } },
                new OpenApiParameter { Name = "capo", In = ParameterLocation.Query, Description = "Filter by capo (integer)", Schema = new OpenApiSchema { Type = "integer" } },
                new OpenApiParameter { Name = "sortBy", In = ParameterLocation.Query, Description = "Sort field (createdAt,targetKey,capo)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "sortDir", In = ParameterLocation.Query, Description = "Sort direction (asc|desc)", Schema = new OpenApiSchema { Type = "string" } }
            };
            return operation;
        }).AllowAnonymous();

        outputs.MapGet("/{id}", async (Guid id, HttpRequest req, AppDbContext db) =>
        {
            var o = await db.Outputs.FindAsync(id);
            if (o == null) return Results.NotFound();

            var orgId = await GetOrganizationIdForSetList(db, o.SetListId);
            if (orgId == null && o.ChordSheetId.HasValue)
            {
                var cs = await db.ChordSheets.FindAsync(o.ChordSheetId.Value);
                if (cs != null && cs.OrgId.HasValue) orgId = cs.OrgId;
            }

            if (orgId.HasValue)
            {
                var auth = await EndpointHelpers.RequireOrgMember(req, db, orgId.Value);
                if (auth != null) return auth;
            }
            else
            {
                if (!EndpointHelpers.IsPlatformAdminOrSupport(req)) return Results.Forbid();
            }

            return Results.Ok(o.ToDto());
        });

        outputs.MapPost("/", async (OutputDto dto, HttpRequest req, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var o = dto.ToEntity();
            o.Id = Guid.NewGuid();
            // Require org admin/owner for creating outputs
            Guid? orgId = null;
            if (dto.SetListId.HasValue)
            {
                orgId = await GetOrganizationIdForSetList(db, dto.SetListId);
                if (orgId == null) return Results.BadRequest("Invalid setListId");
            }
            else if (dto.ChordSheetId.HasValue)
            {
                var cs = await db.ChordSheets.FindAsync(dto.ChordSheetId.Value);
                if (cs == null) return Results.BadRequest("Invalid chordSheetId");
                orgId = cs.OrgId;
            }

            if (orgId.HasValue)
            {
                var auth = await EndpointHelpers.RequireOrgMember(req, db, orgId.Value);
                if (auth != null) return auth;
            }
            else
            {
                if (!EndpointHelpers.IsPlatformAdminOrSupport(req)) return Results.Forbid();
            }

            db.Outputs.Add(o);
            await db.SaveChangesAsync();

            o.ChordSheet = await db.ChordSheets.FindAsync(o.ChordSheetId);
            var payload = o.ToDetailDto();
            var createdOrgId = await GetOrganizationIdForSetList(db, o.SetListId);

            if (createdOrgId.HasValue)
            {
                await hub.Clients.Group(HubGroupNames.Organization(createdOrgId.Value)).OutputCreated(payload);
            }

            if (o.SetListId.HasValue)
            {
                await hub.Clients.Group(HubGroupNames.SetList(o.SetListId.Value)).OutputCreated(payload);
            }

            return Results.Created($"/api/outputs/{o.Id}", payload);
        });

        outputs.MapPut("/{id}", async (Guid id, OutputDto dto, HttpRequest req, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.Outputs.FindAsync(id);
            if (existing == null) return Results.NotFound();
            // Require admin/owner for updating outputs
            var orgId = await GetOrganizationIdForSetList(db, existing.SetListId);
            if (orgId == null && existing.ChordSheetId.HasValue)
            {
                var cs = await db.ChordSheets.FindAsync(existing.ChordSheetId.Value);
                if (cs != null && cs.OrgId.HasValue) orgId = cs.OrgId;
            }

            if (orgId.HasValue)
            {
                var auth = await EndpointHelpers.RequireOrgMember(req, db, orgId.Value);
                if (auth != null) return auth;
            }
            else
            {
                if (!EndpointHelpers.IsPlatformAdminOrSupport(req)) return Results.Forbid();
            }

            existing.UpdateFromDto(dto);
            await db.SaveChangesAsync();

            existing.ChordSheet = await db.ChordSheets.FindAsync(existing.ChordSheetId);
            var payload = existing.ToDetailDto();
            var updatedOrgId = await GetOrganizationIdForSetList(db, existing.SetListId);
            
            if (updatedOrgId.HasValue)
            {
                await hub.Clients.Group(HubGroupNames.Organization(updatedOrgId.Value)).OutputUpdated(payload);
            }

            if (existing.SetListId.HasValue)
            {
                await hub.Clients.Group(HubGroupNames.SetList(existing.SetListId.Value)).OutputUpdated(payload);
            }

            return Results.NoContent();
        });

        outputs.MapDelete("/{id}", async (Guid id, HttpRequest req, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var existing = await db.Outputs.FindAsync(id);
            if (existing == null) return Results.NotFound();
            var setListId = existing.SetListId;
            var orgId = await GetOrganizationIdForSetList(db, setListId);

            if (orgId == null && existing.ChordSheetId.HasValue)
            {
                var cs = await db.ChordSheets.FindAsync(existing.ChordSheetId.Value);
                if (cs != null && cs.OrgId.HasValue) orgId = cs.OrgId;
            }

            if (orgId.HasValue)
            {
                var auth = await EndpointHelpers.RequireOrgMember(req, db, orgId.Value);
                if (auth != null) return auth;
            }
            else
            {
                if (!EndpointHelpers.IsPlatformAdminOrSupport(req)) return Results.Forbid();
            }

            db.Outputs.Remove(existing);
            await db.SaveChangesAsync();

            if (orgId.HasValue)
            {
                await hub.Clients.Group(HubGroupNames.Organization(orgId.Value)).OutputDeleted(existing.Id);
            }

            if (setListId.HasValue)
            {
                await hub.Clients.Group(HubGroupNames.SetList(setListId.Value)).OutputDeleted(existing.Id);
            }

            return Results.NoContent();
        });

        return api;
    }
}
