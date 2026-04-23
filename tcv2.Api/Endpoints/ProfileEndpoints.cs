using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;
using tcv2.Api.Data.Mappers;

namespace tcv2.Api.Endpoints;

internal static class ProfileEndpoints
{
    public static RouteGroupBuilder MapProfileEndpoints(this RouteGroupBuilder api)
    {
        var profiles = api.MapGroup("/profiles");
        profiles.MapGet("/", async (HttpRequest req, AppDbContext db) =>
        {
            var q = db.Profiles.AsQueryable();
            if (req.Query.TryGetValue("id", out var id) && Guid.TryParse(id, out var gid)) q = q.Where(x => x.Id == gid);
            if (req.Query.TryGetValue("userId", out var uid) && Guid.TryParse(uid, out var ug)) q = q.Where(x => x.UserId == ug);
            if (req.Query.TryGetValue("orgId", out var orgId) && Guid.TryParse(orgId, out var g)) q = q.Where(x => x.OrgId == g);
            if (req.Query.TryGetValue("createdFrom", out var cf) && DateTime.TryParse(cf, out var cfrom)) q = q.Where(x => x.CreatedAt >= cfrom);
            if (req.Query.TryGetValue("createdTo", out var ct) && DateTime.TryParse(ct, out var cto)) q = q.Where(x => x.CreatedAt <= cto);
            if (req.Query.TryGetValue("updatedFrom", out var uf) && DateTime.TryParse(uf, out var ufrom)) q = q.Where(x => x.UpdatedAt != null && x.UpdatedAt >= ufrom);
            if (req.Query.TryGetValue("updatedTo", out var ut) && DateTime.TryParse(ut, out var uto)) q = q.Where(x => x.UpdatedAt != null && x.UpdatedAt <= uto);

            var sortBy = req.Query.TryGetValue("sortBy", out var sb) ? sb.ToString() : "createdAt";
            var sortDir = req.Query.TryGetValue("sortDir", out var sd) ? sd.ToString().ToLowerInvariant() : "desc";
            q = sortBy switch
            {
                "userId" => sortDir == "asc" ? q.OrderBy(x => x.UserId) : q.OrderByDescending(x => x.UserId),
                "updatedAt" => sortDir == "asc" ? q.OrderBy(x => x.UpdatedAt) : q.OrderByDescending(x => x.UpdatedAt),
                _ => sortDir == "asc" ? q.OrderBy(x => x.CreatedAt) : q.OrderByDescending(x => x.CreatedAt),
            };

            return await EndpointHelpers.ApplyPagingAndFilter(q.Select(x => x.ToDto()), req);
        }).WithOpenApi(operation =>
        {
            operation.Parameters = new List<OpenApiParameter>
            {
                new OpenApiParameter { Name = "page", In = ParameterLocation.Query, Description = "Page number (1-based)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(1) } },
                new OpenApiParameter { Name = "pageSize", In = ParameterLocation.Query, Description = "Page size (max 100)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(20) } },
                new OpenApiParameter { Name = "userId", In = ParameterLocation.Query, Description = "Filter by UserId (guid)", Schema = new OpenApiSchema { Type = "string", Format = "uuid" } },
                new OpenApiParameter { Name = "orgId", In = ParameterLocation.Query, Description = "Filter by OrgId (guid)", Schema = new OpenApiSchema { Type = "string", Format = "uuid" } },
                new OpenApiParameter { Name = "createdFrom", In = ParameterLocation.Query, Description = "Filter by created date from (ISO)", Schema = new OpenApiSchema { Type = "string", Format = "date-time" } },
                new OpenApiParameter { Name = "createdTo", In = ParameterLocation.Query, Description = "Filter by created date to (ISO)", Schema = new OpenApiSchema { Type = "string", Format = "date-time" } },
                new OpenApiParameter { Name = "sortBy", In = ParameterLocation.Query, Description = "Sort field (createdAt,userId,updatedAt)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "sortDir", In = ParameterLocation.Query, Description = "Sort direction (asc|desc)", Schema = new OpenApiSchema { Type = "string" } }
            };
            return operation;
        });

        profiles.MapGet("/{id}", async (Guid id, AppDbContext db) =>
            await db.Profiles.FindAsync(id) is { } p ? Results.Ok(p.ToDto()) : Results.NotFound());

        profiles.MapPost("/", async (ProfileDto dto, AppDbContext db) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var p = dto.ToEntity();
            p.Id = Guid.NewGuid();
            
            db.Profiles.Add(p);
            await db.SaveChangesAsync();
            return Results.Created($"/api/profiles/{p.Id}", p.ToDto());
        });

        profiles.MapPut("/{id}", async (Guid id, ProfileDto dto, AppDbContext db) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.Profiles.FindAsync(id);
            if (existing == null) return Results.NotFound();
            existing.UpdateFromDto(dto);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        profiles.MapDelete("/{id}", async (Guid id, AppDbContext db) =>
        {
            var existing = await db.Profiles.FindAsync(id);
            if (existing == null) return Results.NotFound();
            db.Profiles.Remove(existing);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return api;
    }
}


