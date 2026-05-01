using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using System.Text.Json;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Mappers;
using tcv2.Api.Hubs;
using tcv2.Api.Services;

namespace tcv2.Api.Endpoints;

internal static class ChordSheetEndpoints
{
    private static async Task<List<Guid>> GetRelatedSetListIds(AppDbContext db, Guid chordSheetId)
    {
        return await db.Outputs
            .Where(o => o.ChordSheetId == chordSheetId && o.SetListId.HasValue)
            .Select(o => o.SetListId!.Value)
            .Distinct()
            .ToListAsync();
    }

    public static RouteGroupBuilder MapChordSheetEndpoints(this RouteGroupBuilder api)
    {
        var chordSheets = api.MapGroup("/chordsheets");

        chordSheets.MapGet("/", async (HttpRequest req, AppDbContext db) =>
        {
            var q = db.ChordSheets.AsQueryable();
            if (req.Query.TryGetValue("id", out var id) && Guid.TryParse(id, out var gid)) q = q.Where(x => x.Id == gid);

            if (!req.Query.TryGetValue("orgId", out var orgId) || string.IsNullOrWhiteSpace(orgId) || !Guid.TryParse(orgId, out var og))
            {
                return Results.BadRequest("orgId is required.");
            }

            q = q.Where(x => x.OrgId == og);
            if (req.Query.TryGetValue("title", out var title)) q = q.Where(x => EF.Functions.ILike(x.Title!, $"%{title}%"));
            if (req.Query.TryGetValue("artist", out var artist)) q = q.Where(x => EF.Functions.ILike(x.Artist!, $"%{artist}%"));
            if (req.Query.TryGetValue("content", out var content)) q = q.Where(x => EF.Functions.ILike(x.Content!, $"%{content}%"));
            if (req.Query.TryGetValue("key", out var key)) q = q.Where(x => EF.Functions.ILike(x.Key!, $"%{key}%"));
            if (req.Query.TryGetValue("createdFrom", out var cf) && DateTime.TryParse(cf, out var cfrom)) q = q.Where(x => x.CreatedAt >= cfrom);
            if (req.Query.TryGetValue("createdTo", out var ct) && DateTime.TryParse(ct, out var cto)) q = q.Where(x => x.CreatedAt <= cto);
            if (req.Query.TryGetValue("updatedFrom", out var uf) && DateTime.TryParse(uf, out var ufrom)) q = q.Where(x => x.UpdatedAt != null && x.UpdatedAt >= ufrom);
            if (req.Query.TryGetValue("updatedTo", out var ut) && DateTime.TryParse(ut, out var uto)) q = q.Where(x => x.UpdatedAt != null && x.UpdatedAt <= uto);

            // Use unified `search` param (matches title OR artist)
            if (req.Query.TryGetValue("search", out var s) && !string.IsNullOrWhiteSpace(s))
            {
                var sv = s.ToString();
                q = q.Where(x => EF.Functions.ILike(x.Title!, $"%{sv}%") || EF.Functions.ILike(x.Artist!, $"%{sv}%"));
            }

            // Keyset ordering: newest first
            q = q.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id);

            // Use cursor-based paging helper and project to DTOs
            return await EndpointHelpers.ApplyCursorPaging(q, req, x => x.ToDto());
        }).WithOpenApi(operation =>
        {
            operation.Parameters = new List<OpenApiParameter>
            {
                new OpenApiParameter { Name = "pageSize", In = ParameterLocation.Query, Description = "Page size (max 100)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(20) } },
                new OpenApiParameter { Name = "search", In = ParameterLocation.Query, Description = "Search title or artist (contains, case-insensitive)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "afterCreatedAt", In = ParameterLocation.Query, Description = "Cursor: createdAt of last item (ISO date-time)", Schema = new OpenApiSchema { Type = "string", Format = "date-time" } },
                new OpenApiParameter { Name = "afterId", In = ParameterLocation.Query, Description = "Cursor: id of last item (guid)", Schema = new OpenApiSchema { Type = "string", Format = "uuid" } }
            };
            return operation;
        });

        chordSheets.MapGet("/backup", async (HttpRequest req, AppDbContext db) =>
        {
            if (!req.Query.TryGetValue("orgId", out var orgId) || !Guid.TryParse(orgId, out var og))
            {
                return Results.BadRequest("orgId is required.");
            }

            var org = await db.Organizations.FindAsync(og);
            if (org == null) return Results.NotFound("Organization not found");

            var gate = FeatureGate.CheckBackupExport(org);
            if (gate != null) return gate;

            var chordsheets = await db.ChordSheets
                .Where(x => x.OrgId == og)
                .Select(x => x.ToDto())
                .ToListAsync();

            var json = JsonSerializer.Serialize(chordsheets, new JsonSerializerOptions { WriteIndented = true });
            var fileName = $"chordsheets_backup_{DateTime.UtcNow:yyyyMMddHHmmss}.json";

            return Results.File(System.Text.Encoding.UTF8.GetBytes(json), "application/json", fileName);
        });

        chordSheets.MapGet("/{id}", async (Guid id, AppDbContext db) =>
        {
            var cs = await db.ChordSheets.FindAsync(id);
            return cs is not null ? Results.Ok(cs.ToDto()) : Results.NotFound();
        })
            .AllowAnonymous();

        chordSheets.MapPost("/", async (ChordSheetDto dto, AppDbContext db, IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;

            var org = await db.Organizations.FindAsync(dto.OrgId);
            if (org == null) return Results.NotFound("Organization not found");

            var currentChordSheetCount = await db.ChordSheets.CountAsync(c => c.OrgId == dto.OrgId);
            var gate = FeatureGate.CheckLimits(org, currentChordSheetCount + 1, 0, 0, 0);
            if (gate != null) return gate;

            var cs = dto.ToEntity();
            cs.Id = Guid.NewGuid();
            
            db.ChordSheets.Add(cs);
            await db.SaveChangesAsync();

            if (cs.OrgId.HasValue)
            {
                await hub.Clients.Group(HubGroupNames.Organization(cs.OrgId.Value)).ChordSheetCreated(cs);
            }

            return Results.Created($"/api/chordsheets/{cs.Id}", cs.ToDto());
        });

        chordSheets.MapPost("/bulk", async ([FromBody] BulkChordSheetRequestDto request, [FromServices] IServiceProvider services, AppDbContext db) =>
        {
            if (string.IsNullOrEmpty(request.ConnectionId))
            {
                return Results.BadRequest("ConnectionId is required for bulk upload.");
            }

            if (request.Dtos.Length == 0)
            {
                return Results.BadRequest("No chord sheets to upload.");
            }

            var orgId = request.Dtos[0].OrgId;
            if (!orgId.HasValue || request.Dtos.Any(dto => dto.OrgId != orgId))
            {
                return Results.BadRequest("All chord sheets in a bulk upload must belong to the same organization.");
            }

            var org = await db.Organizations.FindAsync(orgId);
            if (org == null) return Results.NotFound("Organization not found");

            var gate = FeatureGate.CheckBulkUpload(org);
            if (gate != null) return gate;

            _ = Task.Run(async () =>
            {
                // Create a new scope to resolve scoped services like DbContext
                using var scope = services.CreateScope();
                var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var hub = scope.ServiceProvider.GetRequiredService<IHubContext<SetListHub, ISetListClient>>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

                var total = request.Dtos.Length;
                var processedCount = 0;

                foreach (var dto in request.Dtos)
                {
                    processedCount++;
                    var progressMessage = $"Processing '{dto.Title}'...";
                    await hub.Clients.Client(request.ConnectionId).BulkUploadProgress(processedCount, total, progressMessage);

                    if (EndpointHelpers.Validate(dto) != null)
                    {
                        logger.LogWarning("Validation failed for a chordsheet in bulk upload. Title: {Title}", dto.Title);
                        continue; // Skip invalid DTOs
                    }

                    var cs = dto.ToEntity();
                    cs.Id = Guid.NewGuid();
                    scopedDb.ChordSheets.Add(cs);
                    await scopedDb.SaveChangesAsync();

                    if (cs.OrgId.HasValue)
                    {
                        await hub.Clients.Group(HubGroupNames.Organization(cs.OrgId.Value)).ChordSheetCreated(cs);
                    }
                }

                await hub.Clients.Client(request.ConnectionId).BulkUploadFinished();
            });

            return Results.Accepted(value: new { message = "Bulk upload started." });
        });

        chordSheets.MapPut("/{id}", async (Guid id, ChordSheetDto dto, AppDbContext db, IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.ChordSheets.FindAsync(id);
            if (existing == null) return Results.NotFound();

            var relatedSetListIds = await GetRelatedSetListIds(db, existing.Id);
            existing.UpdateFromDto(dto);
            await db.SaveChangesAsync();

            if (existing.OrgId.HasValue)
            {
                await hub.Clients.Group(HubGroupNames.Organization(existing.OrgId.Value)).ChordSheetUpdated(existing);
            }

            foreach (var setListId in relatedSetListIds)
            {
                await hub.Clients.Group(HubGroupNames.SetList(setListId)).ChordSheetUpdated(existing);
            }

            return Results.NoContent();
        });

        chordSheets.MapDelete("/{id}", async (Guid id, AppDbContext db, IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var existing = await db.ChordSheets.FindAsync(id);
            if (existing == null) return Results.NotFound();

            var orgId = existing.OrgId;
            var relatedSetListIds = await GetRelatedSetListIds(db, existing.Id);
            db.ChordSheets.Remove(existing);
            await db.SaveChangesAsync();

            if (orgId.HasValue)
            {
                await hub.Clients.Group(HubGroupNames.Organization(orgId.Value)).ChordSheetDeleted(existing.Id);
            }

            foreach (var setListId in relatedSetListIds)
            {
                await hub.Clients.Group(HubGroupNames.SetList(setListId)).ChordSheetDeleted(existing.Id);
            }

            return Results.NoContent();
        });

        return api;
    }
}