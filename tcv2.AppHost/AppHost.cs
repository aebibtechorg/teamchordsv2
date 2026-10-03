#pragma warning disable ASPIRETERMINAL001


using Microsoft.Extensions.Configuration;

var builder = DistributedApplication.CreateBuilder(args);

if (builder.Configuration["Destination"] == "test")
{
    var postgres = builder.AddPostgres("tcdb")
        .WithImageTag("17.11")
        .ExcludeFromManifest();

    var db = postgres.AddDatabase("TeamChords", "teamchords");

    builder.AddProject<Projects.tcv2_Api>("api")
        .WithEnvironment(c =>
        {
            c.EnvironmentVariables.Add("Auth0__Domain", builder.Configuration["Auth0:Domain"] ?? Environment.GetEnvironmentVariable("Auth0__Domain") ?? "");
            c.EnvironmentVariables.Add("Auth0__Audience", builder.Configuration["Auth0:Audience"] ?? Environment.GetEnvironmentVariable("Auth0__Audience") ?? "");
            c.EnvironmentVariables.Add("Auth0__ClientId", builder.Configuration["Auth0:ClientId"] ?? Environment.GetEnvironmentVariable("Auth0__ClientId") ?? "");
            c.EnvironmentVariables.Add("Auth0__ClientSecret", builder.Configuration["Auth0:ClientSecret"] ?? Environment.GetEnvironmentVariable("Auth0__ClientSecret") ?? "");
            c.EnvironmentVariables.Add("AdminAuth0__Domain", builder.Configuration["AdminAuth0:Domain"] ?? Environment.GetEnvironmentVariable("AdminAuth0__Domain") ?? "");
            c.EnvironmentVariables.Add("AdminAuth0__Audience", builder.Configuration["AdminAuth0:Audience"] ?? Environment.GetEnvironmentVariable("AdminAuth0__Audience") ?? "");
            c.EnvironmentVariables.Add("AdminAuth0__ClientId", builder.Configuration["AdminAuth0:ClientId"] ?? Environment.GetEnvironmentVariable("AdminAuth0__ClientId") ?? "");
            c.EnvironmentVariables.Add("WebAuth0__Domain", builder.Configuration["WebAuth0:Domain"] ?? Environment.GetEnvironmentVariable("WebAuth0__Domain") ?? "");
            c.EnvironmentVariables.Add("WebAuth0__Audience", builder.Configuration["WebAuth0:Audience"] ?? Environment.GetEnvironmentVariable("WebAuth0__Audience") ?? "");
            c.EnvironmentVariables.Add("WebAuth0__ClientId", builder.Configuration["WebAuth0:ClientId"] ?? Environment.GetEnvironmentVariable("WebAuth0__ClientId") ?? "");
            c.EnvironmentVariables.Add("CustomerApp__BaseUrl", builder.Configuration["CustomerApp:BaseUrl"] ?? Environment.GetEnvironmentVariable("CustomerApp__BaseUrl") ?? "");
            c.EnvironmentVariables.Add("Chatwoot__BaseUrl", builder.Configuration["Chatwoot:BaseUrl"] ?? Environment.GetEnvironmentVariable("Chatwoot__BaseUrl") ?? "");
            c.EnvironmentVariables.Add("Chatwoot__WebsiteToken", builder.Configuration["Chatwoot:WebsiteToken"] ?? Environment.GetEnvironmentVariable("Chatwoot__WebsiteToken") ?? "");
            c.EnvironmentVariables.Add("Chatwoot__Position", builder.Configuration["Chatwoot:Position"] ?? Environment.GetEnvironmentVariable("Chatwoot__Position") ?? "right");
            c.EnvironmentVariables.Add("Chatwoot__HideMessageBubble", builder.Configuration["Chatwoot:HideMessageBubble"] ?? Environment.GetEnvironmentVariable("Chatwoot__HideMessageBubble") ?? "false");
            c.EnvironmentVariables.Add("Chatwoot__Locale", builder.Configuration["Chatwoot:Locale"] ?? Environment.GetEnvironmentVariable("Chatwoot__Locale") ?? "en");
            c.EnvironmentVariables.Add("ZeptoMail__ApiKey", builder.Configuration["ZeptoMail:ApiKey"] ?? Environment.GetEnvironmentVariable("ZeptoMail__ApiKey") ?? "");
            c.EnvironmentVariables.Add("ZeptoMail__TemplateKey", builder.Configuration["ZeptoMail:TemplateKey"] ?? Environment.GetEnvironmentVariable("ZeptoMail__TemplateKey") ?? "");
            c.EnvironmentVariables.Add("ZeptoMail__FromEmailAddress", builder.Configuration["ZeptoMail:FromEmailAddress"] ?? Environment.GetEnvironmentVariable("ZeptoMail__FromEmailAddress") ?? "");
            c.EnvironmentVariables.Add("ZeptoMail__FromName", builder.Configuration["ZeptoMail:FromName"] ?? Environment.GetEnvironmentVariable("ZeptoMail__FromName") ?? "");
            c.EnvironmentVariables.Add("ZeptoMail__BaseUrl", builder.Configuration["ZeptoMail:BaseUrl"] ?? Environment.GetEnvironmentVariable("ZeptoMail__BaseUrl") ?? "");
            c.EnvironmentVariables.Add("Dodo__SecretKey", builder.Configuration["Dodo:SecretKey"] ?? Environment.GetEnvironmentVariable("Dodo__SecretKey") ?? "");
            c.EnvironmentVariables.Add("Dodo__WebhookSecret", builder.Configuration["Dodo:WebhookSecret"] ?? Environment.GetEnvironmentVariable("Dodo__WebhookSecret") ?? "");
            c.EnvironmentVariables.Add("Dodo__BaseUrl", builder.Configuration["Dodo:BaseUrl"] ?? Environment.GetEnvironmentVariable("Dodo__BaseUrl") ?? "");
            c.EnvironmentVariables.Add("RevenueCat__WebhookSecret", builder.Configuration["RevenueCat:WebhookSecret"] ?? Environment.GetEnvironmentVariable("RevenueCat__WebhookSecret") ?? "");
            c.EnvironmentVariables.Add("Auth0__Issuer", builder.Configuration["Auth0:Issuer"] ?? Environment.GetEnvironmentVariable("Auth0__Issuer") ?? "https://teamchords.test/");
            c.EnvironmentVariables.Add("Auth0__SigningKey", builder.Configuration["Auth0:SigningKey"] ?? Environment.GetEnvironmentVariable("Auth0__SigningKey") ?? "teamchords-test-signing-key-teamchords-test-signing-key");
            c.EnvironmentVariables.Add("RateLimiting__Enabled", builder.Configuration["RateLimiting:Enabled"] ?? Environment.GetEnvironmentVariable("RateLimiting__Enabled") ?? "true");
            c.EnvironmentVariables.Add("RateLimiting__QueueLimit", builder.Configuration["RateLimiting:QueueLimit"] ?? Environment.GetEnvironmentVariable("RateLimiting__QueueLimit") ?? "0");
            c.EnvironmentVariables.Add("RateLimiting__Authenticated__PermitLimit", builder.Configuration["RateLimiting:Authenticated:PermitLimit"] ?? Environment.GetEnvironmentVariable("RateLimiting__Authenticated__PermitLimit") ?? "120");
            c.EnvironmentVariables.Add("RateLimiting__Authenticated__WindowSeconds", builder.Configuration["RateLimiting:Authenticated:WindowSeconds"] ?? Environment.GetEnvironmentVariable("RateLimiting__Authenticated__WindowSeconds") ?? "60");
            c.EnvironmentVariables.Add("RateLimiting__Anonymous__PermitLimit", builder.Configuration["RateLimiting:Anonymous:PermitLimit"] ?? Environment.GetEnvironmentVariable("RateLimiting__Anonymous__PermitLimit") ?? "20");
            c.EnvironmentVariables.Add("RateLimiting__Anonymous__WindowSeconds", builder.Configuration["RateLimiting:Anonymous:WindowSeconds"] ?? Environment.GetEnvironmentVariable("RateLimiting__Anonymous__WindowSeconds") ?? "60");
            c.EnvironmentVariables.Add("RateLimiting__Webhook__PermitLimit", builder.Configuration["RateLimiting:Webhook:PermitLimit"] ?? Environment.GetEnvironmentVariable("RateLimiting__Webhook__PermitLimit") ?? "120");
            c.EnvironmentVariables.Add("RateLimiting__Webhook__WindowSeconds", builder.Configuration["RateLimiting:Webhook:WindowSeconds"] ?? Environment.GetEnvironmentVariable("RateLimiting__Webhook__WindowSeconds") ?? "60");
        })
        .WithReference(db)
        .WaitFor(db)
        .WithExternalHttpEndpoints();
}
else
{
    var postgres = builder.AddPostgres("tcdb")
        .WithImageTag("17.11")
        .WithDataVolume("teamchords-pgdata")
        .WithLifetime(ContainerLifetime.Persistent)
        .WithPgAdmin(admin =>
        {
            admin.WithHostPort(5050);
            admin.WithLifetime(ContainerLifetime.Persistent);
        })
        .ExcludeFromManifest();

    var db = postgres.AddDatabase("TeamChords", "teamchords");

    var redis = builder.AddRedis("Redis").ExcludeFromManifest();

    var api = builder.AddProject<Projects.tcv2_Api>("api")
        .WithEnvironment(c => {
            c.EnvironmentVariables.Add("Auth0__Domain", builder.Configuration["Auth0:Domain"] ?? Environment.GetEnvironmentVariable("Auth0__Domain") ?? "");
            c.EnvironmentVariables.Add("Auth0__Audience", builder.Configuration["Auth0:Audience"] ?? Environment.GetEnvironmentVariable("Auth0__Audience") ?? "");
            c.EnvironmentVariables.Add("Auth0__ClientId", builder.Configuration["Auth0:ClientId"] ?? Environment.GetEnvironmentVariable("Auth0__ClientId") ?? "");
            c.EnvironmentVariables.Add("Auth0__ClientSecret", builder.Configuration["Auth0:ClientSecret"] ?? Environment.GetEnvironmentVariable("Auth0__ClientSecret") ?? "");
            c.EnvironmentVariables.Add("AdminAuth0__Domain", builder.Configuration["AdminAuth0:Domain"] ?? Environment.GetEnvironmentVariable("AdminAuth0__Domain") ?? "");
            c.EnvironmentVariables.Add("AdminAuth0__Audience", builder.Configuration["AdminAuth0:Audience"] ?? Environment.GetEnvironmentVariable("AdminAuth0__Audience") ?? "");
            c.EnvironmentVariables.Add("AdminAuth0__ClientId", builder.Configuration["AdminAuth0:ClientId"] ?? Environment.GetEnvironmentVariable("AdminAuth0__ClientId") ?? "");
            c.EnvironmentVariables.Add("WebAuth0__Domain", builder.Configuration["WebAuth0:Domain"] ?? Environment.GetEnvironmentVariable("WebAuth0__Domain") ?? "");
            c.EnvironmentVariables.Add("WebAuth0__Audience", builder.Configuration["WebAuth0:Audience"] ?? Environment.GetEnvironmentVariable("WebAuth0__Audience") ?? "");
            c.EnvironmentVariables.Add("WebAuth0__ClientId", builder.Configuration["WebAuth0:ClientId"] ?? Environment.GetEnvironmentVariable("WebAuth0__ClientId") ?? "");
            c.EnvironmentVariables.Add("CustomerApp__BaseUrl", builder.Configuration["CustomerApp:BaseUrl"] ?? Environment.GetEnvironmentVariable("CustomerApp__BaseUrl") ?? "");
            c.EnvironmentVariables.Add("Chatwoot__BaseUrl", builder.Configuration["Chatwoot:BaseUrl"] ?? Environment.GetEnvironmentVariable("Chatwoot__BaseUrl") ?? "");
            c.EnvironmentVariables.Add("Chatwoot__WebsiteToken", builder.Configuration["Chatwoot:WebsiteToken"] ?? Environment.GetEnvironmentVariable("Chatwoot__WebsiteToken") ?? "");
            c.EnvironmentVariables.Add("Chatwoot__Position", builder.Configuration["Chatwoot:Position"] ?? Environment.GetEnvironmentVariable("Chatwoot__Position") ?? "right");
            c.EnvironmentVariables.Add("Chatwoot__HideMessageBubble", builder.Configuration["Chatwoot:HideMessageBubble"] ?? Environment.GetEnvironmentVariable("Chatwoot__HideMessageBubble") ?? "false");
            c.EnvironmentVariables.Add("Chatwoot__Locale", builder.Configuration["Chatwoot:Locale"] ?? Environment.GetEnvironmentVariable("Chatwoot__Locale") ?? "en");
            c.EnvironmentVariables.Add("ZeptoMail__ApiKey", builder.Configuration["ZeptoMail:ApiKey"] ?? Environment.GetEnvironmentVariable("ZeptoMail__ApiKey") ?? "");
            c.EnvironmentVariables.Add("ZeptoMail__TemplateKey", builder.Configuration["ZeptoMail:TemplateKey"] ?? Environment.GetEnvironmentVariable("ZeptoMail__TemplateKey") ?? "");
            c.EnvironmentVariables.Add("ZeptoMail__FromEmailAddress", builder.Configuration["ZeptoMail:FromEmailAddress"] ?? Environment.GetEnvironmentVariable("ZeptoMail__FromEmailAddress") ?? "");
            c.EnvironmentVariables.Add("ZeptoMail__FromName", builder.Configuration["ZeptoMail:FromName"] ?? Environment.GetEnvironmentVariable("ZeptoMail__FromName") ?? "");
            c.EnvironmentVariables.Add("ZeptoMail__BaseUrl", builder.Configuration["ZeptoMail:BaseUrl"] ?? Environment.GetEnvironmentVariable("ZeptoMail__BaseUrl") ?? "");
            c.EnvironmentVariables.Add("Dodo__SecretKey", builder.Configuration["Dodo:SecretKey"] ?? Environment.GetEnvironmentVariable("Dodo__SecretKey") ?? "");
            c.EnvironmentVariables.Add("Dodo__WebhookSecret", builder.Configuration["Dodo:WebhookSecret"] ?? Environment.GetEnvironmentVariable("Dodo__WebhookSecret") ?? "");
            c.EnvironmentVariables.Add("Dodo__BaseUrl", builder.Configuration["Dodo:BaseUrl"] ?? Environment.GetEnvironmentVariable("Dodo__BaseUrl") ?? "");
            c.EnvironmentVariables.Add("RevenueCat__WebhookSecret", builder.Configuration["RevenueCat:WebhookSecret"] ?? Environment.GetEnvironmentVariable("RevenueCat__WebhookSecret") ?? "");
        })
        .WithReference(db)
        .WaitFor(db)
        .WithReference(redis)
        .WaitFor(redis)
        .WithExternalHttpEndpoints();

    var ngrokAuthToken = builder.AddParameter("NgrokAuthToken", secret: true);
    builder.AddNgrok("dodo-webhook")
        .WithAuthToken(ngrokAuthToken)
        .WithTunnelEndpoint(api, "http");

    var shareWeb = builder.AddViteApp("share-web", "../web", "dev")
        .WithPnpm()
        .WithReference(api)
        .WaitFor(api)
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            endpoint.Port = 5173;
        })
        .ExcludeFromManifest();

    var appFrontend = builder.AddViteApp("webclient", "../frontend", "start")
        .WithTerminal()
        .WithPnpm()
        .WithReference(api)
        .WaitFor(api)
        .WithEnvironment("EXPO_PUBLIC_AUTH0_DOMAIN", builder.Configuration["WebAuth0:Domain"] ?? builder.Configuration["Auth0:Domain"] ?? Environment.GetEnvironmentVariable("WebAuth0__Domain") ?? Environment.GetEnvironmentVariable("Auth0__Domain") ?? "")
        .WithEnvironment("EXPO_PUBLIC_AUTH0_CLIENT_ID", builder.Configuration["WebAuth0:ClientId"] ?? builder.Configuration["Auth0:ClientId"] ?? Environment.GetEnvironmentVariable("WebAuth0__ClientId") ?? Environment.GetEnvironmentVariable("Auth0__ClientId") ?? "")
        .WithEnvironment("EXPO_PUBLIC_AUTH0_AUDIENCE", builder.Configuration["WebAuth0:Audience"] ?? builder.Configuration["Auth0:Audience"] ?? Environment.GetEnvironmentVariable("WebAuth0__Audience") ?? Environment.GetEnvironmentVariable("Auth0__Audience") ?? "")
        .WithEnvironment("EXPO_PUBLIC_API_URL", api.GetEndpoint("http"))
        .WithEnvironment("EXPO_PUBLIC_WEB_URL", shareWeb.GetEndpoint("http"))
        .WithEnvironment("EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE", builder.Configuration["RevenueCat:AppleApiKey"] ?? Environment.GetEnvironmentVariable("RevenueCat__AppleApiKey") ?? "")
        .WithEnvironment("EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE", builder.Configuration["RevenueCat:GoogleApiKey"] ?? Environment.GetEnvironmentVariable("RevenueCat__GoogleApiKey") ?? "")
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            endpoint.Port = 8081;
        })
        .ExcludeFromManifest();

    _ = builder.AddViteApp("adminclient", "../admin")
        .WithReference(api)
        .WaitFor(api)
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            endpoint.Port = 3000;
        })
        .ExcludeFromManifest();

    // Help center (Docusaurus) - local dev served by the Docusaurus dev server
    _ = builder.AddViteApp("helpclient", "../help", "start")
        .WithReference(api)
        .WaitFor(api)
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            // Docusaurus default dev port (use 3001 to avoid colliding with admin dev port 3000)
            endpoint.Port = 3001;
        })
        .ExcludeFromManifest();

    // Blog (Astro) - local dev served by the Astro dev server
    _ = builder.AddViteApp("blogclient", "../blog", "dev")
        .WithEnvironment(c => {
            c.EnvironmentVariables.Add("APP_SITE_URL", builder.Configuration["CustomerApp:BaseUrl"] ?? builder.Configuration["WebApp:BaseUrl"] ?? Environment.GetEnvironmentVariable("APP_SITE_URL") ?? appFrontend.GetEndpoint("http").Url ?? "http://localhost:8081");
            c.EnvironmentVariables.Add("PUBLIC_SITE_URL", builder.Configuration["Blog:SiteUrl"] ?? Environment.GetEnvironmentVariable("PUBLIC_SITE_URL") ?? "http://localhost:4322");
            c.EnvironmentVariables.Add("SANITY_PROJECT_ID", builder.Configuration["Blog:SanityProjectId"] ?? Environment.GetEnvironmentVariable("SANITY_PROJECT_ID") ?? "");
            c.EnvironmentVariables.Add("SANITY_DATASET", builder.Configuration["Blog:SanityDataset"] ?? Environment.GetEnvironmentVariable("SANITY_DATASET") ?? "");
            c.EnvironmentVariables.Add("SANITY_API_TOKEN", builder.Configuration["Blog:SanityApiToken"] ?? Environment.GetEnvironmentVariable("SANITY_API_TOKEN") ?? "");
            c.EnvironmentVariables.Add("SANITY_API_VERSION", builder.Configuration["Blog:SanityApiVersion"] ?? Environment.GetEnvironmentVariable("SANITY_API_VERSION") ?? "2025-05-08");
        })
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            endpoint.Port = 4322;
        })
        .WithExternalHttpEndpoints()
        .ExcludeFromManifest();

    // Sanity Studio - local editorial app for blog authoring
    _ = builder.AddViteApp("blogstudio", "../blog/studio", "dev")
        .WithEnvironment(c => {
            c.EnvironmentVariables.Add("SANITY_STUDIO_PROJECT_ID", builder.Configuration["Blog:SanityProjectId"] ?? Environment.GetEnvironmentVariable("SANITY_PROJECT_ID") ?? "");
            c.EnvironmentVariables.Add("SANITY_STUDIO_DATASET", builder.Configuration["Blog:SanityDataset"] ?? Environment.GetEnvironmentVariable("SANITY_DATASET") ?? "");
            c.EnvironmentVariables.Add("SANITY_STUDIO_API_VERSION", builder.Configuration["Blog:SanityApiVersion"] ?? Environment.GetEnvironmentVariable("SANITY_API_VERSION") ?? "2025-05-08");
        })
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            endpoint.Port = 3002;
        })
        .WithExternalHttpEndpoints()
        .ExcludeFromManifest();
}

builder.Build().Run();
