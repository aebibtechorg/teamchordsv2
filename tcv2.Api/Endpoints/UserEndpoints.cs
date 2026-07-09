using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Text.Json;
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
        {
            var user = await db.Users.FindAsync(id);
            return user is not null ? Results.Ok(user.ToDto()) : Results.NotFound();
        });

        users.MapGet("/me", async (HttpRequest req, AppDbContext db, IHttpClientFactory httpFactory, IConfiguration config) =>
        {
            var userId = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userId)) return Results.Unauthorized();

            var user = await db.Users
                .Include(x => x.UserOrganizations).ThenInclude(uo => uo.Organization)
                .Include(x => x.Profile)
                .FirstOrDefaultAsync(x => x.Auth0UserId == userId);

            if (user == null)
            {
                var email = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email || c.Type == "email" || c.Type == "https://teamchordsapp.io/email")?.Value;
                var name = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == "name" || c.Type == ClaimTypes.Name)?.Value;
                var givenName = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == "given_name" || c.Type == ClaimTypes.GivenName)?.Value;
                var familyName = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == "family_name" || c.Type == ClaimTypes.Surname)?.Value;
                var picture = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == "picture")?.Value;

                var authHeader = req.Headers.Authorization.ToString();
                var auth0Domain = config["Auth0:Domain"] ?? config["AUTH0_DOMAIN"];
                if (!string.IsNullOrWhiteSpace(authHeader) && !string.IsNullOrWhiteSpace(auth0Domain))
                {
                    try
                    {
                        var http = httpFactory.CreateClient();
                        using var userInfoReq = new HttpRequestMessage(HttpMethod.Get, $"https://{auth0Domain}/userinfo");
                        userInfoReq.Headers.Add("Authorization", authHeader);

                        using var userInfoResp = await http.SendAsync(userInfoReq);
                        if (userInfoResp.IsSuccessStatusCode)
                        {
                            var profileJson = await userInfoResp.Content.ReadFromJsonAsync<JsonElement>();
                            if (profileJson.TryGetProperty("email", out var e)) email = e.GetString();
                            if (profileJson.TryGetProperty("name", out var n)) name = n.GetString();
                            if (profileJson.TryGetProperty("given_name", out var gn)) givenName = gn.GetString();
                            if (profileJson.TryGetProperty("family_name", out var fn)) familyName = fn.GetString();
                            if (profileJson.TryGetProperty("picture", out var pic)) picture = pic.GetString();
                        }
                    }
                    catch
                    {
                        // Fall back to token claims on network issues or mock environments
                    }
                }

                user = new User
                {
                    Id = Guid.NewGuid(),
                    Auth0UserId = userId,
                    Email = email,
                    EmailVerified = true,
                    Name = name ?? $"{givenName} {familyName}".Trim(),
                    GivenName = givenName,
                    FamilyName = familyName,
                    Picture = picture,
                    CreatedAt = DateTime.UtcNow
                };

                db.Users.Add(user);
                await db.SaveChangesAsync();

                if (!string.IsNullOrWhiteSpace(email))
                {
                    var pendingInvites = await db.Invites
                        .Where(i => i.Email.ToLower() == email.ToLower() && i.Used && i.OrganizationId != null)
                        .ToListAsync();

                    bool invitesSynced = false;
                    foreach (var invite in pendingInvites)
                    {
                        var alreadyMember = await db.UserOrganizations.AnyAsync(uo => uo.UserId == user.Id && uo.OrganizationId == invite.OrganizationId);
                        if (!alreadyMember)
                        {
                            var userOrg = new UserOrganization
                            {
                                UserId = user.Id,
                                OrganizationId = invite.OrganizationId!.Value,
                                Role = OrgRole.Member,
                                CreatedAt = DateTime.UtcNow
                            };
                            db.UserOrganizations.Add(userOrg);
                            invitesSynced = true;
                        }
                    }

                    if (invitesSynced)
                    {
                        await db.SaveChangesAsync();
                    }
                }

                // Reload user to hydrate navigation properties cleanly
                user = await db.Users
                    .Include(x => x.UserOrganizations).ThenInclude(uo => uo.Organization)
                    .Include(x => x.Profile)
                    .FirstOrDefaultAsync(x => x.Id == user.Id);
            }

            return Results.Ok(user!.ToDetailDto());
        });

        users.MapPut("/me", async (UpdateMeDto dto, HttpRequest req, AppDbContext db) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;

            var userId = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var user = await db.Users.FirstOrDefaultAsync(x => x.Auth0UserId == userId);
            if (user == null) return Results.NotFound();

            user.GivenName = dto.GivenName;
            user.FamilyName = dto.FamilyName;
            user.Name = $"{dto.GivenName} {dto.FamilyName}";
            user.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();

            var updatedUser = await db.Users.Include(x => x.UserOrganizations).ThenInclude(uo => uo.Organization).Include(x => x.Profile).FirstOrDefaultAsync(x => x.Id == user.Id);
            if (updatedUser is null) return Results.NotFound();
            return Results.Ok(updatedUser.ToDetailDto());
        });


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
                string? createdAuth0Picture = null;

                try
                {
                    var u = dto.ToEntity();
                    u.Id = Guid.NewGuid();

                    db.Users.Add(u);

                    if (dto.InviteOrganizationId != null)
                    {
                        var userOrg = new UserOrganization
                        {
                            UserId = u.Id,
                            OrganizationId = dto.InviteOrganizationId.Value,
                            Role = OrgRole.Member,
                            CreatedAt = DateTime.UtcNow
                        };
                        db.UserOrganizations.Add(userOrg);
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

                        if (createJson.TryGetProperty("picture", out var pic))
                        {
                            createdAuth0Picture = pic.GetString();
                        }
                    }

                    if (!string.IsNullOrWhiteSpace(createdAuth0UserId))
                        u.Auth0UserId = createdAuth0UserId;
                    
                    if (!string.IsNullOrWhiteSpace(createdAuth0Picture))
                        u.Picture = createdAuth0Picture;

                    await db.SaveChangesAsync();
                    await tx.CommitAsync();

                    var createdUser = await db.Users
                        .Include(x => x.UserOrganizations).ThenInclude(uo => uo.Organization)
                        .Include(x => x.Profile)
                        .FirstOrDefaultAsync(x => x.Id == u.Id);

                    if (createdUser == null)
                    {
                        return Results.BadRequest(new { message = "Failed to reload created user" });
                    }

                    return Results.Created($"/api/users/{u.Id}", createdUser.ToDetailDto());
                }
                catch (DbUpdateException ex)
                {
                    try
                    {
                        await tx.RollbackAsync();
                    }
                    catch (InvalidOperationException)
                    {
                        // Transaction may already be completed; keep the original error intact.
                    }

                    return EndpointHelpers.HandleDbUpdateException(ex);
                }
                catch (Exception ex)
                {
                    try
                    {
                        await tx.RollbackAsync();
                    }
                    catch (InvalidOperationException)
                    {
                        // Transaction may already be completed; keep the original error intact.
                    }

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
                            catch (Exception cleanupEx)
                            {
                                _ = cleanupEx;
                            }
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
            if (await db.Organizations.AnyAsync(o => o.OwnerUserId == id))
            {
                return Results.Conflict(new { message = "Cannot delete a user who owns an organization." });
            }
            db.Users.Remove(existing);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        return api;
    }
}