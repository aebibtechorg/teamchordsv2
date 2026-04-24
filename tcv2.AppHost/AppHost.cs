#pragma warning disable ASPIREACADOMAINS001,ASPIREDOCKERFILEBUILDER001

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
var builder = DistributedApplication.CreateBuilder(args);


if (builder.Configuration["Destination"] == "aca")
{
    builder.AddAzureContainerAppEnvironment("aebibtech-teamchords");

    var customDomain = builder.AddParameter("customDomain");
    var certificateName = builder.AddParameter("certificateName");



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
            c.EnvironmentVariables.Add("WebAuth0__Domain", builder.Configuration["WebAuth0:Domain"] ?? Environment.GetEnvironmentVariable("WebAuth0__Domain") ?? "");
            c.EnvironmentVariables.Add("WebAuth0__Audience", builder.Configuration["WebAuth0:Audience"] ?? Environment.GetEnvironmentVariable("WebAuth0__Audience") ?? "");
            c.EnvironmentVariables.Add("WebAuth0__ClientId", builder.Configuration["WebAuth0:ClientId"] ?? Environment.GetEnvironmentVariable("WebAuth0__ClientId") ?? "");
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
    }

    if (builder.ExecutionContext.IsPublishMode)
    {
        api.WithEnvironment("ConnectionStrings__TeamChords", builder.Configuration.GetConnectionString("TeamChords"));
        api.WithEnvironment("ConnectionStrings__Redis", builder.Configuration.GetConnectionString("Redis"));
    }

    var webClient = builder.AddViteApp("webclient", "../web")
        .WithReference(api)
        .WaitFor(api)
        .WithEndpoint(endpointName: "http", endpoint =>
        {
            endpoint.Port = builder.ExecutionContext.IsRunMode ? 5173 : null;
        })
        .ExcludeFromManifest();

    if (builder.ExecutionContext.IsPublishMode)
    {
        builder.AddNpmApp("webclient-server", "../web")
            .WithReference(api)
            .WithHttpEndpoint(targetPort: 80)
            .WithExternalHttpEndpoints()
            .PublishAsDockerFile()
            .PublishAsAzureContainerApp((infra, app) =>
            {
                app.ConfigureCustomDomain(customDomain, certificateName);
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
            c.EnvironmentVariables.Add("WebAuth0__Domain", builder.Configuration["WebAuth0:Domain"] ?? Environment.GetEnvironmentVariable("WebAuth0__Domain") ?? "");
            c.EnvironmentVariables.Add("WebAuth0__Audience", builder.Configuration["WebAuth0:Audience"] ?? Environment.GetEnvironmentVariable("WebAuth0__Audience") ?? "");
            c.EnvironmentVariables.Add("WebAuth0__ClientId", builder.Configuration["WebAuth0:ClientId"] ?? Environment.GetEnvironmentVariable("WebAuth0__ClientId") ?? "");
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
        .PublishAsDockerComposeService((resource, service) =>
        {
            service.Name = "api";
        });
    
    builder.AddNpmApp("webclient-server", "../web")
        .WithReference(api)
        .PublishAsDockerComposeService((resource, service) =>
        {
            service.Name = "frontend";
        });
}

builder.Build().Run();
