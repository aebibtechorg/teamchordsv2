using Microsoft.EntityFrameworkCore;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;
using tcv2.Api.Data.Mappers;
using System.Security.Claims;

namespace tcv2.Api.Endpoints;

internal static class AdminEndpoints
{
    private static readonly string[] PlatformAdminClaimValues =
    [
        "platform_admin",
        "platform-admin",
        "platform.admin",
        "admin"
    ];

    private static readonly string[] PlatformAdminClaimTypes =
    [
        ClaimTypes.Role,
        "role",
        "roles",
        "permission",
        "permissions"
    ];

    public static RouteGroupBuilder MapAdminEndpoints(this RouteGroupBuilder api)
    {
        var admin = api.MapGroup("/admin");

        admin.MapGet("/config", (IConfiguration config) =>
        {
            return Results.Ok(new AdminBootstrapDto
            {
                Auth0Domain = config["AdminAuth0:Domain"],
                Auth0ClientId = config["AdminAuth0:ClientId"],
                Auth0Audience = config["AdminAuth0:Audience"],
                Chatwoot = new ChatwootBootstrapDto
                {
                    Enabled = !string.IsNullOrWhiteSpace(config["Chatwoot:BaseUrl"]) && !string.IsNullOrWhiteSpace(config["Chatwoot:WebsiteToken"]),
                    BaseUrl = config["Chatwoot:BaseUrl"],
                    WebsiteToken = config["Chatwoot:WebsiteToken"],
                    Position = config["Chatwoot:Position"] ?? "right",
                    HideMessageBubble = bool.TryParse(config["Chatwoot:HideMessageBubble"], out var hideMessageBubble) && hideMessageBubble,
                    Locale = config["Chatwoot:Locale"] ?? "en"
                }
            });
        }).AllowAnonymous();

        admin.MapGet("/me", async (HttpContext httpContext, AppDbContext db) =>
        {
            if (!HasPlatformAdminAccess(httpContext.User))
                return Results.Forbid();

            var auth0UserId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(auth0UserId))
                return Results.Unauthorized();

            var user = await db.Users
                .Include(x => x.UserOrganizations)
                    .ThenInclude(uo => uo.Organization)
                .Include(x => x.Profile)
                .FirstOrDefaultAsync(x => x.Auth0UserId == auth0UserId);

            if (user == null)
                return Results.NotFound(new { message = "User not found" });

            return Results.Ok(new AdminMeDto
            {
                IsPlatformAdmin = true,
                User = user.ToDetailDto(),
                Claims = httpContext.User.Claims
                    .Select(claim => new AdminClaimDto
                    {
                        Type = claim.Type,
                        Value = claim.Value
                    })
                    .ToList()
            });
        });

        admin.MapGet("/summary", async (HttpContext httpContext, AppDbContext db) =>
        {
            if (!HasPlatformAdminAccess(httpContext.User))
                return Results.Forbid();

            var summary = new AdminSummaryDto
            {
                OrganizationCount = await db.Organizations.CountAsync(),
                PaidOrganizationCount = await db.Organizations.CountAsync(o => o.Plan != Plan.Free),
                ActiveSubscriptionCount = await db.Organizations.CountAsync(o => o.SubscriptionStatus == SubscriptionStatus.Active),
                UserCount = await db.Users.CountAsync(),
                MembershipCount = await db.UserOrganizations.CountAsync(),
                AdminMembershipCount = await db.UserOrganizations.CountAsync(uo => uo.Role == OrgRole.Admin)
            };

            return Results.Ok(summary);
        });

