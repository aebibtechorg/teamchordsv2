using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Endpoints;

internal static class InviteEndpoints
{
    public static RouteGroupBuilder MapInviteEndpoints(this RouteGroupBuilder api)
    {
        var invites = api.MapGroup("/invites");
        invites.MapGet("/", async (HttpRequest req, AppDbContext db) =>
        {
            var q = db.Invites.AsQueryable();
            if (req.Query.TryGetValue("id", out var id) && Guid.TryParse(id, out var gid)) q = q.Where(x => x.Id == gid);
            if (req.Query.TryGetValue("email", out var email)) q = q.Where(x => EF.Functions.ILike(x.Email!, $"%{email}%"));
            if (req.Query.TryGetValue("invitedBy", out var ib) && Guid.TryParse(ib, out var ibg)) q = q.Where(x => x.InvitedBy == ibg);
            if (req.Query.TryGetValue("token", out var token)) q = q.Where(x => EF.Functions.ILike(x.Token!, $"%{token}%"));
            if (req.Query.TryGetValue("used", out var used) && bool.TryParse(used, out var bused)) q = q.Where(x => x.Used == bused);
            if (req.Query.TryGetValue("createdFrom", out var cf) && DateTimeOffset.TryParse(cf, out var cfrom)) q = q.Where(x => x.CreatedAt >= cfrom);
            if (req.Query.TryGetValue("createdTo", out var ct) && DateTimeOffset.TryParse(ct, out var cto)) q = q.Where(x => x.CreatedAt <= cto);
            if (req.Query.TryGetValue("expiresFrom", out var ef) && DateTimeOffset.TryParse(ef, out var efrom)) q = q.Where(x => x.ExpiresAt >= efrom);
            if (req.Query.TryGetValue("expiresTo", out var et) && DateTimeOffset.TryParse(et, out var eto)) q = q.Where(x => x.ExpiresAt <= eto);

            var sortBy = req.Query.TryGetValue("sortBy", out var sb) ? sb.ToString() : "createdAt";
            var sortDir = req.Query.TryGetValue("sortDir", out var sd) ? sd.ToString().ToLowerInvariant() : "desc";
            q = sortBy switch
            {
                "email" => sortDir == "asc" ? q.OrderBy(x => x.Email) : q.OrderByDescending(x => x.Email),
                "expiresAt" => sortDir == "asc" ? q.OrderBy(x => x.ExpiresAt) : q.OrderByDescending(x => x.ExpiresAt),
                _ => sortDir == "asc" ? q.OrderBy(x => x.CreatedAt) : q.OrderByDescending(x => x.CreatedAt),
            };

            return await EndpointHelpers.ApplyPagingAndFilter(q, req);
        }).WithOpenApi(operation =>
        {
            operation.Parameters = new List<OpenApiParameter>
            {
                new OpenApiParameter { Name = "page", In = ParameterLocation.Query, Description = "Page number (1-based)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(1) } },
                new OpenApiParameter { Name = "pageSize", In = ParameterLocation.Query, Description = "Page size (max 100)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(20) } },
                new OpenApiParameter { Name = "email", In = ParameterLocation.Query, Description = "Filter by email (case-insensitive, contains)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "token", In = ParameterLocation.Query, Description = "Filter by token (contains)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "used", In = ParameterLocation.Query, Description = "Filter by used flag (true|false)", Schema = new OpenApiSchema { Type = "boolean" } },
                new OpenApiParameter { Name = "sortBy", In = ParameterLocation.Query, Description = "Sort field (createdAt,email,expiresAt)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "sortDir", In = ParameterLocation.Query, Description = "Sort direction (asc|desc)", Schema = new OpenApiSchema { Type = "string" } }
            };
            return operation;
        });

        invites.MapGet("/{id}", async (Guid id, AppDbContext db) =>
            await db.Invites.FindAsync(id) is Invite i ? Results.Ok(i) : Results.NotFound());

        invites.MapPost("/", async (InviteDto dto, AppDbContext db) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;

            var i = new Invite
            {
                Id = Guid.NewGuid(),
                Email = dto.Email,
                InvitedBy = dto.InvitedBy ?? Guid.Empty,
                Token = dto.Token,
                Used = dto.Used,
                CreatedAt = DateTimeOffset.UtcNow,
                ExpiresAt = dto.ExpiresAt ?? DateTimeOffset.UtcNow.AddDays(7)
            };
            db.Invites.Add(i);
            try
            {
                await db.SaveChangesAsync();
                return Results.Created($"/api/invites/{i.Id}", i);
            }
            catch (DbUpdateException ex)
            {
                return EndpointHelpers.HandleDbUpdateException(ex);
            }
        });

        invites.MapPut("/{id}", async (Guid id, InviteDto dto, AppDbContext db) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.Invites.FindAsync(id);
            if (existing == null) return Results.NotFound();
            existing.Email = dto.Email;
            existing.Token = dto.Token;
            existing.Used = dto.Used;
            existing.ExpiresAt = dto.ExpiresAt ?? existing.ExpiresAt;
            try
            {
                await db.SaveChangesAsync();
                return Results.NoContent();
            }
            catch (DbUpdateException ex)
            {
                return EndpointHelpers.HandleDbUpdateException(ex);
            }
        });

        invites.MapDelete("/{id}", async (Guid id, AppDbContext db) =>
        {
            var existing = await db.Invites.FindAsync(id);
            if (existing == null) return Results.NotFound();
            db.Invites.Remove(existing);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return api;
    }
}
