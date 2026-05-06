using Microsoft.EntityFrameworkCore;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;
using tcv2.Api.Data.Mappers;
using System.Globalization;
using System.Security.Claims;

namespace tcv2.Api.Endpoints;

internal static class AdminEndpoints
{
    private static readonly string[] AdminRoleClaimTypes =
    [
        ClaimTypes.Role,
        "role",
        "roles",
        "https://teamchordsapp.io/roles"
    ];

    public static RouteGroupBuilder MapAdminEndpoints(this RouteGroupBuilder api)
    {
        var admin = api.MapGroup("/admin").RequireAuthorization("AdminAccess");

        admin.MapGet("/config", (IConfiguration config) =>
        {
            return Results.Ok(new AdminBootstrapDto
            {
                Auth0Domain = config["AdminAuth0:Domain"],
                Auth0ClientId = config["AdminAuth0:ClientId"],
                Auth0Audience = config["AdminAuth0:Audience"],
                CustomerAppUrl = config["CustomerApp:BaseUrl"] ?? config["WebApp:BaseUrl"],
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
            var auth0UserId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? httpContext.User.FindFirst("sub")?.Value;
            if (string.IsNullOrWhiteSpace(auth0UserId))
                return Results.Unauthorized();

            var roles = GetRoles(httpContext.User);

            var user = await db.Users
                .Include(x => x.UserOrganizations)
                    .ThenInclude(uo => uo.Organization)
                .Include(x => x.Profile)
                .FirstOrDefaultAsync(x => x.Auth0UserId == auth0UserId);

            return Results.Ok(new AdminMeDto
            {
                IsPlatformAdmin = roles.Contains("platform-admin", StringComparer.OrdinalIgnoreCase),
                IsSupport = roles.Contains("support", StringComparer.OrdinalIgnoreCase),
                Roles = roles,
                User = user?.ToDetailDto(),
                Claims = httpContext.User.Claims
                    .Select(claim => new AdminClaimDto
                    {
                        Type = claim.Type,
                        Value = claim.Value
                    })
                    .ToList()
            });
        });

        admin.MapGet("/summary", async (AppDbContext db) =>
        {
            var summary = new AdminSummaryDto
            {
                OrganizationCount = await db.Organizations.CountAsync(),
                PaidOrganizationCount = await db.Organizations.CountAsync(o => o.Plan != Plan.Free),
                ActiveSubscriptionCount = await db.Organizations.CountAsync(o => o.SubscriptionStatus == SubscriptionStatus.Active || o.SubscriptionStatus == SubscriptionStatus.ScheduledToEnd),
                UserCount = await db.Users.CountAsync(),
                MembershipCount = await db.UserOrganizations.CountAsync(),
                AdminMembershipCount = await db.UserOrganizations.CountAsync(uo => uo.Role == OrgRole.Admin)
            };

            return Results.Ok(summary);
        });

        admin.MapGet("/analytics", async (AppDbContext db) =>
        {
            var now = DateTime.UtcNow;
            var buckets = BuildMonthlyBuckets(now, 6);
            var rangeStart = buckets.First().Start;
            var rangeEnd = buckets.Last().End;

            var organizationCreatedAt = await db.Organizations
                .AsNoTracking()
                .Where(o => o.CreatedAt >= rangeStart && o.CreatedAt < rangeEnd)
                .Select(o => o.CreatedAt)
                .ToListAsync();

            var userCreatedAt = await db.Users
                .AsNoTracking()
                .Where(u => u.CreatedAt.HasValue && u.CreatedAt.Value >= rangeStart && u.CreatedAt.Value < rangeEnd)
                .Select(u => u.CreatedAt!.Value)
                .ToListAsync();

            var membershipCreatedAt = await db.UserOrganizations
                .AsNoTracking()
                .Where(uo => uo.CreatedAt >= rangeStart && uo.CreatedAt < rangeEnd)
                .Select(uo => uo.CreatedAt)
                .ToListAsync();

            var planTotals = await db.Organizations
                .AsNoTracking()
                .GroupBy(o => o.Plan)
                .Select(group => new { Plan = group.Key, Count = group.Count() })
                .ToListAsync();

            var subscriptionTotals = await db.Organizations
                .AsNoTracking()
                .GroupBy(o => o.SubscriptionStatus)
                .Select(group => new { Status = group.Key, Count = group.Count() })
                .ToListAsync();

            var planTotalCount = planTotals.Sum(item => item.Count);
            var subscriptionTotalCount = subscriptionTotals.Sum(item => item.Count);

            return Results.Ok(new AdminAnalyticsDto
            {
                GeneratedAt = now,
                OrganizationGrowth = BuildTrendPoints(organizationCreatedAt, buckets),
                UserGrowth = BuildTrendPoints(userCreatedAt, buckets),
                MembershipGrowth = BuildTrendPoints(membershipCreatedAt, buckets),
                PlanBreakdown = Enum.GetValues<Plan>()
                    .Select(plan => BuildBreakdownItem(plan.ToString(), planTotals.FirstOrDefault(item => item.Plan == plan)?.Count ?? 0, planTotalCount))
                    .ToList(),
                SubscriptionBreakdown = Enum.GetValues<SubscriptionStatus>()
                    .Select(status => BuildBreakdownItem(status.ToString(), subscriptionTotals.FirstOrDefault(item => item.Status == status)?.Count ?? 0, subscriptionTotalCount))
                    .ToList()
            });
        });

        admin.MapGet("/organizations", async (HttpRequest req, AppDbContext db) =>
        {
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

        admin.MapGet("/organizations/{id:guid}/members", async (Guid id, HttpRequest req, AppDbContext db) =>
        {
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

    private static List<string> GetRoles(ClaimsPrincipal principal)
    {
        return principal.Claims
            .Where(claim => AdminRoleClaimTypes.Contains(claim.Type, StringComparer.OrdinalIgnoreCase))
            .Select(claim => claim.Value)
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static List<AdminTrendPointDto> BuildTrendPoints(IReadOnlyCollection<DateTime> values, IReadOnlyList<AdminAnalyticsBucketDto> buckets)
    {
        return buckets
            .Select(bucket => new AdminTrendPointDto
            {
                Label = bucket.Label,
                Value = values.Count(value => value >= bucket.Start && value < bucket.End)
            })
            .ToList();
    }

    private static AdminBreakdownDto BuildBreakdownItem(string label, int count, int total)
    {
        return new AdminBreakdownDto
        {
            Label = label,
            Value = count,
            Percentage = total == 0 ? 0 : Math.Round(count * 100d / total, 1)
        };
    }

    private static List<AdminAnalyticsBucketDto> BuildMonthlyBuckets(DateTime now, int bucketCount)
    {
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        return Enumerable.Range(0, bucketCount)
            .Select(index =>
            {
                var start = monthStart.AddMonths(-(bucketCount - 1 - index));
                return new AdminAnalyticsBucketDto
                {
                    Start = start,
                    End = start.AddMonths(1),
                    Label = start.ToString("yyyy-MM", CultureInfo.InvariantCulture)
                };
            })
            .ToList();
    }
}

public sealed class AdminBootstrapDto
{
    public string? Auth0Domain { get; set; }
    public string? Auth0ClientId { get; set; }
    public string? Auth0Audience { get; set; }
    public string? CustomerAppUrl { get; set; }
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
    public bool IsSupport { get; set; }
    public List<string> Roles { get; set; } = new();
    public UserDetailDto? User { get; set; }
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

public sealed class AdminAnalyticsDto
{
    public DateTime GeneratedAt { get; set; }
    public List<AdminTrendPointDto> OrganizationGrowth { get; set; } = new();
    public List<AdminTrendPointDto> UserGrowth { get; set; } = new();
    public List<AdminTrendPointDto> MembershipGrowth { get; set; } = new();
    public List<AdminBreakdownDto> PlanBreakdown { get; set; } = new();
    public List<AdminBreakdownDto> SubscriptionBreakdown { get; set; } = new();
}

public sealed class AdminTrendPointDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
}

public sealed class AdminBreakdownDto
{
    public string Label { get; set; } = string.Empty;
    public int Value { get; set; }
    public double Percentage { get; set; }
}

public sealed class AdminAnalyticsBucketDto
{
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
    public string Label { get; set; } = string.Empty;
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


