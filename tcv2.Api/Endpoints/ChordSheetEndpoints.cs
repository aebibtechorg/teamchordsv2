using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using System.Text.Json;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;
using tcv2.Api.Data.Mappers;
using tcv2.Api.Hubs;

namespace tcv2.Api.Endpoints;

internal static class ChordSheetEndpoints
{
    public static RouteGroupBuilder MapChordSheetEndpoints(this RouteGroupBuilder api)
    {
        var chordSheets = api.MapGroup("/chordsheets");

        chordSheets.MapGet("/", async (HttpRequest req, AppDbContext db) =>
        {
            var q = db.ChordSheets.AsQueryable();
            if (req.Query.TryGetValue("id", out var id) && Guid.TryParse(id, out var gid)) q = q.Where(x => x.Id == gid);
            if (req.Query.TryGetValue("orgId", out var orgId) && Guid.TryParse(orgId, out var og)) q = q.Where(x => x.OrgId == og);
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

            var chordsheets = await db.ChordSheets
                .Where(x => x.OrgId == og)
                .Select(x => x.ToDto())
                .ToListAsync();

            var json = JsonSerializer.Serialize(chordsheets, new JsonSerializerOptions { WriteIndented = true });
            var fileName = $"chordsheets_backup_{DateTime.UtcNow:yyyyMMddHHmmss}.json";

            return Results.File(System.Text.Encoding.UTF8.GetBytes(json), "application/json", fileName);
        });

        chordSheets.MapGet("/{id}", async (Guid id, AppDbContext db) =>
            await db.ChordSheets.FindAsync(id) is ChordSheet cs ? Results.Ok(cs.ToDto()) : Results.NotFound())
            .AllowAnonymous();

        chordSheets.MapPost("/", async (ChordSheetDto dto, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.SetListHub, tcv2.Api.Hubs.ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var cs = dto.ToEntity();
            cs.Id = Guid.NewGuid();
            
            db.ChordSheets.Add(cs);
            await db.SaveChangesAsync();
            await hub.Clients.All.ChordSheetCreated(cs);
            return Results.Created($"/api/chordsheets/{cs.Id}", cs.ToDto());
        });

        chordSheets.MapPost("/bulk", ([FromBody] BulkChordSheetRequestDto request, [FromServices] IServiceProvider services) =>
        {
            if (string.IsNullOrEmpty(request.ConnectionId))
            {
                return Results.BadRequest("ConnectionId is required for bulk upload.");
            }

            Task.Run(async () =>
            {
                // Create a new scope to resolve scoped services like DbContext
                using var scope = services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var hub = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.SetListHub, tcv2.Api.Hubs.ISetListClient>>();
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
                    db.ChordSheets.Add(cs);
                    await db.SaveChangesAsync();
                    await hub.Clients.All.ChordSheetCreated(cs);
                }

                await hub.Clients.Client(request.ConnectionId).BulkUploadFinished();
            });

            return Results.Accepted(value: new { message = "Bulk upload started." });
        });

        chordSheets.MapPut("/{id}", async (Guid id, ChordSheetDto dto, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.SetListHub, tcv2.Api.Hubs.ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.ChordSheets.FindAsync(id);
            if (existing == null) return Results.NotFound();
            existing.UpdateFromDto(dto);
            await db.SaveChangesAsync();
            await hub.Clients.All.ChordSheetUpdated(existing);
            return Results.NoContent();
        });

        chordSheets.MapDelete("/{id}", async (Guid id, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.SetListHub, tcv2.Api.Hubs.ISetListClient> hub) =>
        {
            var existing = await db.ChordSheets.FindAsync(id);
            if (existing == null) return Results.NotFound();
            db.ChordSheets.Remove(existing);
            await db.SaveChangesAsync();
            await hub.Clients.All.ChordSheetDeleted(existing.Id);
            return Results.NoContent();
        });

        return api;
    }
}
