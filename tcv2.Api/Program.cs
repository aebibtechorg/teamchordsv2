using Microsoft.EntityFrameworkCore;
using tcv2.Api.Data;
using tcv2.Api.Hubs;
using tcv2.Api.Endpoints;
using tcv2.Api.Services;
using Scalar.AspNetCore;
using tcv2.Api;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Serilog.Events;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using tcv2.Api.Configuration;
using tcv2.Api.Options;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Bootstrap logger so startup logs are captured
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

builder.Host.UseSerilog((context, _, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console();
});

builder.AddServiceDefaults();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi(o => {
    o.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

builder.Services.AddCors(options =>
{
    var allowedOrigins = new[]
    {
        builder.Configuration["WebApp:BaseUrl"],
        builder.Configuration["CustomerApp:BaseUrl"],
    }
    .Select(origin =>
        Uri.TryCreate(origin, UriKind.Absolute, out var uri)
            ? uri.GetLeftPart(UriPartial.Authority)
            : null)
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin!)
    .Distinct(StringComparer.OrdinalIgnoreCase)
    .ToArray();

    options.AddPolicy("FrontendCors", policy =>
    {
        if (allowedOrigins.Length == 0)
        {
            policy.AllowAnyHeader().AllowAnyMethod();
            return;
        }

        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Configure Auth0 JWT authentication if settings are present.
// When a signing key is supplied we switch to a deterministic local JWT setup for tests.
var auth0Domain = builder.Configuration["Auth0:Domain"] ?? builder.Configuration["AUTH0_DOMAIN"]; // e.g. https://my-tenant.auth0.com/
var auth0Audience = builder.Configuration["Auth0:Audience"] ?? builder.Configuration["AUTH0_AUDIENCE"]; // e.g. api://default
var auth0Issuer = builder.Configuration["Auth0:Issuer"] ?? builder.Configuration["AUTH0_ISSUER"] ?? "https://teamchords.test/";
var auth0SigningKey = builder.Configuration["Auth0:SigningKey"] ?? builder.Configuration["AUTH0_SIGNING_KEY"];

Log.Information("Auth0 Domain: {Domain}", auth0Domain);
Log.Information("Auth0 Audience: {Audience}", auth0Audience);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        NameClaimType = ClaimTypes.NameIdentifier,
        RoleClaimType = "https://teamchordsapp.io/roles",
        ValidateIssuer = false,
        ValidateAudience = false
    };

    if (!string.IsNullOrWhiteSpace(auth0SigningKey))
    {
        options.RequireHttpsMetadata = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = "https://teamchordsapp.io/roles",
            ValidateIssuer = true,
            ValidIssuer = auth0Issuer,
            ValidateAudience = true,
            ValidAudience = auth0Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(auth0SigningKey))
        };
    }
    else
    {
        options.Authority = $"https://{auth0Domain}/";
        options.Audience = auth0Audience;
    }
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminAccess", policy => policy.RequireRole("platform-admin", "support"));
    options.AddPolicy("PlatformAdmin", policy => policy.RequireRole("platform-admin"));
});

builder.Services.AddOptions<RateLimitingOptions>()
    .BindConfiguration("RateLimiting")
    .Validate(options =>
        options.QueueLimit >= 0
        && options.Authenticated.PermitLimit > 0
        && options.Authenticated.WindowSeconds > 0
        && options.Anonymous.PermitLimit > 0
        && options.Anonymous.WindowSeconds > 0
        && options.Webhook.PermitLimit > 0
        && options.Webhook.WindowSeconds > 0,
        "RateLimiting settings must use positive limits and windows.")
    .ValidateOnStart();

builder.Services.AddRateLimiter(_ => { });
builder.Services.AddSingleton<IConfigureOptions<RateLimiterOptions>, ConfigureRateLimiterOptions>();

builder.AddNpgsqlDbContext<AppDbContext>("TeamChords");

