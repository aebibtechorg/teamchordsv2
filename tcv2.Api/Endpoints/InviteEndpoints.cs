using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;
using tcv2.Api.Data.Mappers;
using tcv2.Api.Services;

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
            if (req.Query.TryGetValue("email", out var email)) q = q.Where(x => EF.Functions.ILike(x.Email, $"%{email}%"));
            if (req.Query.TryGetValue("invitedBy", out var ib) && Guid.TryParse(ib, out var ibg)) q = q.Where(x => x.InvitedBy == ibg);
            if (req.Query.TryGetValue("token", out var token)) q = q.Where(x => EF.Functions.ILike(x.Token, $"%{token}%"));
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

            return await EndpointHelpers.ApplyPagingAndFilter(q.Select(x => x.ToDto()), req);
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
        {
            var invite = await db.Invites.FindAsync(id);
            return invite is not null ? Results.Ok(invite.ToDto()) : Results.NotFound();
        });

        invites.MapPost("/", async (InviteDto dto, AppDbContext db, IHttpClientFactory httpFactory, IServiceProvider provider, HttpRequest req) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;

            var auth0UserId = req.HttpContext.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            var inviter = await db.Users.FirstOrDefaultAsync(u => u.Auth0UserId == auth0UserId);
            if (inviter == null) return Results.BadRequest(new { message = "Inviter user not found" });

            var i = dto.ToEntity();
            i.Id = Guid.NewGuid();
            i.InvitedBy = inviter.Id;
            i.Token = string.IsNullOrWhiteSpace(dto.Token)
                ? Convert.ToBase64String(Guid.NewGuid().ToByteArray()).TrimEnd('=').Replace('+', '-').Replace('/', '_')
                : dto.Token;
            i.CreatedAt = DateTimeOffset.UtcNow;
            i.ExpiresAt = DateTimeOffset.UtcNow.AddDays(7);
            
            db.Invites.Add(i);
            try
            {
                await db.SaveChangesAsync();

                // Send email after successful creation
                _ = Task.Run(async () =>
                {
                    using var scope = provider.CreateScope();
                    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Invite");
                    var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
                    var scopeDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var invitedByUser = await scopeDb.Users.FindAsync(i.InvitedBy);
                    var team = await scopeDb.Organizations.FindAsync(i.OrganizationId);
                    try
                    {
                        var apiKey = config["ZeptoMail:ApiKey"];
                        var templateKey = config["ZeptoMail:TemplateKey"];
                        var fromEmail = config["ZeptoMail:FromEmailAddress"];
                        var frontendUrl = dto.BaseUrl ?? config["ZeptoMail:BaseUrl"];
                        var fromName = config["ZeptoMail:FromName"] ?? "noreply";

                        if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(templateKey) || string.IsNullOrEmpty(fromEmail) || string.IsNullOrEmpty(frontendUrl))
                        {
                            logger.LogError("Email service not configured. Skipping email.");
                            return;
                        }

                        var httpClient = httpFactory.CreateClient();
                        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Zoho-enczapikey", apiKey);
                        
                        var payload = new
                        {
                            template_key = templateKey,
                            from = new { address = fromEmail, name = fromName },
                            to = new[] { new { email_address = new { address = i.Email } } },
                            merge_info = new
                            {
                                inviter_name = invitedByUser?.Name ?? string.Empty,
                                invite_link = $"{frontendUrl.TrimEnd('/')}/{i.Id}",
                                team_name = team?.Name ?? string.Empty
                            }
                        };

                        var content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");
                        var response = await httpClient.PostAsync("https://api.zeptomail.com/v1.1/email/template", content);

                        if (!response.IsSuccessStatusCode)
                        {
                            var errorContent = await response.Content.ReadAsStringAsync();
                            logger.LogError("Failed to send email: {statusCode} - {errorContent}", response.StatusCode, errorContent);
                        }
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, "Error sending invite email: {message}", ex.Message);
                    }
                });

                return Results.Created($"/api/invites/{i.Id}", i.ToDto());
            }
            catch (DbUpdateException ex)
            {
                return EndpointHelpers.HandleDbUpdateException(ex);
            }
        });

        invites.MapGet("/{id}/accept", async (Guid id, AppDbContext db) =>
        {
            var strategy = db.Database.CreateExecutionStrategy();

            return await strategy.ExecuteAsync(async () =>
            {
                await using var tx = await db.Database.BeginTransactionAsync();

                try
                {
                    var invite = await db.Invites.FindAsync(id);
                    if (invite == null) return Results.NotFound(new { message = "Invite not found" });
                    if (invite.Used) return Results.BadRequest(new { message = "Invite has already been used" });
                    if (DateTimeOffset.UtcNow >= invite.ExpiresAt) return Results.BadRequest(new { message = "Invite has expired" });

                    var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Email!.ToLower() == invite.Email.ToLower());
                    var isExistingUser = existingUser != null;
                    var oldUsed = invite.Used;
                    invite.Used = true;

                    if (isExistingUser)
                    {
                        if (invite.OrganizationId == null) return Results.BadRequest(new { message = "Invite organization is missing" });

                        var organizationId = invite.OrganizationId.Value;
                        var org = await db.Organizations.FindAsync(organizationId);
                        if (org == null) return Results.NotFound("Organization not found");

                        var currentMemberCount = await db.UserOrganizations.CountAsync(uo => uo.OrganizationId == organizationId);
                        var gate = FeatureGate.CheckLimits(org, 0, 0, currentMemberCount + 1, 0);
                        if (gate != null) return gate;

                        if (existingUser == null) return Results.BadRequest(new { message = "User not found" });

                        var userOrg = new UserOrganization
                        {
                            UserId = existingUser.Id,
                            OrganizationId = organizationId,
                            Role = OrgRole.Member,
                            CreatedAt = DateTime.UtcNow
                        };
                        db.UserOrganizations.Add(userOrg);
                    }

                    await db.SaveChangesAsync();
                    await tx.CommitAsync();

                    return Results.Ok(new { isExistingUser, email = invite.Email, organizationId = invite.OrganizationId, used = oldUsed });
                }
                catch (DbUpdateException ex)
                {
                    await tx.RollbackAsync();
                    return EndpointHelpers.HandleDbUpdateException(ex);
                }
            });
        }).AllowAnonymous();

        invites.MapPut("/{id}", async (Guid id, InviteDto dto, AppDbContext db) =>
        {
            var validation = EndpointHelpers.Validate(dto);
            if (validation != null) return validation;
            var existing = await db.Invites.FindAsync(id);
            if (existing == null) return Results.NotFound();
            
            existing.UpdateFromDto(dto);
            
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