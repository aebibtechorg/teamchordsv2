var builder = DistributedApplication.CreateBuilder(args);

// builder.AddAzureContainerAppEnvironment("env");

var postgres = builder.AddAzurePostgresFlexibleServer("tcdb")
    .RunAsContainer(pg =>
    {
        pg.WithDataVolume("teamchords-pgdata");
        pg.WithPgAdmin(admin =>
        {
            admin.WithHostPort(5050);
        });
    });

var db = postgres.AddDatabase("TeamChords", "teamchords");


var api = builder.AddProject<Projects.tcv2_Api>("api")
    .WithEnvironment(c => {
        c.EnvironmentVariables.Add("Auth0__Domain", builder.Configuration["Auth0:Domain"] ?? Environment.GetEnvironmentVariable("Auth0__Domain"));
        c.EnvironmentVariables.Add("Auth0__Audience", builder.Configuration["Auth0:Audience"] ?? Environment.GetEnvironmentVariable("Auth0__Audience"));
        c.EnvironmentVariables.Add("Auth0__ClientId", builder.Configuration["Auth0:ClientId"] ?? Environment.GetEnvironmentVariable("Auth0__ClientId"));
        c.EnvironmentVariables.Add("Auth0__ClientSecret", builder.Configuration["Auth0:ClientSecret"] ?? Environment.GetEnvironmentVariable("Auth0__ClientSecret"));
    })
    .WithReference(db)
    .WaitFor(db)
    .WithExternalHttpEndpoints();

var webClient = builder.AddViteApp("webclient", "../web")
    .WithEnvironment(c => {
        // c.EnvironmentVariables.Add("VITE_API_URL", builder.Configuration["FrontendUrls:Api"] ?? apiUrl);
        // c.EnvironmentVariables.Add("VITE_SIGNALR_URL", builder.Configuration["FrontendUrls:SignalR"] ?? apiUrl);
        // c.EnvironmentVariables.Add("VITE_PROXY_API_URL", api.GetEndpoint("http").Url.ToString().TrimEnd('/'));
        c.EnvironmentVariables.Add("VITE_AUTH0_DOMAIN", builder.Configuration["WebAuth0:Domain"] ?? Environment.GetEnvironmentVariable("WebAuth0__Domain"));
        c.EnvironmentVariables.Add("VITE_AUTH0_CLIENT_ID", builder.Configuration["WebAuth0:ClientId"] ?? Environment.GetEnvironmentVariable("WebAuth0__ClientId"));
        c.EnvironmentVariables.Add("VITE_AUTH0_AUDIENCE", builder.Configuration["WebAuth0:Audience"] ?? Environment.GetEnvironmentVariable("WebAuth0__Audience"));
    })
    .WithReference(api)
    .WaitFor(api)
    .WithEndpoint(endpointName: "http", endpoint =>
    {
        endpoint.Port = builder.ExecutionContext.IsRunMode ? 5173 : null;
    });

if (builder.ExecutionContext.IsPublishMode)
{
    builder.AddYarp("webclient-server")
        .WithConfiguration(c =>
        {
            c.AddRoute("api/{**catch-all}", api);
            c.AddRoute("hubs/{**catch-all}", api);
        })
        .WithExternalHttpEndpoints()
        .PublishWithStaticFiles(webClient);
}

builder.Build().Run();
