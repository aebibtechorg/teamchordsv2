using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using System.Linq;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
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
            if (req.Query.TryGetValue("orgId", out var orgId) && Guid.TryParse(orgId, out var g)) q = q.Where(x => x.OrgId == g);
            if (req.Query.TryGetValue("name", out var name)) q = q.Where(x => EF.Functions.ILike(x.Name!, $"%{name}%"));
            if (req.Query.TryGetValue("createdFrom", out var cf) && DateTime.TryParse(cf, out var cfrom)) q = q.Where(x => x.CreatedAt >= cfrom);
            if (req.Query.TryGetValue("createdTo", out var ct) && DateTime.TryParse(ct, out var cto)) q = q.Where(x => x.CreatedAt <= cto);
            if (req.Query.TryGetValue("updatedFrom", out var uf) && DateTime.TryParse(uf, out var ufrom)) q = q.Where(x => x.UpdatedAt != null && x.UpdatedAt >= ufrom);
            if (req.Query.TryGetValue("updatedTo", out var ut) && DateTime.TryParse(ut, out var uto)) q = q.Where(x => x.UpdatedAt != null && x.UpdatedAt <= uto);

            var sortBy = req.Query.TryGetValue("sortBy", out var sb) ? sb.ToString() : "createdAt";
            var sortDir = req.Query.TryGetValue("sortDir", out var sd) ? sd.ToString().ToLowerInvariant() : "desc";
            q = sortBy switch
            {
                "name" => sortDir == "asc" ? q.OrderBy(x => x.Name) : q.OrderByDescending(x => x.Name),
                "updatedAt" => sortDir == "asc" ? q.OrderBy(x => x.UpdatedAt) : q.OrderByDescending(x => x.UpdatedAt),
                _ => sortDir == "asc" ? q.OrderBy(x => x.CreatedAt) : q.OrderByDescending(x => x.CreatedAt),
            };

            return await EndpointHelpers.ApplyPagingAndFilter(q, req);
        }).WithOpenApi(operation =>
        {
            operation.Parameters = new List<OpenApiParameter>
            {
                new OpenApiParameter { Name = "page", In = ParameterLocation.Query, Description = "Page number (1-based)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(1) } },
                new OpenApiParameter { Name = "pageSize", In = ParameterLocation.Query, Description = "Page size (max 100)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(20) } },
                new OpenApiParameter { Name = "name", In = ParameterLocation.Query, Description = "Filter by name (contains)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "orgId", In = ParameterLocation.Query, Description = "Filter by OrgId (guid)", Schema = new OpenApiSchema { Type = "string", Format = "uuid" } },
                new OpenApiParameter { Name = "sortBy", In = ParameterLocation.Query, Description = "Sort field (createdAt,name,updatedAt)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "sortDir", In = ParameterLocation.Query, Description = "Sort direction (asc|desc)", Schema = new OpenApiSchema { Type = "string" } }
            };
            return operation;
        });

        setlists.MapGet("/{id}", async (Guid id, AppDbContext db) =>
        {
            var s = await db.SetLists.FindAsync(id);
            if (s == null) return Results.NotFound();

            // load outputs for the setlist
            var outputs = await db.Outputs
                .Where(o => o.SetListId == id)
                .OrderBy(o => o.CreatedAt)
                .Select(o => new { id = o.Id, chordSheetId = o.ChordSheetId, targetKey = o.TargetKey, capo = o.Capo, order = o.Order })
                .ToListAsync();

            var result = new
            {
                id = s.Id,
                orgId = s.OrgId,
                name = s.Name,
                createdAt = s.CreatedAt,
                updatedAt = s.UpdatedAt,
                outputs
            };

            return Results.Ok(result);
        }).AllowAnonymous();

        setlists.MapPost("/", async (SetListDto dto, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.SetListHub, tcv2.Api.Hubs.ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            if (dto.OrgId.HasValue && !string.IsNullOrWhiteSpace(dto.Name) && await db.SetLists.AnyAsync(x => x.OrgId == dto.OrgId && x.Name == dto.Name))
            {
                return Results.Conflict(new { message = "SetList with this name already exists in the organization" });
            }

            var s = new SetList
            {
                Id = Guid.NewGuid(),
                OrgId = dto.OrgId,
                Name = dto.Name,
                CreatedAt = DateTime.UtcNow
            };
            db.SetLists.Add(s);
            try
            {
                await db.SaveChangesAsync();
                await hub.Clients.All.SetListCreated(s);
                return Results.Created($"/api/setlists/{s.Id}", s);
            }
            catch (DbUpdateException ex)
            {
                return EndpointHelpers.HandleDbUpdateException(ex);
            }
        });

        setlists.MapPut("/{id}", async (Guid id, SetListDto dto, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.SetListHub, tcv2.Api.Hubs.ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.SetLists.FindAsync(id);
            if (existing == null) return Results.NotFound();
            if (dto.OrgId.HasValue && !string.IsNullOrWhiteSpace(dto.Name) && (dto.Name != existing.Name || dto.OrgId != existing.OrgId) &&
                await db.SetLists.AnyAsync(x => x.OrgId == dto.OrgId && x.Name == dto.Name && x.Id != id))
            {
                return Results.Conflict(new { message = "SetList with this name already exists in the organization" });
            }
            existing.OrgId = dto.OrgId;
            existing.Name = dto.Name;
            existing.UpdatedAt = DateTime.UtcNow;
            try
            {
                await db.SaveChangesAsync();
                await hub.Clients.All.SetListUpdated(existing);
                return Results.NoContent();
            }
            catch (DbUpdateException ex)
            {
                return EndpointHelpers.HandleDbUpdateException(ex);
            }
        });

        setlists.MapDelete("/{id}", async (Guid id, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.SetListHub, tcv2.Api.Hubs.ISetListClient> hub) =>
        {
            var existing = await db.SetLists.FindAsync(id);
            if (existing == null) return Results.NotFound();
            db.SetLists.Remove(existing);
            await db.SaveChangesAsync();
            await hub.Clients.All.SetListDeleted(existing.Id);
            return Results.NoContent();
        });

        return api;
    }
}