        admin.MapGet("/organizations", async (HttpContext httpContext, HttpRequest req, AppDbContext db) =>
        {
            if (!HasPlatformAdminAccess(httpContext.User))
                return Results.Forbid();

            var q = db.Organizations.AsNoTracking().AsQueryable();

            if (req.Query.TryGetValue("name", out var name) && !string.IsNullOrWhiteSpace(name.ToString()))
                q = q.Where(o => EF.Functions.ILike(o.Name!, $"%{name.ToString()}%"));

            var sortBy = req.Query.TryGetValue("sortBy", out var sb) ? sb.ToString() : "createdAt";
            var sortDir = req.Query.TryGetValue("sortDir", out var sd) ? sd.ToString().ToLowerInvariant() : "desc";
            q = sortBy switch
            {
                "name" => sortDir == "asc" ? q.OrderBy(o => o.Name) : q.OrderByDescending(o => o.Name),
                "plan" => sortDir == "asc" ? q.OrderBy(o => o.Plan) : q.OrderByDescending(o => o.Plan),
                "subscriptionStatus" => sortDir == "asc" ? q.OrderBy(o => o.SubscriptionStatus) : q.OrderByDescending(o => o.SubscriptionStatus),
                _ => sortDir == "asc" ? q.OrderBy(o => o.CreatedAt) : q.OrderByDescending(o => o.CreatedAt),
            };

            var organizations = q.Select(o => new AdminOrganizationListDto
            {
                Id = o.Id,
                OwnerUserId = o.OwnerUserId,
                Name = o.Name,
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt,
                Plan = o.Plan,
                SubscriptionStatus = o.SubscriptionStatus,
                PlanExpiresAt = o.PlanExpiresAt,
                MemberCount = o.UserOrganizations.Count,
                AdminCount = o.UserOrganizations.Count(uo => uo.Role == OrgRole.Admin)
            });

            return await EndpointHelpers.ApplyPagingAndFilter(organizations, req);
        });

        admin.MapGet("/organizations/{id:guid}/members", async (Guid id, HttpContext httpContext, HttpRequest req, AppDbContext db) =>
        {
            if (!HasPlatformAdminAccess(httpContext.User))
                return Results.Forbid();

            var members = db.UserOrganizations
                .AsNoTracking()
                .Where(uo => uo.OrganizationId == id)
                .Include(uo => uo.User)
                .Select(uo => new OrgMemberDto
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

        return api;
    }

    private static bool HasPlatformAdminAccess(ClaimsPrincipal principal)
    {
        if (principal.Identity?.IsAuthenticated != true)
            return false;

        return principal.Claims.Any(claim =>
            PlatformAdminClaimTypes.Contains(claim.Type, StringComparer.OrdinalIgnoreCase) &&
            PlatformAdminClaimValues.Contains(claim.Value, StringComparer.OrdinalIgnoreCase));
    }
}

public sealed class AdminBootstrapDto
{
    public string? Auth0Domain { get; set; }
    public string? Auth0ClientId { get; set; }
    public string? Auth0Audience { get; set; }
    public ChatwootBootstrapDto Chatwoot { get; set; } = new();
}

public sealed class ChatwootBootstrapDto
{
    public bool Enabled { get; set; }
    public string? BaseUrl { get; set; }
    public string? WebsiteToken { get; set; }
    public string? Position { get; set; }
    public bool HideMessageBubble { get; set; }
    public string? Locale { get; set; }
}

public sealed class AdminMeDto
{
    public bool IsPlatformAdmin { get; set; }
    public UserDetailDto User { get; set; } = new();
    public List<AdminClaimDto> Claims { get; set; } = new();
}

public sealed class AdminClaimDto
{
    public string Type { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
}

public sealed class AdminSummaryDto
{
    public int OrganizationCount { get; set; }
    public int PaidOrganizationCount { get; set; }
    public int ActiveSubscriptionCount { get; set; }
    public int UserCount { get; set; }
    public int MembershipCount { get; set; }
    public int AdminMembershipCount { get; set; }
}

public sealed class AdminOrganizationListDto
{
    public Guid Id { get; set; }
    public Guid? OwnerUserId { get; set; }
    public string? Name { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Plan Plan { get; set; }
    public SubscriptionStatus SubscriptionStatus { get; set; }
    public DateTime? PlanExpiresAt { get; set; }
    public int MemberCount { get; set; }
    public int AdminCount { get; set; }
}



