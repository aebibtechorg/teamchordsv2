using Microsoft.EntityFrameworkCore;
using tcv2.Api.Data;
using tcv2.Api.Hubs;
using tcv2.Api.Endpoints;
using Scalar.AspNetCore;
using tcv2.Api;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Serilog;
using Serilog.Events;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// Bootstrap logger so startup logs are captured
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateBootstrapLogger();

builder.Host.UseSerilog((context, services, configuration) =>
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

// Configure Auth0 JWT authentication if settings are present
var auth0Domain = builder.Configuration["Auth0:Domain"] ?? builder.Configuration["AUTH0_DOMAIN"]; // e.g. https://my-tenant.auth0.com/
var auth0Audience = builder.Configuration["Auth0:Audience"] ?? builder.Configuration["AUTH0_AUDIENCE"]; // e.g. api://default

Log.Information("Auth0 Domain: {Domain}", auth0Domain);
Log.Information("Auth0 Audience: {Audience}", auth0Audience);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.Authority = $"https://{auth0Domain}/";
    options.Audience = auth0Audience;
});

builder.AddNpgsqlDbContext<AppDbContext>("TeamChords");

// Configure SignalR: use StackExchange.Redis if configured, otherwise default in-memory.
// var redisConn = builder.Configuration.GetConnectionString("Redis"); // e.g. set via environment or config
// if (!string.IsNullOrWhiteSpace(redisConn))
// {
//     builder.Services.AddSignalR().AddStackExchangeRedis(redisConn);
// }
// else
// {
//     builder.Services.AddSignalR();
// }
builder.Services.AddSignalR();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(o => {
        o.AddPreferredSecuritySchemes("Bearer");
    });
}

// if (!app.Environment.IsDevelopment())
// {
//     app.UseForwardedHeaders(new ForwardedHeadersOptions
//     {
//         // Trust headers from all proxies in the internal network
//         ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
//     });
//     app.Use((context, next) =>
//     {
//         var options = new ForwardedHeadersOptions
//         {
//             ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
//         };
        
//         // Use Clear() on the existing read-only collections
//         options.KnownNetworks.Clear();
//         options.KnownProxies.Clear();
        
//         return next();
//     });
// }


app.UseAuthentication();
app.UseAuthorization();

// API endpoint groups
var api = app.MapGroup("/api");

api.RequireAuthorization();

// SignalR hubs
app.MapHub<ChordSheetHub>("/hubs/chordsheets");
app.MapHub<SetListHub>("/hubs/setlists");
app.MapHub<OutputHub>("/hubs/outputs");

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

api.MapGet("/config", () =>
{
    var config = new
    {
        Auth0Domain = app.Configuration["WebAuth0:Domain"],
        Auth0ClientId = app.Configuration["WebAuth0:ClientId"],
        Auth0Audience = app.Configuration["WebAuth0:Audience"]
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