// Configure SignalR: prefer Azure SignalR in production, fall back to Redis, then in-memory.
var azureSignalRConn = builder.Configuration.GetConnectionString("AzureSignalR");
var redisConn = builder.Configuration.GetConnectionString("Redis"); // e.g. set via environment or config
if (!string.IsNullOrWhiteSpace(azureSignalRConn))
{
    Log.Information("Using Azure SignalR Service for SignalR backplane");
    builder.Services.AddSignalR().AddAzureSignalR(azureSignalRConn);
}
else if (!string.IsNullOrWhiteSpace(redisConn))
{
    Log.Information("Using Redis for SignalR backplane");
    builder.Services.AddSignalR().AddStackExchangeRedis(redisConn);
}
else
{
    Log.Information("Using in-memory SignalR backplane");
    builder.Services.AddSignalR();
}

builder.Services.AddHttpClient();
builder.Services.AddSingleton<DodoProductCatalogService>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});

var app = builder.Build();

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

app.UseCors("FrontendCors");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(o => {
        o.AddPreferredSecuritySchemes("Bearer");
    });
}

app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

// API endpoint groups
var api = app.MapGroup("/api");

api.RequireAuthorization();

if (app.Services.GetRequiredService<IOptions<RateLimitingOptions>>().Value.Enabled)
{
    api.RequireRateLimiting("Api");
}

// SignalR hubs
// app.MapHub<ChordSheetHub>("/hubs/chordsheets");
app.MapHub<BillingHub>("/hubs/billing");
app.MapHub<SetListHub>("/hubs/setlists");
// app.MapHub<OutputHub>("/hubs/outputs");

// ChordSheets CRUD
// Use modular endpoint mappings
api.MapChordSheetEndpoints();

// Invites CRUD (moved to Endpoints/InviteEndpoints.cs)
api.MapInviteEndpoints();

// Organizations CRUD (moved to Endpoints/OrganizationEndpoints.cs)
api.MapOrganizationEndpoints();

// Outputs CRUD (moved to Endpoints/OutputEndpoints.cs)
api.MapOutputEndpoints();

// Profiles CRUD (moved to Endpoints/ProfileEndpoints.cs)
api.MapProfileEndpoints();

// SetLists CRUD (moved to Endpoints/SetListEndpoints.cs)
api.MapSetListEndpoints();

// Users CRUD (moved to Endpoints/UserEndpoints.cs)
api.MapUserEndpoints();

// Billing endpoints
api.MapBillingEndpoints();

// Platform admin endpoints
api.MapAdminEndpoints();

api.MapGet("/config", () =>
{
    var config = new
    {
        Auth0Domain = app.Configuration["WebAuth0:Domain"],
        Auth0ClientId = app.Configuration["WebAuth0:ClientId"],
        Auth0Audience = app.Configuration["WebAuth0:Audience"],
        Chatwoot = new
        {
            Enabled = !string.IsNullOrWhiteSpace(app.Configuration["Chatwoot:BaseUrl"]) && !string.IsNullOrWhiteSpace(app.Configuration["Chatwoot:WebsiteToken"]),
            BaseUrl = app.Configuration["Chatwoot:BaseUrl"],
            WebsiteToken = app.Configuration["Chatwoot:WebsiteToken"],
            Position = app.Configuration["Chatwoot:Position"] ?? "right",
            HideMessageBubble = bool.TryParse(app.Configuration["Chatwoot:HideMessageBubble"], out var hideMessageBubble) && hideMessageBubble,
            Locale = app.Configuration["Chatwoot:Locale"] ?? "en"
        }
    };
   return Results.Ok(config);
}).AllowAnonymous();

api.MapGet("/migrate", async (AppDbContext db) => {
    try
    {
        await db.Database.MigrateAsync();
        return Results.Ok(new { message = "database migrated." });
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "database migration failed.");
        return Results.BadRequest(new { message = "database migration failed." });
    }
}).AllowAnonymous();

try
{
    Log.Information("Starting web host");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
