using System.Net;
using Aspire.Hosting.Testing;
using Xunit;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace tcv2.Tests;

public sealed class RateLimitingAspireTests
{
    [Fact]
    public async Task Anonymous_requests_are_rate_limited_when_limit_is_exceeded()
    {
        using var environment = new TemporaryEnvironmentVariables(new Dictionary<string, string?>
        {
            ["Destination"] = "test",
            ["RateLimiting__Enabled"] = "true",
            ["RateLimiting__QueueLimit"] = "0",
            ["RateLimiting__Anonymous__PermitLimit"] = "2",
            ["RateLimiting__Anonymous__WindowSeconds"] = "60",
            ["RateLimiting__Authenticated__PermitLimit"] = "10",
            ["RateLimiting__Authenticated__WindowSeconds"] = "60",
            ["RateLimiting__Webhook__PermitLimit"] = "10",
            ["RateLimiting__Webhook__WindowSeconds"] = "60",
        });

        var builder = await DistributedApplicationTestingBuilder.CreateAsync<Projects.tcv2_AppHost>();
        await using var app = await builder.BuildAsync();

        await app.StartAsync();

        using var client = app.CreateHttpClient("api");

        var first = await client.GetAsync("/api/config");
        var second = await client.GetAsync("/api/config");
        var third = await client.GetAsync("/api/config");

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, third.StatusCode);
        Assert.True(third.Headers.TryGetValues("Retry-After", out _));

        var payload = await third.Content.ReadAsStringAsync();
        Assert.Contains("Too many requests", payload);
    }

    [Fact]
    public async Task Anonymous_requests_are_not_limited_when_rate_limiting_is_disabled()
    {
        using var environment = new TemporaryEnvironmentVariables(new Dictionary<string, string?>
        {
            ["Destination"] = "test",
            ["RateLimiting__Enabled"] = "false",
            ["RateLimiting__QueueLimit"] = "0",
            ["RateLimiting__Anonymous__PermitLimit"] = "1",
            ["RateLimiting__Anonymous__WindowSeconds"] = "60",
        });

        var builder = await DistributedApplicationTestingBuilder.CreateAsync<Projects.tcv2_AppHost>();
        await using var app = await builder.BuildAsync();

        await app.StartAsync();

        using var client = app.CreateHttpClient("api");

        var first = await client.GetAsync("/api/config");
        var second = await client.GetAsync("/api/config");
        var third = await client.GetAsync("/api/config");

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal(HttpStatusCode.OK, third.StatusCode);
    }

    private sealed class TemporaryEnvironmentVariables : IDisposable
    {
        private readonly Dictionary<string, string?> _originalValues = new(StringComparer.Ordinal);

        public TemporaryEnvironmentVariables(IReadOnlyDictionary<string, string?> values)
        {
            foreach (var pair in values)
            {
                _originalValues[pair.Key] = Environment.GetEnvironmentVariable(pair.Key);
                Environment.SetEnvironmentVariable(pair.Key, pair.Value);
            }
        }

        public void Dispose()
        {
            foreach (var pair in _originalValues)
            {
                Environment.SetEnvironmentVariable(pair.Key, pair.Value);
            }
        }
    }
}


