using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Aspire.Hosting;
using Aspire.Hosting.Testing;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace tcv2.Tests;

public sealed class ApiIntegrationTests
{
    private const string TestIssuer = "https://teamchords.test/";
    private const string TestAudience = "api://teamchords.test";
    private const string TestSigningKey = "teamchords-test-signing-key-teamchords-test-signing-key";

    [Fact]
    public async Task Anonymous_config_endpoints_return_bootstrap_payloads()
    {
        await using var session = await ApiTestSession.StartAsync();

        var config = await ReadJsonAsync(await session.Client.GetAsync("/api/config"));
        Assert.True(config.RootElement.TryGetProperty("auth0Domain", out _));
        Assert.True(config.RootElement.TryGetProperty("chatwoot", out var chatwoot));
        Assert.Equal("right", chatwoot.GetProperty("position").GetString());

        var adminConfig = await ReadJsonAsync(await session.Client.GetAsync("/api/admin/config"));
        Assert.True(adminConfig.RootElement.TryGetProperty("auth0Domain", out _));
        Assert.True(adminConfig.RootElement.TryGetProperty("chatwoot", out var adminChatwoot));
        Assert.Equal("en", adminChatwoot.GetProperty("locale").GetString());
    }

    [Fact]
    public async Task Anonymous_google_signin_creates_a_user()
    {
        await using var session = await ApiTestSession.StartAsync();

        var sub = $"google-{Guid.NewGuid():N}";
        var email = $"{sub}@example.com";

        var response = await session.Client.PostAsJsonAsync("/api/users/googlesignin", new GoogleSignInRequest
        {
            Email = email,
            EmailVerified = true,
            Auth0UserId = sub,
            GivenName = "Casey",
            FamilyName = "Tester",
            Picture = "https://example.com/avatar.png"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var payload = await ReadJsonAsync(response);
        Assert.Equal(email, payload.RootElement.GetProperty("email").GetString());
        Assert.Equal(sub, payload.RootElement.GetProperty("auth0UserId").GetString());
    }

    [Fact]
    public async Task Authenticated_user_can_create_an_organization_and_receive_onboarding_content()
    {
        await using var session = await ApiTestSession.StartAsync();

        var sub = $"user-{Guid.NewGuid():N}";
        var email = $"{sub}@example.com";
        await SeedUserAsync(session.Client, sub, email, "Avery", "Member");

        session.Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(sub));

        var orgName = $"Org-{Guid.NewGuid():N}";
        var createResponse = await session.Client.PostAsJsonAsync("/api/organizations", new OrganizationCreateRequest(orgName));

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var createdOrg = await ReadJsonAsync(createResponse);
        var orgId = createdOrg.RootElement.GetProperty("id").GetGuid();
        Assert.Equal(orgName, createdOrg.RootElement.GetProperty("name").GetString());

        var orgResponse = await session.Client.GetAsync($"/api/organizations/{orgId}");
        Assert.Equal(HttpStatusCode.OK, orgResponse.StatusCode);

        var members = await ReadJsonAsync(await session.Client.GetAsync($"/api/organizations/{orgId}/members"));
        Assert.Equal(1, members.RootElement.GetProperty("items").GetArrayLength());
        Assert.Equal(email, members.RootElement.GetProperty("items")[0].GetProperty("email").GetString());
        Assert.Equal("Admin", members.RootElement.GetProperty("items")[0].GetProperty("role").GetString());

        var setLists = await ReadJsonAsync(await session.Client.GetAsync($"/api/setlists?orgId={orgId}"));
        Assert.Equal(1, setLists.RootElement.GetProperty("items").GetArrayLength());
        var setListId = setLists.RootElement.GetProperty("items")[0].GetProperty("id").GetGuid();
        Assert.Equal("Starter Set List", setLists.RootElement.GetProperty("items")[0].GetProperty("name").GetString());

        var chordSheets = await ReadJsonAsync(await session.Client.GetAsync($"/api/chordsheets?orgId={orgId}"));
        Assert.Equal(1, chordSheets.RootElement.GetProperty("items").GetArrayLength());
        Assert.Equal("Welcome to Team Chords", chordSheets.RootElement.GetProperty("items")[0].GetProperty("title").GetString());

        var outputs = await ReadJsonAsync(await session.Client.GetAsync($"/api/outputs?setListId={setListId}"));
        Assert.Equal(1, outputs.RootElement.GetProperty("items").GetArrayLength());
        Assert.Equal("G", outputs.RootElement.GetProperty("items")[0].GetProperty("targetKey").GetString());
    }

    [Fact]
    public async Task Platform_admin_can_access_admin_endpoints_and_see_its_claims()
    {
        await using var session = await ApiTestSession.StartAsync();

        var sub = $"admin-{Guid.NewGuid():N}";
        var email = $"{sub}@example.com";
        await SeedUserAsync(session.Client, sub, email, "Taylor", "Admin");

        session.Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", CreateToken(sub, "platform-admin"));

        var orgName = $"AdminOrg-{Guid.NewGuid():N}";
        var createOrg = await session.Client.PostAsJsonAsync("/api/organizations", new OrganizationCreateRequest(orgName));
        Assert.Equal(HttpStatusCode.Created, createOrg.StatusCode);
        var orgId = (await ReadJsonAsync(createOrg)).RootElement.GetProperty("id").GetGuid();

        var me = await ReadJsonAsync(await session.Client.GetAsync("/api/admin/me"));
        Assert.True(me.RootElement.GetProperty("isPlatformAdmin").GetBoolean());
        Assert.False(me.RootElement.GetProperty("isSupport").GetBoolean());
        Assert.Equal(email, me.RootElement.GetProperty("user").GetProperty("email").GetString());
        Assert.Contains(
            me.RootElement.GetProperty("roles").EnumerateArray().Select(role => role.GetString()),
            role => role == "platform-admin");

        var summary = await ReadJsonAsync(await session.Client.GetAsync("/api/admin/summary"));
        Assert.True(summary.RootElement.GetProperty("organizationCount").GetInt32() > 0);
        Assert.True(summary.RootElement.GetProperty("userCount").GetInt32() > 0);
        Assert.True(summary.RootElement.GetProperty("membershipCount").GetInt32() > 0);
        Assert.True(summary.RootElement.GetProperty("adminMembershipCount").GetInt32() > 0);

        var organizations = await ReadJsonAsync(await session.Client.GetAsync($"/api/admin/organizations?name={Uri.EscapeDataString(orgName)}"));
        Assert.Equal(1, organizations.RootElement.GetProperty("items").GetArrayLength());
        Assert.Equal(orgName, organizations.RootElement.GetProperty("items")[0].GetProperty("name").GetString());
        Assert.Equal(1, organizations.RootElement.GetProperty("items")[0].GetProperty("memberCount").GetInt32());
        Assert.Equal(1, organizations.RootElement.GetProperty("items")[0].GetProperty("adminCount").GetInt32());

        var members = await ReadJsonAsync(await session.Client.GetAsync($"/api/admin/organizations/{orgId}/members"));
        Assert.Equal(1, members.RootElement.GetProperty("items").GetArrayLength());
        Assert.Equal(email, members.RootElement.GetProperty("items")[0].GetProperty("email").GetString());
        Assert.Equal("Admin", members.RootElement.GetProperty("items")[0].GetProperty("role").GetString());
    }

    private static async Task SeedUserAsync(HttpClient client, string sub, string email, string givenName, string familyName)
    {
        var response = await client.PostAsJsonAsync("/api/users/googlesignin", new GoogleSignInRequest
        {
            Email = email,
            EmailVerified = true,
            Auth0UserId = sub,
            GivenName = givenName,
            FamilyName = familyName,
            Picture = "https://example.com/avatar.png"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private static string CreateToken(string subject, params string[] roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, subject),
            new("sub", subject),
            new(ClaimTypes.Email, $"{subject}@example.com")
        };

        claims.AddRange(roles.Select(role => new Claim("https://teamchordsapp.io/roles", role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(TestSigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: TestIssuer,
            audience: TestAudience,
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-1),
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(content);
    }

    private sealed record GoogleSignInRequest
    {
        public string? Email { get; init; }
        public bool? EmailVerified { get; init; }
        public string? Auth0UserId { get; init; }
        public string? GivenName { get; init; }
        public string? FamilyName { get; init; }
        public string? Picture { get; init; }
    }

    private sealed record OrganizationCreateRequest(string? Name);

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

    private sealed class ApiTestSession : IAsyncDisposable
    {
        private readonly TemporaryEnvironmentVariables _environment;
        private readonly DistributedApplication _app;

        private ApiTestSession(TemporaryEnvironmentVariables environment, DistributedApplication app)
        {
            _environment = environment;
            _app = app;
            Client = app.CreateHttpClient("api");
        }

        public HttpClient Client { get; }

        public static async Task<ApiTestSession> StartAsync()
        {
            var environment = new TemporaryEnvironmentVariables(new Dictionary<string, string?>
            {
                ["Destination"] = "test",
                ["Auth0__Issuer"] = TestIssuer,
                ["Auth0__Audience"] = TestAudience,
                ["Auth0__SigningKey"] = TestSigningKey
            });

            var builder = await DistributedApplicationTestingBuilder.CreateAsync<Projects.tcv2_AppHost>();
            var app = await builder.BuildAsync();
            await app.StartAsync();

            using (var migrateResponse = await app.CreateHttpClient("api").GetAsync("/api/migrate"))
            {
                migrateResponse.EnsureSuccessStatusCode();
            }

            return new ApiTestSession(environment, app);
        }

        public async ValueTask DisposeAsync()
        {
            Client.Dispose();
            await _app.DisposeAsync();
            _environment.Dispose();
        }
    }
}




