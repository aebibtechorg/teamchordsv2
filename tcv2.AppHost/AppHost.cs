#pragma warning disable ASPIREACADOMAINS001,ASPIREDOCKERFILEBUILDER001

using Microsoft.Extensions.Configuration;
var builder = DistributedApplication.CreateBuilder(args);

string GetSetting(string configurationKey, string environmentVariableName, string fallback = "")
{
    var environmentValue = Environment.GetEnvironmentVariable(environmentVariableName);
    if (!string.IsNullOrWhiteSpace(environmentValue))
    {
        return environmentValue;
    }

    var configurationValue = builder.Configuration[configurationKey];
    if (!string.IsNullOrWhiteSpace(configurationValue))
    {
        return configurationValue;
    }

    return fallback;
}


if (builder.Configuration["Destination"] == "aca")
{
    builder.AddAzureContainerAppEnvironment("aebibtech-teamchords");

    var customDomain = builder.AddParameter("customDomain");
    var certificateName = builder.AddParameter("certificateName");
    var adminCustomDomain = builder.AddParameter("adminCustomDomain");
    var adminCertificateName = builder.AddParameter("adminCertificateName");



    var postgres = builder.AddPostgres("tcdb")
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
        })
        .WithExternalHttpEndpoints();

    if (builder.ExecutionContext.IsRunMode)
    {
        api.WithReference(db).WaitFor(db);
        api.WithReference(redis).WaitFor(redis);

        builder.AddDevTunnel("dodo-webhook")
            .WithReference(api)
            .WithAnonymousAccess();
    }

    if (builder.ExecutionContext.IsPublishMode)
    {
        api.WithEnvironment("ConnectionStrings__TeamChords", builder.Configuration.GetConnectionString("TeamChords"));
        api.WithEnvironment("ConnectionStrings__Redis", builder.Configuration.GetConnectionString("Redis"));
    }

    var appFrontend = builder.AddViteApp("webclient", "../web")
        .WithReference(api)
        .WaitFor(api)
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            endpoint.Port = builder.ExecutionContext.IsRunMode ? 5173 : null;
        })
        .ExcludeFromManifest();

    _ = builder.AddViteApp("adminclient", "../admin")
        .WithReference(api)
        .WaitFor(api)
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            endpoint.Port = builder.ExecutionContext.IsRunMode ? 3000 : null;
        })
        .ExcludeFromManifest();

    // Help center (Docusaurus) - local dev served by the Docusaurus dev server
    _ = builder.AddViteApp("helpclient", "../help", "start")
        .WithReference(api)
        .WaitFor(api)
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            // Docusaurus default dev port (use 3001 to avoid colliding with admin dev port 3000)
            endpoint.Port = builder.ExecutionContext.IsRunMode ? 3001 : null;
        })
        .ExcludeFromManifest();

    // Blog (Astro) - local dev served by the Astro dev server
    _ = builder.AddViteApp("blogclient", "../blog", "dev")
        .WithEnvironment(c => {
            c.EnvironmentVariables.Add("APP_SITE_URL", builder.Configuration["CustomerApp:BaseUrl"] ?? builder.Configuration["WebApp:BaseUrl"] ?? Environment.GetEnvironmentVariable("APP_SITE_URL") ?? appFrontend.GetEndpoint("http").Url ?? "http://localhost:5173");
            c.EnvironmentVariables.Add("BLOG_SITE_URL", builder.Configuration["Blog:SiteUrl"] ?? Environment.GetEnvironmentVariable("BLOG_SITE_URL") ?? "http://localhost:4322");
            c.EnvironmentVariables.Add("SANITY_PROJECT_ID", builder.Configuration["Blog:SanityProjectId"] ?? Environment.GetEnvironmentVariable("SANITY_PROJECT_ID") ?? "");
            c.EnvironmentVariables.Add("SANITY_DATASET", builder.Configuration["Blog:SanityDataset"] ?? Environment.GetEnvironmentVariable("SANITY_DATASET") ?? "");
            c.EnvironmentVariables.Add("SANITY_API_TOKEN", builder.Configuration["Blog:SanityApiToken"] ?? Environment.GetEnvironmentVariable("SANITY_API_TOKEN") ?? "");
            c.EnvironmentVariables.Add("SANITY_API_VERSION", builder.Configuration["Blog:SanityApiVersion"] ?? Environment.GetEnvironmentVariable("SANITY_API_VERSION") ?? "2025-05-08");
        })
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            endpoint.Port = builder.ExecutionContext.IsRunMode ? 4322 : null;
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
            endpoint.Port = builder.ExecutionContext.IsRunMode ? 3002 : null;
        })
        .WithExternalHttpEndpoints()
        .ExcludeFromManifest();

    if (builder.ExecutionContext.IsPublishMode)
    {
        builder.AddNpmApp("webclient-server", "../web")
            .WithReference(api)
            .WithHttpEndpoint(targetPort: 80)
            .WithExternalHttpEndpoints()
            .PublishAsDockerFile()
            .PublishAsAzureContainerApp((_, app) =>
            {
                app.ConfigureCustomDomain(customDomain, certificateName);
            });

        builder.AddNpmApp("adminclient-server", "../admin")
            .WithReference(api)
            .WithHttpEndpoint(targetPort: 80)
            .WithExternalHttpEndpoints()
            .PublishAsDockerFile()
            .PublishAsAzureContainerApp((_, app) =>
            {
                app.ConfigureCustomDomain(adminCustomDomain, adminCertificateName);
            });
    }
}

