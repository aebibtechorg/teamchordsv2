using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using System.Text.Json;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Mappers;
using tcv2.Api.Data.Entities;
using tcv2.Api.Hubs;
using tcv2.Api.Services;
using tcv2.Api.Data.Entities;

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

    // Batch size used for saving during bulk imports. Adjust for performance/memory tradeoffs.
    private const int BulkUploadBatchSize = 50;

    private static async Task<List<Guid>> FlushBulkUploadBatchAsync(AppDbContext db, IHubContext<SetListHub, ISetListClient> hub, ILogger logger, List<ChordSheet> pendingBatch)
    {
        var createdIds = new List<Guid>();
        if (pendingBatch.Count == 0) return createdIds;

        try
        {
            db.ChordSheets.AddRange(pendingBatch);
            await db.SaveChangesAsync();

            // Notify clients for each created chordsheet
            foreach (var cs in pendingBatch)
            {
                createdIds.Add(cs.Id);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Bulk save failed for {Count} chord sheets, falling back to single-item saves.", pendingBatch.Count);

            // Clear tracked entities so we can try single-item saves
            try { db.ChangeTracker.Clear(); } catch (Exception clearEx) { logger.LogDebug(clearEx, "ChangeTracker.Clear failed during bulk fallback cleanup."); }

            foreach (var cs in pendingBatch)
            {
                try
                {
                    db.ChordSheets.Add(cs);
                    await db.SaveChangesAsync();
                    createdIds.Add(cs.Id);
                }
                catch (Exception itemEx)
                {
                    logger.LogError(itemEx, "Failed to import chord sheet {Title} during bulk fallback.", cs.Title);
                    try { db.ChangeTracker.Clear(); } catch (Exception clearEx) { logger.LogDebug(clearEx, "ChangeTracker.Clear failed during per-item fallback."); }
                }
            }
        }
        finally
        {
            pendingBatch.Clear();
            try { db.ChangeTracker.Clear(); } catch (Exception clearEx) { logger.LogDebug(clearEx, "ChangeTracker.Clear failed during bulk finally cleanup."); }
        }

        return createdIds;
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

            // Require membership
            var auth = await EndpointHelpers.RequireOrgMember(req, db, og);
            if (auth != null) return auth;

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

            // Require org admin/owner for backup exports
            var auth = await EndpointHelpers.RequireOrgAdminOrOwner(req, db, og);
            if (auth != null) return auth;

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

        chordSheets.MapGet("/{id}", async (Guid id, HttpRequest req, AppDbContext db) =>
        {
            var cs = await db.ChordSheets.FindAsync(id);
            if (cs == null) return Results.NotFound();

            // if (cs.OrgId.HasValue)
            // {
            //     var auth = await EndpointHelpers.RequireOrgMember(req, db, cs.OrgId.Value);
            //     if (auth != null) return auth;
            // }
            // else
            // {
            //     if (!EndpointHelpers.IsPlatformAdminOrSupport(req)) return Results.Forbid();
            // }

            return Results.Ok(cs.ToDto());
        }).AllowAnonymous();

        chordSheets.MapPost("/", async (ChordSheetDto dto, HttpRequest req, AppDbContext db, IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;

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

            var currentChordSheetCount = dto.OrgId.HasValue ? await db.ChordSheets.CountAsync(c => c.OrgId == dto.OrgId) : 0;
            if (org != null)
            {
                var gate = FeatureGate.CheckLimits(org, currentChordSheetCount + 1, 0, 0, 0);
                if (gate != null) return gate;
            }

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

        chordSheets.MapPost("/bulk", async ([FromBody] BulkChordSheetRequestDto request, [FromServices] IServiceProvider services, HttpRequest req, AppDbContext db) =>
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

            var uploadDtos = request.Dtos.ToArray();
            var connectionId = request.ConnectionId;
            var targetOrgId = orgId.Value;

            // Require org admin/owner for bulk upload
            var auth = await EndpointHelpers.RequireOrgMember(req, db, targetOrgId);
            if (auth != null) return auth;

            var org = await db.Organizations.FindAsync(targetOrgId);
            if (org == null) return Results.NotFound("Organization not found");

            var gate = FeatureGate.CheckBulkUpload(org);
            if (gate != null) return gate;

            async Task DoBulkImportAsync()
            {
                // Create a new scope to resolve scoped services like DbContext
                using var scope = services.CreateScope();
                var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var hub = scope.ServiceProvider.GetRequiredService<IHubContext<SetListHub, ISetListClient>>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

                var total = uploadDtos.Length;
                var processedCount = 0;
                var pendingBatch = new List<ChordSheet>(BulkUploadBatchSize);
                var allCreatedIds = new List<Guid>();

                try
                {
                    foreach (var dto in uploadDtos)
                    {
                        processedCount++;

                        try
                        {
                            var progressMessage = $"Queueing '{dto.Title}'...";
                            await hub.Clients.Client(connectionId).BulkUploadProgress(processedCount, total, progressMessage);
                        }
                        catch (Exception ex)
                        {
                            logger.LogWarning(ex, "Failed to send bulk upload progress for chord sheet {Title}.", dto.Title);
                        }

                        var validation = EndpointHelpers.Validate(dto);
                        if (validation != null)
                        {
                            logger.LogWarning("Validation failed for a chordsheet in bulk upload. Title: {Title}", dto.Title);
                            continue;
                        }

                        try
                        {
                            var cs = dto.ToEntity();
                            cs.Id = Guid.NewGuid();
                            pendingBatch.Add(cs);

                            if (pendingBatch.Count >= BulkUploadBatchSize)
                            {
                                var created = await FlushBulkUploadBatchAsync(scopedDb, hub, logger, pendingBatch);
                                if (created.Count > 0) allCreatedIds.AddRange(created);
                            }
                        }
                        catch (Exception ex)
                        {
                            logger.LogError(ex, "Failed to prepare chord sheet {Title} during bulk upload.", dto.Title);
                        }
                    }

                    // Flush any remaining items
                    var lastCreated = await FlushBulkUploadBatchAsync(scopedDb, hub, logger, pendingBatch);
                    if (lastCreated.Count > 0) allCreatedIds.AddRange(lastCreated);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Unexpected error while processing bulk chord sheet upload for organization {OrgId}.", targetOrgId);
                }
                finally
                {
                    using var scope2 = services.CreateScope();
                    var hub2 = scope2.ServiceProvider.GetRequiredService<IHubContext<SetListHub, ISetListClient>>();
                    var logger2 = scope2.ServiceProvider.GetRequiredService<ILogger<Program>>();

                    try
                    {
                        // Send a summary to organization group (single notification)
                        try
                        {
                            var summary = new BulkUploadSummaryDto
                            {
                                CreatedIds = allCreatedIds.ToArray(),
                                TotalProcessed = total,
                                Successful = allCreatedIds.Count,
                                Failed = total - allCreatedIds.Count
                            };
                            await hub2.Clients.Group(HubGroupNames.Organization(targetOrgId)).BulkUploadSummary(summary);
                        }
                        catch (Exception ex)
                        {
                            logger2.LogWarning(ex, "Failed to send bulk upload summary for org {OrgId}.", targetOrgId);
                        }

                        await hub2.Clients.Client(connectionId).BulkUploadFinished();
                    }
                    catch (Exception ex)
                    {
                        logger2.LogWarning(ex, "Failed to send bulk upload finished notification for connection {ConnectionId}.", connectionId);
                    }
                }
            }

            _ = Task.Run((Func<Task>)DoBulkImportAsync);

            return Results.Accepted(value: new { message = "Bulk upload started." });
        });

        chordSheets.MapPut("/{id}", async (Guid id, ChordSheetDto dto, HttpRequest req, AppDbContext db, IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.ChordSheets.FindAsync(id);
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

        chordSheets.MapDelete("/{id}", async (Guid id, HttpRequest req, AppDbContext db, IHubContext<SetListHub, ISetListClient> hub) =>
        {
            var existing = await db.ChordSheets.FindAsync(id);
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