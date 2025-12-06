using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;
using System.Security.Claims;
using tcv2.Api.Data.Mappers;

namespace tcv2.Api.Endpoints;

internal static class OrganizationEndpoints
{
    public static RouteGroupBuilder MapOrganizationEndpoints(this RouteGroupBuilder api)
    {
        var orgs = api.MapGroup("/organizations");
        orgs.MapGet("/", async (HttpRequest req, AppDbContext db) =>
        {
            var q = db.Organizations.AsQueryable();
            if (req.Query.TryGetValue("id", out var id) && Guid.TryParse(id, out var gid)) q = q.Where(x => x.Id == gid);
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

            return await EndpointHelpers.ApplyPagingAndFilter(q.Select(x => x.ToDto()), req);
        }).WithOpenApi(operation =>
        {
            operation.Parameters = new List<OpenApiParameter>
            {
                new OpenApiParameter { Name = "page", In = ParameterLocation.Query, Description = "Page number (1-based)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(1) } },
                new OpenApiParameter { Name = "pageSize", In = ParameterLocation.Query, Description = "Page size (max 100)", Schema = new OpenApiSchema { Type = "integer", Default = new OpenApiInteger(20) } },
                new OpenApiParameter { Name = "name", In = ParameterLocation.Query, Description = "Filter by organization name (contains)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "createdFrom", In = ParameterLocation.Query, Description = "Filter by created date from (ISO)", Schema = new OpenApiSchema { Type = "string", Format = "date-time" } },
                new OpenApiParameter { Name = "createdTo", In = ParameterLocation.Query, Description = "Filter by created date to (ISO)", Schema = new OpenApiSchema { Type = "string", Format = "date-time" } },
                new OpenApiParameter { Name = "sortBy", In = ParameterLocation.Query, Description = "Sort field (createdAt,name,updatedAt)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "sortDir", In = ParameterLocation.Query, Description = "Sort direction (asc|desc)", Schema = new OpenApiSchema { Type = "string" } }
            };
            return operation;
        });

        orgs.MapGet("/{id}", async (Guid id, AppDbContext db) =>
            await db.Organizations.FindAsync(id) is Organization o ? Results.Ok(o.ToDto()) : Results.NotFound());

        orgs.MapPost("/", async (HttpRequest req, OrganizationDto dto, AppDbContext db) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            if (!string.IsNullOrWhiteSpace(dto.Name) && await db.Organizations.AnyAsync(x => x.Name == dto.Name))
            {
                return Results.Conflict(new { message = "Organization name already exists" });
            }

            var o = new Organization
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                CreatedAt = DateTime.UtcNow
            };
            db.Organizations.Add(o);
            try
            {
                // If an authenticated user initiated this request, associate them with the new organization.
                var auth0UserId = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                if (!string.IsNullOrWhiteSpace(auth0UserId))
                {
                    var user = await db.Users.Include(u => u.Organizations).FirstOrDefaultAsync(x => x.Auth0UserId == auth0UserId);
                    if (user != null)
                    {
                        // Add the new organization to the user's organizations (many-to-many)
                        if (!user.Organizations.Any(org => org.Id == o.Id))
                        {
                            user.Organizations.Add(o);
                        }

                        user.UpdatedAt = DateTime.UtcNow;
                        // user is tracked by EF; changes will be persisted below when we save
                    }
                }

                await db.SaveChangesAsync();
                return Results.Created($"/api/organizations/{o.Id}", o.ToDto());
            }
            catch (DbUpdateException ex)
            {
                return EndpointHelpers.HandleDbUpdateException(ex);
            }
        });

        orgs.MapPut("/{id}", async (Guid id, OrganizationDto dto, AppDbContext db) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.Organizations.FindAsync(id);
            if (existing == null) return Results.NotFound();
            if (!string.IsNullOrWhiteSpace(dto.Name) && dto.Name != existing.Name && await db.Organizations.AnyAsync(x => x.Name == dto.Name))
            {
                return Results.Conflict(new { message = "Organization name already exists" });
            }
            existing.UpdateFromDto(dto);
            existing.UpdatedAt = DateTime.UtcNow;
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

        orgs.MapDelete("/{id}", async (Guid id, AppDbContext db) =>
        {
            var existing = await db.Organizations.FindAsync(id);
            if (existing == null) return Results.NotFound();
            db.Organizations.Remove(existing);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return api;
    }
}
