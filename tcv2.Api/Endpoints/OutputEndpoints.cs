using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Endpoints;

internal static class OutputEndpoints
{
    public static RouteGroupBuilder MapOutputEndpoints(this RouteGroupBuilder api)
    {
        var outputs = api.MapGroup("/outputs");
        outputs.MapGet("/", async (HttpRequest req, AppDbContext db) =>
        {
            var q = db.Outputs.AsQueryable();
            if (req.Query.TryGetValue("id", out var id) && Guid.TryParse(id, out var gid)) q = q.Where(x => x.Id == gid);
            if (req.Query.TryGetValue("setListId", out var sl) && Guid.TryParse(sl, out var slg)) q = q.Where(x => x.SetListId == slg);
            if (req.Query.TryGetValue("targetKey", out var key)) q = q.Where(x => EF.Functions.ILike(x.TargetKey!, $"%{key}%"));
            if (req.Query.TryGetValue("chordSheetId", out var csid) && Guid.TryParse(csid, out var csg)) q = q.Where(x => x.ChordSheetId == csg);
            if (req.Query.TryGetValue("capo", out var capo) && short.TryParse(capo, out var capov)) q = q.Where(x => x.Capo == capov);
            if (req.Query.TryGetValue("createdFrom", out var cf) && DateTime.TryParse(cf, out var cfrom)) q = q.Where(x => x.CreatedAt >= cfrom);
            if (req.Query.TryGetValue("createdTo", out var ct) && DateTime.TryParse(ct, out var cto)) q = q.Where(x => x.CreatedAt <= cto);

            var sortBy = req.Query.TryGetValue("sortBy", out var sb) ? sb.ToString() : "createdAt";
            var sortDir = req.Query.TryGetValue("sortDir", out var sd) ? sd.ToString().ToLowerInvariant() : "desc";
            q = sortBy switch
            {
                "targetKey" => sortDir == "asc" ? q.OrderBy(x => x.TargetKey) : q.OrderByDescending(x => x.TargetKey),
                "capo" => sortDir == "asc" ? q.OrderBy(x => x.Capo) : q.OrderByDescending(x => x.Capo),
                _ => sortDir == "asc" ? q.OrderBy(x => x.CreatedAt) : q.OrderByDescending(x => x.CreatedAt),
            };

            return await EndpointHelpers.ApplyPagingAndFilter(q, req);
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

        outputs.MapGet("/{id}", async (Guid id, AppDbContext db) =>
            await db.Outputs.FindAsync(id) is Output o ? Results.Ok(o) : Results.NotFound());

        outputs.MapPost("/", async (OutputDto dto, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.SetListHub, tcv2.Api.Hubs.ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var o = new Output
            {
                Id = Guid.NewGuid(),
                SetListId = dto.SetListId,
                TargetKey = dto.TargetKey,
                ChordSheetId = dto.ChordSheetId,
                Capo = dto.Capo,
                CreatedAt = DateTime.UtcNow
            };
            db.Outputs.Add(o);
            await db.SaveChangesAsync();

            var chordsheet = await db.ChordSheets.FindAsync(o.ChordSheetId);
            var payload = new
            {
                o.Id,
                o.SetListId,
                o.TargetKey,
                o.ChordSheetId,
                o.Capo,
                o.CreatedAt,
                o.UpdatedAt,
                Chordsheets = chordsheet != null ? new { chordsheet.Key, chordsheet.Content } : null
            };

            await hub.Clients.All.OutputCreated(payload);
            return Results.Created($"/api/outputs/{o.Id}", payload);
        });

        outputs.MapPut("/{id}", async (Guid id, OutputDto dto, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.SetListHub, tcv2.Api.Hubs.ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.Outputs.FindAsync(id);
            if (existing == null) return Results.NotFound();
            existing.SetListId = dto.SetListId;
            existing.TargetKey = dto.TargetKey;
            existing.ChordSheetId = dto.ChordSheetId;
            existing.Capo = dto.Capo;
            existing.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            var chordsheet = await db.ChordSheets.FindAsync(existing.ChordSheetId);
            var payload = new
            {
                existing.Id,
                existing.SetListId,
                existing.TargetKey,
                existing.ChordSheetId,
                existing.Capo,
                existing.CreatedAt,
                existing.UpdatedAt,
                Chordsheets = chordsheet != null ? new { chordsheet.Key, chordsheet.Content } : null
            };
            await hub.Clients.All.OutputUpdated(payload);
            return Results.NoContent();
        });

        outputs.MapDelete("/{id}", async (Guid id, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.SetListHub, tcv2.Api.Hubs.ISetListClient> hub) =>
        {
            var existing = await db.Outputs.FindAsync(id);
            if (existing == null) return Results.NotFound();
            db.Outputs.Remove(existing);
            await db.SaveChangesAsync();
            await hub.Clients.All.OutputDeleted(existing.Id);
            return Results.NoContent();
        });

        return api;
    }
}
