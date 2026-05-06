using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Options;

internal sealed class RateLimitingOptions
{
    public bool Enabled { get; set; } = true;

    [Range(0, int.MaxValue)]
    public int QueueLimit { get; set; }

    public RateLimitingPolicyOptions Authenticated { get; set; } = new();

    public RateLimitingPolicyOptions Anonymous { get; set; } = new();

    public RateLimitingPolicyOptions Webhook { get; set; } = new();
}

internal sealed class RateLimitingPolicyOptions
{
    [Range(1, int.MaxValue)]
    public int PermitLimit { get; set; } = 20;

    [Range(1, int.MaxValue)]
    public int WindowSeconds { get; set; } = 60;

    public TimeSpan Window => TimeSpan.FromSeconds(WindowSeconds);
}

