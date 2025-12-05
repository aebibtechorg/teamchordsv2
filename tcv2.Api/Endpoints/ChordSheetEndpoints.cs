using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;

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

            var sortBy = req.Query.TryGetValue("sortBy", out var sb) ? sb.ToString() : "createdAt";
            var sortDir = req.Query.TryGetValue("sortDir", out var sd) ? sd.ToString().ToLowerInvariant() : "desc";
            q = sortBy switch
            {
                "title" => sortDir == "asc" ? q.OrderBy(x => x.Title) : q.OrderByDescending(x => x.Title),
                "artist" => sortDir == "asc" ? q.OrderBy(x => x.Artist) : q.OrderByDescending(x => x.Artist),
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
                new OpenApiParameter { Name = "title", In = ParameterLocation.Query, Description = "Filter by title (case-insensitive, contains)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "artist", In = ParameterLocation.Query, Description = "Filter by artist (case-insensitive, contains)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "sortBy", In = ParameterLocation.Query, Description = "Sort field (createdAt,title,artist,updatedAt)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "sortDir", In = ParameterLocation.Query, Description = "Sort direction (asc|desc)", Schema = new OpenApiSchema { Type = "string" } }
            };
            return operation;
        });

        chordSheets.MapGet("/{id}", async (Guid id, AppDbContext db) =>
            await db.ChordSheets.FindAsync(id) is ChordSheet cs ? Results.Ok(cs) : Results.NotFound())
            .AllowAnonymous();

        chordSheets.MapPost("/", async (ChordSheetDto dto, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.ChordSheetHub, tcv2.Api.Hubs.IChordSheetClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var cs = new ChordSheet
            {
                Id = Guid.NewGuid(),
                OrgId = dto.OrgId,
                Title = dto.Title,
                Artist = dto.Artist,
                Content = dto.Content,
                Key = dto.Key,
                CreatedAt = DateTime.UtcNow
            };
            db.ChordSheets.Add(cs);
            await db.SaveChangesAsync();
            await hub.Clients.All.ChordSheetCreated(cs);
            return Results.Created($"/api/chordsheets/{cs.Id}", cs);
        });

        chordSheets.MapPost("/bulk", (BulkChordSheetRequestDto request, IServiceProvider services) =>
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
                var hub = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.ChordSheetHub, tcv2.Api.Hubs.IChordSheetClient>>();
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

                    var cs = new ChordSheet { Id = Guid.NewGuid(), OrgId = dto.OrgId, Title = dto.Title, Artist = dto.Artist, Content = dto.Content, Key = dto.Key, CreatedAt = DateTime.UtcNow };
                    db.ChordSheets.Add(cs);
                    await db.SaveChangesAsync();
                    await hub.Clients.All.ChordSheetCreated(cs);
                }

                await hub.Clients.Client(request.ConnectionId).BulkUploadFinished();
            });

            return Results.Accepted(value: new { message = "Bulk upload started." });
        });

        chordSheets.MapPut("/{id}", async (Guid id, ChordSheetDto dto, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.ChordSheetHub, tcv2.Api.Hubs.IChordSheetClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.ChordSheets.FindAsync(id);
            if (existing == null) return Results.NotFound();
            existing.OrgId = dto.OrgId;
            existing.Title = dto.Title;
            existing.Artist = dto.Artist;
            existing.Content = dto.Content;
            existing.Key = dto.Key;
            existing.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            await hub.Clients.All.ChordSheetUpdated(existing);
            return Results.NoContent();
        });

        chordSheets.MapDelete("/{id}", async (Guid id, AppDbContext db, Microsoft.AspNetCore.SignalR.IHubContext<tcv2.Api.Hubs.ChordSheetHub, tcv2.Api.Hubs.IChordSheetClient> hub) =>
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
