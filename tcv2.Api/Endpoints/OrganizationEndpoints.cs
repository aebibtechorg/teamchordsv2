using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;
using System.Security.Claims;
using tcv2.Api.Data.Mappers;
using tcv2.Api.Services;

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
        {
            var o = await db.Organizations.FindAsync(id);
            return o is not null ? Results.Ok(o.ToDto()) : Results.NotFound();
        });

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

            var strategy = db.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var tx = await db.Database.BeginTransactionAsync();
                try
                {
                    var auth0UserId = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
                    if (string.IsNullOrWhiteSpace(auth0UserId)) return Results.Unauthorized();

                    var user = await db.Users.Include(u => u.Organizations).FirstOrDefaultAsync(x => x.Auth0UserId == auth0UserId);
                    if (user == null) return Results.NotFound(new { message = "User not found" });

                    var ownsOrg = await db.Organizations.AnyAsync(x => x.OwnerUserId == user.Id);
                    if (ownsOrg)
                    {
                        return Results.Conflict(new { message = "You already own an organization." });
                    }

                    o.OwnerUserId = user.Id;
                    db.Organizations.Add(o);

                    // Add the new organization to the user's organizations (many-to-many)
                    var userOrg = new UserOrganization
                    {
                        UserId = user.Id,
                        OrganizationId = o.Id,
                        Role = OrgRole.Admin,
                        CreatedAt = DateTime.UtcNow
                    };
                    db.UserOrganizations.Add(userOrg);

                    user.UpdatedAt = DateTime.UtcNow;
                    // user is tracked by EF; changes will be persisted below when we save

                    await OrganizationOnboardingSeeder.SeedAsync(db, o, DateTime.UtcNow);

                    await db.SaveChangesAsync();
                    await tx.CommitAsync();
                    return Results.Created($"/api/organizations/{o.Id}", o.ToDto());
                }
                catch (DbUpdateException ex)
                {
                    await tx.RollbackAsync();
                    return EndpointHelpers.HandleDbUpdateException(ex);
                }
            });
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
            await using var tx = await db.Database.BeginTransactionAsync();

            var setListIds = await db.SetLists.Where(s => s.OrgId == id).Select(s => s.Id).ToListAsync();
            var outputs = await db.Outputs
                .Where(o => o.SetListId != null && setListIds.Contains(o.SetListId.Value))
                .ToListAsync();

            var setLists = await db.SetLists.Where(s => s.OrgId == id).ToListAsync();
            var chordSheets = await db.ChordSheets.Where(c => c.OrgId == id).ToListAsync();
            var invites = await db.Invites.Where(i => i.OrganizationId == id).ToListAsync();
            var memberships = await db.UserOrganizations.Where(uo => uo.OrganizationId == id).ToListAsync();

            db.Outputs.RemoveRange(outputs);
            db.SetLists.RemoveRange(setLists);
            db.ChordSheets.RemoveRange(chordSheets);
            db.Invites.RemoveRange(invites);
            db.UserOrganizations.RemoveRange(memberships);
            db.Organizations.Remove(existing);
            await db.SaveChangesAsync();
            await tx.CommitAsync();
            return Results.NoContent();
        });

        orgs.MapGet("/{id}/members", async (Guid id, HttpRequest req, AppDbContext db) =>
        {
            var q = db.UserOrganizations.Where(uo => uo.OrganizationId == id).Include(uo => uo.User);
            var members = q.Select(uo => new OrgMemberDto
            {
                UserId = uo.UserId,
                Name = uo.User.Name,
                Email = uo.User.Email,
                Picture = uo.User.Picture,
                Role = uo.Role.ToString(),
                JoinedAt = uo.CreatedAt
            });
            return await EndpointHelpers.ApplyPagingAndFilter(members, req);
        });

        orgs.MapDelete("/{id}/members/{userId}", async (Guid id, Guid userId, HttpRequest req, AppDbContext db) =>
        {
            var auth0UserId = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var caller = await db.Users.FirstOrDefaultAsync(u => u.Auth0UserId == auth0UserId);
            if (caller == null) return Results.Unauthorized();

            var org = await db.Organizations.FindAsync(id);
            if (org == null) return Results.NotFound();

            var callerMembership = await db.UserOrganizations.FirstOrDefaultAsync(uo => uo.OrganizationId == id && uo.UserId == caller.Id);
            if (callerMembership == null && org.OwnerUserId != caller.Id) return Results.Forbid();
            if (callerMembership != null && callerMembership.Role != OrgRole.Admin && org.OwnerUserId != caller.Id) return Results.Forbid();

            if (org.OwnerUserId == userId) return Results.Conflict(new { message = "Cannot remove the organization owner." });

            var adminCount = await db.UserOrganizations.CountAsync(uo => uo.OrganizationId == id && uo.Role == OrgRole.Admin);
            var userOrg = await db.UserOrganizations.FirstOrDefaultAsync(uo => uo.OrganizationId == id && uo.UserId == userId);
            if (userOrg == null) return Results.NotFound();

            if (adminCount == 1 && userOrg.Role == OrgRole.Admin) return Results.Conflict(new { message = "Cannot remove the last admin from the organization" });

            db.UserOrganizations.Remove(userOrg);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        orgs.MapPatch("/{id}/members/{userId}/role", async (Guid id, Guid userId, RoleDto dto, HttpRequest req, AppDbContext db) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;

            var auth0UserId = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var caller = await db.Users.FirstOrDefaultAsync(u => u.Auth0UserId == auth0UserId);
            if (caller == null) return Results.Unauthorized();

            var org = await db.Organizations.FindAsync(id);
            if (org == null) return Results.NotFound();

            var callerMembership = await db.UserOrganizations.FirstOrDefaultAsync(uo => uo.OrganizationId == id && uo.UserId == caller.Id);
            if (callerMembership == null && org.OwnerUserId != caller.Id) return Results.Forbid();
            if (callerMembership != null && callerMembership.Role != OrgRole.Admin && org.OwnerUserId != caller.Id) return Results.Forbid();

            var adminCount = await db.UserOrganizations.CountAsync(uo => uo.OrganizationId == id && uo.Role == OrgRole.Admin);
            var userOrg = await db.UserOrganizations.FirstOrDefaultAsync(uo => uo.OrganizationId == id && uo.UserId == userId);
            if (userOrg == null) return Results.NotFound();

            if (org.OwnerUserId == userId && dto.Role != "Admin") return Results.Conflict(new { message = "Cannot demote the organization owner." });
            if (adminCount == 1 && userOrg.Role == OrgRole.Admin && dto.Role != "Admin") return Results.Conflict(new { message = "Cannot demote the last admin from the organization" });

            userOrg.Role = Enum.Parse<OrgRole>(dto.Role);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return api;
    }
}
