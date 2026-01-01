using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;
using System.Security.Claims;
using tcv2.Api.Data.Mappers;

namespace tcv2.Api.Endpoints;

internal static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this RouteGroupBuilder api)
    {
        var users = api.MapGroup("/users");
        users.MapGet("/", async (HttpRequest req, AppDbContext db) =>
        {
            var q = db.Users.AsQueryable();
            if (req.Query.TryGetValue("id", out var id) && Guid.TryParse(id, out var gid)) q = q.Where(x => x.Id == gid);
            if (req.Query.TryGetValue("email", out var email)) q = q.Where(x => EF.Functions.ILike(x.Email!, $"%{email}%"));
            if (req.Query.TryGetValue("emailVerified", out var ev) && bool.TryParse(ev, out var bev)) q = q.Where(x => x.EmailVerified == bev);
            if (req.Query.TryGetValue("name", out var name)) q = q.Where(x => EF.Functions.ILike(x.Name!, $"%{name}%"));
            if (req.Query.TryGetValue("givenName", out var given)) q = q.Where(x => EF.Functions.ILike(x.GivenName!, $"%{given}%"));
            if (req.Query.TryGetValue("familyName", out var family)) q = q.Where(x => EF.Functions.ILike(x.FamilyName!, $"%{family}%"));
            if (req.Query.TryGetValue("createdFrom", out var cf) && DateTime.TryParse(cf, out var cfrom)) q = q.Where(x => x.CreatedAt != null && x.CreatedAt >= cfrom);
            if (req.Query.TryGetValue("createdTo", out var ct) && DateTime.TryParse(ct, out var cto)) q = q.Where(x => x.CreatedAt != null && x.CreatedAt <= cto);
            if (req.Query.TryGetValue("updatedFrom", out var uf) && DateTime.TryParse(uf, out var ufrom)) q = q.Where(x => x.UpdatedAt != null && x.UpdatedAt >= ufrom);
            if (req.Query.TryGetValue("updatedTo", out var ut) && DateTime.TryParse(ut, out var uto)) q = q.Where(x => x.UpdatedAt != null && x.UpdatedAt <= uto);

            var sortBy = req.Query.TryGetValue("sortBy", out var sb) ? sb.ToString() : "createdAt";
            var sortDir = req.Query.TryGetValue("sortDir", out var sd) ? sd.ToString().ToLowerInvariant() : "desc";
            q = sortBy switch
            {
                "email" => sortDir == "asc" ? q.OrderBy(x => x.Email) : q.OrderByDescending(x => x.Email),
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
                new OpenApiParameter { Name = "email", In = ParameterLocation.Query, Description = "Filter by email (contains)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "emailVerified", In = ParameterLocation.Query, Description = "Filter by emailVerified (true|false)", Schema = new OpenApiSchema { Type = "boolean" } },
                new OpenApiParameter { Name = "name", In = ParameterLocation.Query, Description = "Filter by name (contains)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "sortBy", In = ParameterLocation.Query, Description = "Sort field (createdAt,email,name,updatedAt)", Schema = new OpenApiSchema { Type = "string" } },
                new OpenApiParameter { Name = "sortDir", In = ParameterLocation.Query, Description = "Sort direction (asc|desc)", Schema = new OpenApiSchema { Type = "string" } }
            };
            return operation;
        });

        users.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
            await db.Users.FindAsync(id) is User u ? Results.Ok(u.ToDto()) : Results.NotFound());

        users.MapGet("/me", async (HttpRequest req, AppDbContext db) =>
        {
            // For simplicity, assume the user's Auth0 id is in the JWT "sub" claim
            var userId = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            var user = await db.Users.Include(x => x.Organizations).Include(x => x.Profile).FirstOrDefaultAsync(x => x.Auth0UserId == userId);
            if (user == null) return Results.NotFound();
            
            return Results.Ok(user.ToDetailDto());
        });

        users.MapPost("/googlesignin", async (UserDto dto, AppDbContext db) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;

            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return Results.BadRequest(new { message = "Email is required." });
            }

            var existingUser = await db.Users
                .Include(u => u.Organizations)
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (existingUser != null)
            {
                return Results.Ok(existingUser.ToDetailDto());
            }

            var strategy = db.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                await using var tx = await db.Database.BeginTransactionAsync();

                try
                {
                    var u = new User
                    {
                        Id = Guid.NewGuid(),
                        Email = dto.Email,
                        EmailVerified = dto.EmailVerified,
                        Name = $"{dto.GivenName} {dto.FamilyName}",
                        GivenName = dto.GivenName,
                        FamilyName = dto.FamilyName,
                        Picture = dto.Picture,
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    db.Users.Add(u);

                    if (dto.InviteOrganizationId != null)
                    {
                        var org = await db.Organizations.FindAsync(dto.InviteOrganizationId);
                        if (org != null)
                        {
                            u.Organizations.Add(org);
                        }
                    }

                    await db.SaveChangesAsync();
                    await tx.CommitAsync();
                    
                    var user = await db.Users
                        .Include(x => x.Organizations)
                        .Include(x => x.Profile)
                        .FirstOrDefaultAsync(x => x.Id == u.Id);

                    return Results.Created($"/api/users/{u.Id}", user.ToDetailDto());
                }
                catch (DbUpdateException ex)
                {
                    await tx.RollbackAsync();
                    return EndpointHelpers.HandleDbUpdateException(ex);
                }
                catch (Exception ex)
                {
                    await tx.RollbackAsync();
                    return Results.BadRequest(new { message = "Failed to create user", detail = ex.Message });
                }
            });
        }).AllowAnonymous();

        users.MapPost("/", async (UserDto dto, AppDbContext db, IHttpClientFactory httpFactory, IConfiguration config) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;

            if (!string.IsNullOrWhiteSpace(dto.Email) &&
                await db.Users.AnyAsync(x => x.Email == dto.Email))
            {
                return Results.Conflict(new { message = "User with this email already exists" });
            }

            var strategy = db.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                await using var tx = await db.Database.BeginTransactionAsync();
                string? createdAuth0UserId = null;

                try
                {
                    var u = dto.ToEntity();
                    u.Id = Guid.NewGuid();

                    db.Users.Add(u);

                    if (dto.InviteOrganizationId != null)
                    {
                        var org = await db.Organizations.FindAsync(dto.InviteOrganizationId);
                        u.Organizations.Add(org!);
                    }

                    // -------------------------------
                    // AUTH0 CREATION (unchanged)
                    // -------------------------------
                    var auth0Domain = config["Auth0:Domain"] ?? config["AUTH0_DOMAIN"];
                    var auth0ClientId = config["Auth0:ClientId"] ?? config["AUTH0_CLIENT_ID"];
                    var auth0ClientSecret = config["Auth0:ClientSecret"] ?? config["AUTH0_CLIENT_SECRET"];
                    var auth0Connection = config["Auth0:Connection"] ?? "Username-Password-Authentication";

                    if (!string.IsNullOrWhiteSpace(dto.Email)
                        && !string.IsNullOrWhiteSpace(auth0Domain)
                        && !string.IsNullOrWhiteSpace(auth0ClientId)
                        && !string.IsNullOrWhiteSpace(auth0ClientSecret))
                    {
                        var http = httpFactory.CreateClient();

                        // Acquire management token
                        var tokenReq = new
                        {
                            client_id = auth0ClientId,
                            client_secret = auth0ClientSecret,
                            audience = $"https://{auth0Domain}/api/v2/",
                            grant_type = "client_credentials"
                        };

                        using var tokenResp = await http.PostAsJsonAsync(
                            $"https://{auth0Domain}/oauth/token",
                            tokenReq
                        );

                        if (!tokenResp.IsSuccessStatusCode)
                        {
                            await tx.RollbackAsync();
                            var body = await tokenResp.Content.ReadAsStringAsync();
                            return Results.BadRequest(new
                            {
                                message = "Failed to retrieve Auth0 management token",
                                details = body
                            });
                        }

                        var tokenJson = await tokenResp.Content.ReadFromJsonAsync<JsonElement>();
                        var accessToken = tokenJson.GetProperty("access_token").GetString();

                        var userReq = new Dictionary<string, object>
                        {
                            ["email"] = dto.Email!,
                            ["email_verified"] = dto.EmailVerified ?? false,
                            ["name"] = $"{dto.GivenName} {dto.FamilyName}",
                            ["given_name"] = dto.GivenName ?? string.Empty,
                            ["family_name"] = dto.FamilyName ?? string.Empty,
                            ["connection"] = auth0Connection,
                            ["password"] = !string.IsNullOrWhiteSpace(dto.Password)
                                ? dto.Password!
                                : Guid.NewGuid().ToString("N") + "!A1"
                        };

                        var createReq = new HttpRequestMessage(
                            HttpMethod.Post,
                            $"https://{auth0Domain}/api/v2/users")
                        {
                            Content = new StringContent(
                                JsonSerializer.Serialize(userReq), Encoding.UTF8, "application/json")
                        };

                        createReq.Headers.Authorization =
                            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

                        using var createResp = await http.SendAsync(createReq);
                        if (!createResp.IsSuccessStatusCode)
                        {
                            await tx.RollbackAsync();
                            var body = await createResp.Content.ReadAsStringAsync();
                            return Results.BadRequest(new
                            {
                                message = "Failed to create Auth0 user",
                                details = body
                            });
                        }

                        var createJson = await createResp.Content.ReadFromJsonAsync<JsonElement>();
                        if (createJson.TryGetProperty("user_id", out var uid))
                        {
                            createdAuth0UserId = uid.GetString();
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(createdAuth0UserId))
                        u.Auth0UserId = createdAuth0UserId;

                    await db.SaveChangesAsync();
                    await tx.CommitAsync();
                    return Results.Created($"/api/users/{u.Id}", u.ToDetailDto());
                }
                catch (DbUpdateException ex)
                {
                    await tx.RollbackAsync();
                    return EndpointHelpers.HandleDbUpdateException(ex);
                }
                catch (Exception ex)
                {
                    await tx.RollbackAsync();

                    // cleanup Auth0 user if it was created
                    if (!string.IsNullOrWhiteSpace(createdAuth0UserId))
                    {
                        _ = Task.Run(async () =>
                        {
                            try
                            {
                                var http = httpFactory.CreateClient();
                                var auth0Domain = config["Auth0:Domain"] ?? config["AUTH0_DOMAIN"];
                                var auth0ClientId = config["Auth0:ClientId"] ?? config["AUTH0_CLIENT_ID"];
                                var auth0ClientSecret = config["Auth0:ClientSecret"] ?? config["AUTH0_CLIENT_SECRET"];

                                var tokenReq = new
                                {
                                    client_id = auth0ClientId,
                                    client_secret = auth0ClientSecret,
                                    audience = $"https://{auth0Domain}/api/v2/",
                                    grant_type = "client_credentials"
                                };

                                using var tokenResp = await http.PostAsJsonAsync(
                                    $"https://{auth0Domain}/oauth/token", tokenReq);

                                if (tokenResp.IsSuccessStatusCode)
                                {
                                    var tokenJson = await tokenResp.Content.ReadFromJsonAsync<JsonElement>();
                                    var accessToken = tokenJson.GetProperty("access_token").GetString();
                                    var delReq = new HttpRequestMessage(
                                        HttpMethod.Delete,
                                        $"https://{auth0Domain}/api/v2/users/{Uri.EscapeDataString(createdAuth0UserId)}"
                                    );

                                    delReq.Headers.Authorization =
                                        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

                                    await http.SendAsync(delReq);
                                }
                            }
                            catch { }
                        });
                    }

                    return Results.BadRequest(new { message = "Failed to create user", detail = ex.Message });
                }
            }); // end ExecuteAsync
        }).AllowAnonymous();

        users.MapDelete("/{id}", async (Guid id, AppDbContext db) =>
        {
            var existing = await db.Users.FindAsync(id);
            if (existing == null) return Results.NotFound();
            db.Users.Remove(existing);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return api;
    }
}