if (builder.Configuration["Destination"] == "compose")
{
    builder.AddDockerComposeEnvironment("tcv2-teamchords");
    var postgres = builder.AddPostgres("tcdb")
        .WithDataVolume("teamchords-pgdata")
        .WithPgAdmin(admin =>
        {
            admin.WithHostPort(5050); 
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
        })
        .WaitFor(db)
        .WaitFor(redis)
        .PublishAsDockerComposeService((_, service) =>
        {
            service.Name = "api";
        });
    
    builder.AddNpmApp("webclient-server", "../web")
        .WithReference(api)
        .PublishAsDockerComposeService((_, service) =>
        {
            service.Name = "frontend";
        });

    builder.AddNpmApp("adminclient-server", "../admin")
        .WithReference(api)
        .PublishAsDockerComposeService((_, service) =>
        {
            service.Name = "admin";
        });

    builder.AddNpmApp("blogclient-server", "../blog")
        .WithEnvironment(c => {
            c.EnvironmentVariables.Add("APP_SITE_URL", GetSetting("CustomerApp:BaseUrl", "APP_SITE_URL", "http://localhost:5173"));
            c.EnvironmentVariables.Add("BLOG_SITE_URL", GetSetting("Blog:SiteUrl", "BLOG_SITE_URL", "http://localhost:4322"));
            c.EnvironmentVariables.Add("SANITY_PROJECT_ID", GetSetting("Blog:SanityProjectId", "SANITY_PROJECT_ID"));
            c.EnvironmentVariables.Add("SANITY_DATASET", GetSetting("Blog:SanityDataset", "SANITY_DATASET"));
            c.EnvironmentVariables.Add("SANITY_API_TOKEN", GetSetting("Blog:SanityApiToken", "SANITY_API_TOKEN"));
            c.EnvironmentVariables.Add("SANITY_API_VERSION", GetSetting("Blog:SanityApiVersion", "SANITY_API_VERSION", "2025-05-08"));
        })
        .PublishAsDockerComposeService((_, service) =>
        {
            service.Name = "blog";
        });
}

if (builder.Configuration["Destination"] == "test")
{
    var postgres = builder.AddPostgres("tcdb")
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

builder.Build().Run();
