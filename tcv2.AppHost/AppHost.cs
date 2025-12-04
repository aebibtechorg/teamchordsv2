var builder = DistributedApplication.CreateBuilder(args);

var db = builder.AddPostgres("tcdb")
    .ExcludeFromManifest()
    .WithDataVolume("teamchords-pgdata")
    .WithPgAdmin()
    .AddDatabase("teamchords");

var redis = builder.AddRedis("Redis");

var api = builder.AddProject<Projects.tcv2_Api>("api", launchProfileName: "http")
    .WithEnvironment(c => {
        c.EnvironmentVariables.Add("Auth0__Domain", builder.Configuration["Auth0:Domain"] ?? Environment.GetEnvironmentVariable("Auth0__Domain"));
        c.EnvironmentVariables.Add("Auth0__Audience", builder.Configuration["Auth0:Audience"] ?? Environment.GetEnvironmentVariable("Auth0__Audience"));
        c.EnvironmentVariables.Add("Auth0__ClientId", builder.Configuration["Auth0:ClientId"] ?? Environment.GetEnvironmentVariable("Auth0__ClientId"));
        c.EnvironmentVariables.Add("Auth0__ClientSecret", builder.Configuration["Auth0:ClientSecret"] ?? Environment.GetEnvironmentVariable("Auth0__ClientSecret"));
    })
    .WithReference(db)
    .WithReference(redis)
    .WaitFor(db)
    .WaitFor(redis);

var webClient = builder.AddJavaScriptApp("webclient", "../web")
    .WithPnpm()
    .WithEnvironment("PORT", "5173")
    .WithEnvironment(c => {
        c.EnvironmentVariables.Add("VITE_API_URL", builder.Configuration["FrontendUrls:Api"] ?? Environment.GetEnvironmentVariable("FrontendUrls__Api"));
        c.EnvironmentVariables.Add("VITE_SIGNALR_URL", builder.Configuration["FrontendUrls:SignalR"] ?? Environment.GetEnvironmentVariable("FrontendUrls__SignalR"));
        c.EnvironmentVariables.Add("VITE_PROXY_API_URL", api.GetEndpoint("http").Url.ToString().TrimEnd('/'));
        c.EnvironmentVariables.Add("VITE_AUTH0_DOMAIN", builder.Configuration["WebAuth0:Domain"] ?? Environment.GetEnvironmentVariable("WebAuth0__Domain"));
        c.EnvironmentVariables.Add("VITE_AUTH0_CLIENT_ID", builder.Configuration["WebAuth0:ClientId"] ?? Environment.GetEnvironmentVariable("WebAuth0__ClientId"));
        c.EnvironmentVariables.Add("VITE_AUTH0_AUDIENCE", builder.Configuration["WebAuth0:Audience"] ?? Environment.GetEnvironmentVariable("WebAuth0__Audience"));
        c.EnvironmentVariables.Add("VITE_SUPABASE_URL", "https://jxvplaejgoacipycczsd.supabase.co");
        c.EnvironmentVariables.Add("VITE_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4dnBsYWVqZ29hY2lweWNjenNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5OTQxODcsImV4cCI6MjA1MzU3MDE4N30.PsOab-iXmivJxdWmZ2SKtTbl8yBkGASoQU9iSpt1xoM");
    })
    .WithReference(api)
    .WaitFor(api)
    .WithHttpEndpoint(port: 5173, env: "PORT", isProxied: false);

builder.Build().Run();
