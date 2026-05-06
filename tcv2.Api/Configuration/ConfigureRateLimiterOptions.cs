using System.Globalization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;
using tcv2.Api.Options;
using System.Security.Claims;
using System.Threading.RateLimiting;

namespace tcv2.Api.Configuration;

internal sealed class ConfigureRateLimiterOptions : IConfigureOptions<RateLimiterOptions>
{
    private readonly RateLimitingOptions _options;

    public ConfigureRateLimiterOptions(IOptions<RateLimitingOptions> options)
    {
        _options = options.Value;
    }

    public void Configure(RateLimiterOptions options)
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        options.OnRejected = async (context, cancellationToken) =>
        {
            if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            {
                context.HttpContext.Response.Headers.RetryAfter = Math.Ceiling(retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
            }

            context.HttpContext.Response.ContentType = "application/json";
            await context.HttpContext.Response.WriteAsync("{\"message\":\"Too many requests. Please try again later.\"}", cancellationToken);
        };

        options.AddPolicy("Api", httpContext =>
        {
            var path = httpContext.Request.Path.Value ?? string.Empty;
            var isWebhook = path.Equals("/api/billing/webhook", StringComparison.OrdinalIgnoreCase);
            var isAuthenticated = httpContext.User.Identity?.IsAuthenticated == true;
            var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userId = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? httpContext.User.FindFirstValue("sub");

            var partitionKey = isWebhook
                ? $"webhook:{clientIp}"
                : isAuthenticated && !string.IsNullOrWhiteSpace(userId)
                    ? $"user:{userId}"
                    : $"ip:{clientIp}";

            var policy = isWebhook
                ? _options.Webhook
                : isAuthenticated
                    ? _options.Authenticated
                    : _options.Anonymous;

            return RateLimitPartition.GetFixedWindowLimiter(partitionKey, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = policy.PermitLimit,
                Window = policy.Window,
                QueueLimit = _options.QueueLimit,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            });
        });
    }
}

