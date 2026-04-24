using System.Security.Claims;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using tcv2.Api.Data;
using tcv2.Api.Data.Entities;
using tcv2.Api.Services;
using Plan = tcv2.Api.Data.Entities.Plan;

namespace tcv2.Api.Endpoints;

internal static class BillingEndpoints
{
    public static RouteGroupBuilder MapBillingEndpoints(this RouteGroupBuilder api)
    {
        var billing = api.MapGroup("/billing");

        billing.MapPost("/checkout", async (
            [FromBody] CheckoutRequest request,
            HttpContext httpContext,
            AppDbContext db,
            IHttpClientFactory httpClientFactory) =>
        {
            var auth0UserId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (auth0UserId == null)
                return Results.Unauthorized();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Auth0UserId == auth0UserId);
            if (user == null)
                return Results.NotFound("User not found");

            var userOrg = await db.UserOrganizations.FirstOrDefaultAsync(
                uo => uo.UserId == user.Id && uo.OrganizationId == request.OrgId);
            if (userOrg == null)
                return Results.BadRequest("User does not belong to this organization");

            var org = await db.Organizations.FindAsync(request.OrgId);
            if (org == null)
                return Results.NotFound("Organization not found");

            var productId = request.Plan switch
            {
                Plan.GiggingBand => DodoProductIds.GiggingBand,
                Plan.Organization => DodoProductIds.Organization,
                _ => null
            };
            if (productId == null)
                return Results.BadRequest("Invalid plan");

            var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
            var apiKey = config["Dodo:SecretKey"];
            var client = httpClientFactory.CreateClient();
            var baseUrl = config["Dodo:BaseUrl"] ?? "https://test.dodopayments.com";
            client.BaseAddress = new Uri(baseUrl);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            // Dodo Payments POST /checkouts (Checkout Sessions)
            // https://docs.dodopayments.com/api-reference/checkout-sessions/create
            var checkoutRequest = new
            {
                product_cart = new[]
                {
                    new { product_id = productId, quantity = 1 }
                },
                customer = new
                {
                    email = user.Email,
                    name = user.Name ?? user.Email
                },
                return_url = $"{request.redirectUrl?.TrimEnd('/')}?success=true",
                metadata = new Dictionary<string, string>
                {
                    { "organization_id", org.Id.ToString() },
                    { "plan", request.Plan.ToString() }
                },
                subscription_data = request.Plan == Plan.GiggingBand
                    ? (object)new { trial_period_days = 14 }
                    : null
            };

            var response = await client.PostAsJsonAsync("/checkouts", checkoutRequest);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return Results.BadRequest(new { error });
            }

            var result = await response.Content.ReadFromJsonAsync<DodoCheckoutSessionResponse>();
            if (result?.checkout_url == null)
                return Results.BadRequest("Failed to create checkout session");

            return Results.Ok(new { url = result.checkout_url });
        });

        billing.MapPost("/webhook", async (
            HttpContext httpContext,
            AppDbContext db,
            IConfiguration config) =>
        {
            var json = await new StreamReader(httpContext.Request.Body).ReadToEndAsync();
            var secret = config["Dodo:WebhookSecret"] ?? string.Empty;

            // Dodo Payments uses the Standard Webhooks spec:
            // https://www.standardwebhooks.com/
            var webhookId = httpContext.Request.Headers["webhook-id"].ToString();
            var webhookTimestamp = httpContext.Request.Headers["webhook-timestamp"].ToString();
            var webhookSignature = httpContext.Request.Headers["webhook-signature"].ToString();

            if (string.IsNullOrEmpty(secret) || !VerifyStandardWebhookSignature(json, webhookId, webhookTimestamp, webhookSignature, secret))
                return Results.BadRequest("Invalid signature");

            var dodoEvent = System.Text.Json.JsonSerializer.Deserialize<DodoWebhookEvent>(
                json, new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.SnakeCaseLower, PropertyNameCaseInsensitive = true });
            if (dodoEvent?.Type == null)
                return Results.BadRequest("Invalid event");

            // subscription.active  → fires on first activation and after trial ends
            // subscription.renewed → fires on each successful billing renewal
            if (dodoEvent.Type is "subscription.active" or "subscription.renewed")
            {
                var data = dodoEvent.Data;
                var orgIdStr = data.Metadata?.GetValueOrDefault("organization_id");
                var planStr = data.Metadata?.GetValueOrDefault("plan");

                if (Guid.TryParse(orgIdStr, out var orgId) && Enum.TryParse<Plan>(planStr, out var plan))
                {
                    var org = await db.Organizations.FindAsync(orgId);
                    if (org != null)
                    {
                        org.Plan = plan;
                        org.SubscriptionStatus = SubscriptionStatus.Active;
                        org.DodoCustomerId = data.Customer.CustomerId;
                        org.DodoSubscriptionId = data.SubscriptionId;
                        org.PlanExpiresAt = data.ExpiresAt;
                        org.UpdatedAt = DateTime.UtcNow;
                        await db.SaveChangesAsync();
                    }
                }
            }
            else if (dodoEvent.Type is "subscription.cancelled" or "subscription.failed" or "subscription.expired")
            {
                var data = dodoEvent.Data;
                var org = await db.Organizations.FirstOrDefaultAsync(
                    o => o.DodoSubscriptionId == data.SubscriptionId);
                if (org != null)
                {
                    org.Plan = Plan.Free;
                    org.SubscriptionStatus = dodoEvent.Type == "subscription.cancelled"
                        ? SubscriptionStatus.Canceled
                        : SubscriptionStatus.PastDue;
                    // next_billing_date is the last known period end when cancelled
                    org.PlanExpiresAt = data.ExpiresAt ?? data.NextBillingDate;
                    org.UpdatedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync();
                }
            }

            return Results.Ok();
        }).AllowAnonymous();

        billing.MapPost("/cancel", async (
            [FromBody] CancelRequest request,
            HttpContext httpContext,
            AppDbContext db,
            IHttpClientFactory httpClientFactory) =>
        {
            var auth0UserId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (auth0UserId == null)
                return Results.Unauthorized();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Auth0UserId == auth0UserId);
            if (user == null)
                return Results.NotFound("User not found");

            var callerRole = await db.UserOrganizations.Where(uo => uo.OrganizationId == request.OrgId && uo.UserId == user.Id).Select(uo => uo.Role).FirstOrDefaultAsync();
            if (callerRole != OrgRole.Admin)
                return Results.Forbid();

            var org = await db.Organizations.FindAsync(request.OrgId);
            if (org == null)
                return Results.NotFound("Organization not found");

            if (string.IsNullOrWhiteSpace(org.DodoSubscriptionId))
                return Results.BadRequest("No active subscription to cancel");

            var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
            var apiKey = config["Dodo:SecretKey"];
            var client = httpClientFactory.CreateClient();
            var baseUrl = config["Dodo:BaseUrl"] ?? "https://test.dodopayments.com";
            client.BaseAddress = new Uri(baseUrl);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            // Dodo Payments PATCH /subscriptions/{subscription_id} to cancel at next billing date
            var cancelRequest = new
            {
                cancel_at_next_billing_date = true,
                cancel_reason = "cancelled_by_customer"
            };

            var response = await client.PatchAsJsonAsync($"/subscriptions/{org.DodoSubscriptionId}", cancelRequest);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return Results.BadRequest(new { error });
            }

            org.SubscriptionStatus = SubscriptionStatus.Canceled;
            org.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.NoContent();
        });

        return api;
    }

    /// <summary>
    /// Verifies a Standard Webhooks (https://www.standardwebhooks.com/) HMAC-SHA256 signature.
    /// Signed content = "{webhook-id}.{webhook-timestamp}.{body}"
    /// Secret is base64-encoded, optionally prefixed with "whsec_".
    /// Each signature in the header is "v1,{base64}" — multiple separated by spaces.
    /// </summary>
    private static bool VerifyStandardWebhookSignature(
        string payload, string msgId, string msgTimestamp, string signatures, string secret)
    {
        try
        {
            var secretBytes = secret.StartsWith("whsec_")
                ? Convert.FromBase64String(secret["whsec_".Length..])
                : Convert.FromBase64String(secret);

            var signedContent = $"{msgId}.{msgTimestamp}.{payload}";
            using var hmac = new HMACSHA256(secretBytes);
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(signedContent));
            var computedSig = "v1," + Convert.ToBase64String(hash);

            // Header may contain multiple space-separated signatures for key rotation
            return signatures.Split(' ').Any(s => s == computedSig);
        }
        catch
        {
            return false;
        }
    }
}

public record CheckoutRequest(Plan Plan, Guid OrgId, string? redirectUrl);

/// <summary>Dodo Payments POST /checkouts (Checkout Sessions) response</summary>
public record DodoCheckoutSessionResponse(
    string session_id,
    string? checkout_url);      // URL to redirect the customer to

/// <summary>Dodo Payments webhook event envelope</summary>
public class DodoWebhookEvent
{
    public string? Type { get; set; }
    public DodoWebhookData Data { get; set; } = new();
}

/// <summary>Customer object in Dodo webhook data</summary>
public record DodoCustomer(string? CustomerId);

/// <summary>Common fields present in subscription webhook payloads</summary>
public class DodoWebhookData
{
    public string? SubscriptionId { get; set; }
    public DodoCustomer Customer { get; set; } = new(null);
    public string? ProductId { get; set; }
    public string? Status { get; set; }
    public Dictionary<string, string>? Metadata { get; set; }
    public DateTime? NextBillingDate { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public record CancelRequest(Guid OrgId);

