using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using tcv2.Api.Data;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;
using tcv2.Api.Hubs;
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
            DodoProductCatalogService catalog,
            IHttpClientFactory httpClientFactory) =>
        {
            var auth0UserId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (auth0UserId == null)
                return Results.Unauthorized();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Auth0UserId == auth0UserId);
            if (user == null)
                return Results.NotFound("User not found");

            var org = await db.Organizations.FindAsync(request.OrgId);
            if (org == null)
                return Results.NotFound("Organization not found");

            var userOrg = await db.UserOrganizations.FirstOrDefaultAsync(
                uo => uo.UserId == user.Id && uo.OrganizationId == request.OrgId);
            if (userOrg == null && org.OwnerUserId != user.Id)
                return Results.BadRequest("User does not belong to this organization");

            if (userOrg != null && userOrg.Role != OrgRole.Admin && org.OwnerUserId != user.Id)
                return Results.Forbid();

            if (request.Plan == Plan.Free)
                return Results.BadRequest(new { error = "Use the cancel endpoint to downgrade to the free plan." });

            if (org.Plan != Plan.Free)
                return Results.BadRequest(new { error = "Use /api/billing/change-plan to modify an existing paid subscription." });

            var productId = await catalog.GetProductIdForPlanAsync(request.Plan, httpContext.RequestAborted);

            var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
            var client = CreateDodoClient(config, httpClientFactory);

            // Dodo Payments POST /checkouts (Checkout Sessions)
            // https://docs.dodopayments.com/api-reference/checkout-sessions/create
            var checkoutRequest = new
            {
                product_cart = new[]
                {
                    new { product_id = productId, quantity = 1 }
                },
                customer = (object)(org.DodoCustomerId != null
                    ? new { customer_id = org.DodoCustomerId, email = user.Email, name = user.Name ?? user.Email }
                    : new { email = user.Email, name = user.Name ?? user.Email }),
                return_url = $"{request.RedirectUrl?.TrimEnd('/')}?success=true",
                metadata = new Dictionary<string, string>
                {
                    { "organization_id", org.Id.ToString() },
                    { "plan", request.Plan.ToString() }
                },
                // subscription_data = request.Plan == Plan.GiggingBand
                //     ? (object)new { trial_period_days = 14 }
                //     : null,
                customization = new
                {
                    theme = "light"
                }
            };

            var response = await client.PostAsJsonAsync("/checkouts", checkoutRequest);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return Results.BadRequest(new { error });
            }

            var result = await response.Content.ReadFromJsonAsync<DodoCheckoutSessionResponse>();
            if (result?.CheckoutUrl == null)
                return Results.BadRequest("Failed to create checkout session");

            return Results.Ok(new { url = result.CheckoutUrl });
        });

        billing.MapPost("/change-plan", async (
            [FromBody] ChangePlanRequest request,
            HttpContext httpContext,
            AppDbContext db,
            DodoProductCatalogService catalog,
            IHttpClientFactory httpClientFactory,
            IHubContext<BillingHub, IBillingClient> billingHub) =>
        {
            var auth0UserId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (auth0UserId == null)
                return Results.Unauthorized();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Auth0UserId == auth0UserId);
            if (user == null)
                return Results.NotFound("User not found");

            var org = await db.Organizations.FindAsync(request.OrgId);
            if (org == null)
                return Results.NotFound("Organization not found");

            var userOrg = await db.UserOrganizations.FirstOrDefaultAsync(
                uo => uo.UserId == user.Id && uo.OrganizationId == request.OrgId);
            if (userOrg == null && org.OwnerUserId != user.Id)
                return Results.BadRequest("User does not belong to this organization");

            if (userOrg != null && userOrg.Role != OrgRole.Admin && org.OwnerUserId != user.Id)
                return Results.Forbid();

            if (request.Plan == Plan.Free)
                return Results.BadRequest(new { error = "Use the cancel endpoint to downgrade to the free plan." });

            if (org.Plan == Plan.Free)
                return Results.BadRequest(new { error = "Use checkout to create the first paid subscription for this organization." });

            if (request.Plan == org.Plan)
                return Results.BadRequest(new { error = "Organization is already on the requested plan." });

            if (string.IsNullOrWhiteSpace(org.DodoSubscriptionId))
                return Results.BadRequest(new { error = "No active subscription found for this organization." });

            var productId = await catalog.GetProductIdForPlanAsync(request.Plan, httpContext.RequestAborted);
            var isUpgrade = request.Plan > org.Plan;
            var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
            var client = CreateDodoClient(config, httpClientFactory);
            var resumedScheduledCancellation = false;

            if (isUpgrade && org.SubscriptionStatus == SubscriptionStatus.ScheduledToEnd)
            {
                var resumed = await ResumeScheduledCancellationAsync(client, db, billingHub, org, httpContext.RequestAborted);
                if (!resumed)
                    return Results.BadRequest(new { error = "Failed to resume the scheduled cancellation before upgrading." });

                resumedScheduledCancellation = true;
            }

            // Dodo Payments POST /subscriptions/{subscription_id}/change-plan
            // https://docs.dodopayments.com/api-reference/subscriptions/change-plan
            var prorationMode = isUpgrade ? "prorated_immediately" : "difference_immediately";

            var changePlanRequest = new
            {
                product_id = productId,
                proration_billing_mode = prorationMode,
                quantity = 1,
                // effective_at = isUpgrade ? "immediately" : "next_billing_date",
                on_payment_failure = "prevent_change",
                metadata = new Dictionary<string, string>
                {
                    { "organization_id", org.Id.ToString() },
                    { "plan", request.Plan.ToString() }
                }
            };

            var response = await client.PostAsJsonAsync($"/subscriptions/{org.DodoSubscriptionId}/change-plan", changePlanRequest);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();

                if (isUpgrade && !resumedScheduledCancellation && IsScheduledCancellationError(error))
                {
                    var resumed = await ResumeScheduledCancellationAsync(client, db, billingHub, org, httpContext.RequestAborted);
                    if (resumed)
                    {
                        resumedScheduledCancellation = true;
                        response = await client.PostAsJsonAsync($"/subscriptions/{org.DodoSubscriptionId}/change-plan", changePlanRequest);
                        if (response.IsSuccessStatusCode)
                        {
                            return Results.Ok(new
                            {
                                plan = request.Plan.ToString(),
                                effectiveAt = "immediately",
                                resumedScheduledCancellation,
                                message = $"Your plan change to {request.Plan} was submitted and your scheduled cancellation was removed."
                            });
                        }

                        error = await response.Content.ReadAsStringAsync();
                    }
                }

                return Results.BadRequest(new { error = ExtractDodoErrorMessage(error) });
            }

            return Results.Ok(new
            {
                plan = request.Plan.ToString(),
                effectiveAt = isUpgrade ? "immediately" : "next_billing_date",
                resumedScheduledCancellation,
                message = isUpgrade
                    ? resumedScheduledCancellation
                        ? $"Your plan change to {request.Plan} was submitted and your scheduled cancellation was removed."
                        : $"Your plan change to {request.Plan} was submitted."
                    : $"Your downgrade to {request.Plan} was submitted and will settle the prorated difference immediately."
            });
        });

        billing.MapPost("/change-plan/preview", async (
            [FromBody] ChangePlanRequest request,
            HttpContext httpContext,
            AppDbContext db,
            DodoProductCatalogService catalog,
            IHttpClientFactory httpClientFactory) =>
        {
            var auth0UserId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (auth0UserId == null)
                return Results.Unauthorized();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Auth0UserId == auth0UserId);
            if (user == null)
                return Results.NotFound("User not found");

            var org = await db.Organizations.FindAsync(request.OrgId);
            if (org == null)
                return Results.NotFound("Organization not found");

            var userOrg = await db.UserOrganizations.FirstOrDefaultAsync(
                uo => uo.UserId == user.Id && uo.OrganizationId == request.OrgId);
            if (userOrg == null && org.OwnerUserId != user.Id)
                return Results.BadRequest("User does not belong to this organization");

            if (userOrg != null && userOrg.Role != OrgRole.Admin && org.OwnerUserId != user.Id)
                return Results.Forbid();

            if (request.Plan == Plan.Free)
                return Results.BadRequest(new { error = "Use the cancel endpoint to downgrade to the free plan." });

            if (org.Plan == Plan.Free)
                return Results.BadRequest(new { error = "Use checkout to create the first paid subscription for this organization." });

            if (request.Plan == org.Plan)
                return Results.BadRequest(new { error = "Organization is already on the requested plan." });

            if (string.IsNullOrWhiteSpace(org.DodoSubscriptionId))
                return Results.BadRequest(new { error = "No active subscription found for this organization." });

            var productId = await catalog.GetProductIdForPlanAsync(request.Plan, httpContext.RequestAborted);
            var isUpgrade = request.Plan > org.Plan;
            var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
            var client = CreateDodoClient(config, httpClientFactory);

            var previewRequest = new
            {
                product_id = productId,
                proration_billing_mode = isUpgrade ? "prorated_immediately" : "difference_immediately",
                quantity = 1,
                // effective_at = isUpgrade ? "immediately" : "next_billing_date",
                on_payment_failure = "prevent_change",
                metadata = new Dictionary<string, string>
                {
                    { "organization_id", org.Id.ToString() },
                    { "plan", request.Plan.ToString() }
                }
            };

            var response = await client.PostAsJsonAsync($"/subscriptions/{org.DodoSubscriptionId}/change-plan/preview", previewRequest);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                if (isUpgrade && IsScheduledCancellationError(error))
                {
                    return Results.Ok(new
                    {
                        currentPlan = org.Plan.ToString(),
                        targetPlan = request.Plan.ToString(),
                        isUpgrade,
                        requiresResumeConfirmation = true,
                        scheduledCancellationEndsAt = org.PlanExpiresAt,
                        message = "Your subscription is scheduled to end. Upgrading will resume it and remove the scheduled cancellation."
                    });
                }

                return Results.BadRequest(new { error = ExtractDodoErrorMessage(error) });
            }

            var result = await response.Content.ReadFromJsonAsync<DodoPlanChangePreviewResponse>();
            if (result?.ImmediateCharge?.Summary == null)
                return Results.BadRequest("Failed to create plan preview");

            return Results.Ok(new
            {
                currentPlan = org.Plan.ToString(),
                targetPlan = request.Plan.ToString(),
                isUpgrade,
                effectiveAt = result.ImmediateCharge.EffectiveAt,
                immediateCharge = new
                {
                    totalAmount = result.ImmediateCharge.Summary.TotalAmount,
                    currency = result.ImmediateCharge.Summary.Currency,
                    settlementAmount = result.ImmediateCharge.Summary.SettlementAmount,
                    settlementCurrency = result.ImmediateCharge.Summary.SettlementCurrency,
                    customerCredits = result.ImmediateCharge.Summary.CustomerCredits
                },
                newPlan = new
                {
                    subscriptionId = result.NewPlan.SubscriptionId,
                    productId = result.NewPlan.ProductId,
                    quantity = result.NewPlan.Quantity,
                    status = result.NewPlan.Status,
                    nextBillingDate = result.NewPlan.NextBillingDate,
                    previousBillingDate = result.NewPlan.PreviousBillingDate,
                    cancelAtNextBillingDate = result.NewPlan.CancelAtNextBillingDate,
                    scheduledChange = result.NewPlan.ScheduledChange is null
                        ? null
                        : new
                        {
                            id = result.NewPlan.ScheduledChange.Id,
                            productId = result.NewPlan.ScheduledChange.ProductId,
                            quantity = result.NewPlan.ScheduledChange.Quantity,
                            effectiveAt = result.NewPlan.ScheduledChange.EffectiveAt,
                            createdAt = result.NewPlan.ScheduledChange.CreatedAt
                        }
                },
                message = isUpgrade
                    ? $"Your upgrade to {request.Plan} would charge now and apply immediately."
                    : $"Your downgrade to {request.Plan} would settle the prorated difference immediately."
            });
        });

        billing.MapPost("/webhook", async (
            HttpContext httpContext,
            AppDbContext db,
            IConfiguration config,
            DodoProductCatalogService catalog,
            IHubContext<BillingHub, IBillingClient> billingHub) =>
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
            // subscription.plan_changed / subscription.updated → fires when a plan change takes effect
            if (dodoEvent.Type is "subscription.active" or "subscription.renewed" or "subscription.plan_changed" or "subscription.updated")
            {
                var data = dodoEvent.Data;
                var orgIdStr = data.Metadata?.GetValueOrDefault("organization_id");
                var plan = (data.ProductId is not null
                        ? await catalog.GetPlanForProductIdAsync(data.ProductId, httpContext.RequestAborted)
                        : null)
                    ?? TryParsePlan(GetMetadataValue(data.Metadata, "plan"));

                Organization? org = null;
                if (Guid.TryParse(orgIdStr, out var orgId))
                {
                    org = await db.Organizations.FindAsync(orgId);
                }

                if (org == null && !string.IsNullOrWhiteSpace(data.SubscriptionId))
                {
                    org = await db.Organizations.FirstOrDefaultAsync(o => o.DodoSubscriptionId == data.SubscriptionId);
                }

                if (org != null && plan.HasValue)
                {
                    org.Plan = plan.Value;
                    org.SubscriptionStatus = data.CancelAtNextBillingDate == true
                        ? SubscriptionStatus.ScheduledToEnd
                        : SubscriptionStatus.Active;

                    if (!string.IsNullOrWhiteSpace(data.Customer.CustomerId))
                    {
                        org.DodoCustomerId = data.Customer.CustomerId;
                    }

                    if (!string.IsNullOrWhiteSpace(data.SubscriptionId))
                        org.DodoSubscriptionId = data.SubscriptionId;

                    org.PlanExpiresAt = data.NextBillingDate;
                    org.UpdatedAt = DateTime.UtcNow;
                    await db.SaveChangesAsync();
                    await NotifyBillingUpdatedAsync(billingHub, org, dodoEvent.Type);
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
                    await NotifyBillingUpdatedAsync(billingHub, org, dodoEvent.Type);
                }
            }

            return Results.Ok();
        }).AllowAnonymous();

        billing.MapPost("/portal", async (
            [FromBody] PortalRequest request,
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

            var callerMembership = await db.UserOrganizations.FirstOrDefaultAsync(uo => uo.OrganizationId == request.OrgId && uo.UserId == user.Id);

            var org = await db.Organizations.FindAsync(request.OrgId);
            if (org == null)
                return Results.NotFound("Organization not found");

            if (callerMembership == null && org.OwnerUserId != user.Id)
                return Results.Forbid();

            if (callerMembership != null && callerMembership.Role != OrgRole.Admin && org.OwnerUserId != user.Id)
                return Results.Forbid();

            if (string.IsNullOrWhiteSpace(org.DodoCustomerId))
                return Results.BadRequest("No billing customer found");

            var config = httpContext.RequestServices.GetRequiredService<IConfiguration>();
            var apiKey = config["Dodo:SecretKey"];
            var client = httpClientFactory.CreateClient();
            var baseUrl = config["Dodo:BaseUrl"] ?? "https://test.dodopayments.com";
            client.BaseAddress = new Uri(baseUrl);
            client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");

            // Dodo Payments POST /customers/{customer_id}/customer-portal/session
            // https://docs.dodopayments.com/api-reference/customers/customer-portal-create
            var portalUrl = $"/customers/{org.DodoCustomerId}/customer-portal/session?send_email=false";
            if (!string.IsNullOrEmpty(request.ReturnUrl))
            {
                portalUrl += $"&return_url={Uri.EscapeDataString(request.ReturnUrl)}";
            }

            var response = await client.PostAsync(portalUrl, null);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                return Results.BadRequest(new { error });
            }

            var result = await response.Content.ReadFromJsonAsync<DodoCustomerPortalResponse>();
            if (result?.Link == null)
                return Results.BadRequest("Failed to create customer portal session");

            return Results.Ok(new { url = result.Link });
        });

        billing.MapPost("/cancel", async (
            [FromBody] CancelRequest request,
            HttpContext httpContext,
            AppDbContext db,
            IHttpClientFactory httpClientFactory,
            IHubContext<BillingHub, IBillingClient> billingHub) =>
        {
            var auth0UserId = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (auth0UserId == null)
                return Results.Unauthorized();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Auth0UserId == auth0UserId);
            if (user == null)
                return Results.NotFound("User not found");

            var callerMembership = await db.UserOrganizations.FirstOrDefaultAsync(uo => uo.OrganizationId == request.OrgId && uo.UserId == user.Id);

            var org = await db.Organizations.FindAsync(request.OrgId);
            if (org == null)
                return Results.NotFound("Organization not found");

            if (callerMembership == null && org.OwnerUserId != user.Id)
                return Results.Forbid();

            if (callerMembership != null && callerMembership.Role != OrgRole.Admin && org.OwnerUserId != user.Id)
                return Results.Forbid();

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
                return Results.BadRequest(new { error = ExtractDodoErrorMessage(error) });
            }

            var result = await response.Content.ReadFromJsonAsync<DodoSubscriptionResponse>();

            org.SubscriptionStatus = SubscriptionStatus.ScheduledToEnd;
            if (result?.NextBillingDate is not null)
                org.PlanExpiresAt = result.NextBillingDate;
            org.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            await NotifyBillingUpdatedAsync(billingHub, org, "subscription.updated");

            return Results.NoContent();
        });

        return api;
    }

    private static Plan? TryParsePlan(string? value)
    {
        return !string.IsNullOrWhiteSpace(value) && Enum.TryParse<Plan>(value, true, out var plan)
            ? plan
            : null;
    }

    private static string? GetMetadataValue(Dictionary<string, string>? metadata, string key)
    {
        return metadata is not null && metadata.TryGetValue(key, out var value)
            ? value
            : null;
    }

    private static bool IsScheduledCancellationError(string errorBody)
    {
        return TryGetDodoErrorCode(errorBody, out var code)
            && code == "PLAN_CHANGE_NOT_ALLOWED_FOR_SCHEDULED_CANCELLATION";
    }

    private static string ExtractDodoErrorMessage(string errorBody)
    {
        if (string.IsNullOrWhiteSpace(errorBody))
            return "An unexpected billing error occurred.";

        try
        {
            using var document = System.Text.Json.JsonDocument.Parse(errorBody);
            if (document.RootElement.TryGetProperty("message", out var message) && message.ValueKind == System.Text.Json.JsonValueKind.String)
                return message.GetString() ?? errorBody;

            if (document.RootElement.TryGetProperty("error", out var error) && error.ValueKind == System.Text.Json.JsonValueKind.String)
                return error.GetString() ?? errorBody;
        }
        catch
        {
        }

        return errorBody;
    }

    private static bool TryGetDodoErrorCode(string errorBody, out string? code)
    {
        code = null;

        try
        {
            using var document = System.Text.Json.JsonDocument.Parse(errorBody);
            if (document.RootElement.TryGetProperty("code", out var codeElement) && codeElement.ValueKind == System.Text.Json.JsonValueKind.String)
            {
                code = codeElement.GetString();
                return !string.IsNullOrWhiteSpace(code);
            }
        }
        catch
        {
        }

        return false;
    }

    private static async Task<bool> ResumeScheduledCancellationAsync(
        HttpClient client,
        AppDbContext db,
        IHubContext<BillingHub, IBillingClient> billingHub,
        Organization org,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(org.DodoSubscriptionId))
            return false;

        var response = await client.PatchAsJsonAsync($"/subscriptions/{org.DodoSubscriptionId}", new
        {
            cancel_at_next_billing_date = false
        }, cancellationToken);

        if (!response.IsSuccessStatusCode)
            return false;

        var result = await response.Content.ReadFromJsonAsync<DodoSubscriptionResponse>(cancellationToken: cancellationToken);

        org.SubscriptionStatus = SubscriptionStatus.Active;
        if (result?.NextBillingDate is not null)
            org.PlanExpiresAt = result.NextBillingDate;
        if (!string.IsNullOrWhiteSpace(result?.SubscriptionId))
            org.DodoSubscriptionId = result.SubscriptionId;

        org.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        await NotifyBillingUpdatedAsync(billingHub, org, "subscription.updated");
        return true;
    }

    private static Task NotifyBillingUpdatedAsync(
        IHubContext<BillingHub, IBillingClient> billingHub,
        Organization org,
        string eventType)
    {
        return billingHub.Clients
            .Group(HubGroupNames.Organization(org.Id))
            .BillingUpdated(new BillingPlanChangedNotificationDto(
                org.Id,
                eventType,
                org.Plan.ToString(),
                org.SubscriptionStatus.ToString(),
                org.PlanExpiresAt,
                org.UpdatedAt ?? DateTime.UtcNow,
                org.DodoSubscriptionId));
    }

    private static HttpClient CreateDodoClient(IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        var apiKey = config["Dodo:SecretKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Missing Dodo:SecretKey configuration.");

        var client = httpClientFactory.CreateClient();
        var baseUrl = config["Dodo:BaseUrl"] ?? "https://test.dodopayments.com";
        client.BaseAddress = new Uri(baseUrl);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
        return client;
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

public record CheckoutRequest(Plan Plan, Guid OrgId, string? RedirectUrl);

public record ChangePlanRequest(Plan Plan, Guid OrgId);

public record DodoPlanChangePreviewResponse(
    [property: System.Text.Json.Serialization.JsonPropertyName("immediate_charge")] DodoImmediateCharge ImmediateCharge,
    [property: System.Text.Json.Serialization.JsonPropertyName("new_plan")] DodoSubscriptionResponse NewPlan);

public record DodoImmediateCharge(
    [property: System.Text.Json.Serialization.JsonPropertyName("effective_at")] DateTime EffectiveAt,
    [property: System.Text.Json.Serialization.JsonPropertyName("summary")] DodoLineItemSummary Summary);

public record DodoLineItemSummary(
    [property: System.Text.Json.Serialization.JsonPropertyName("total_amount")] int TotalAmount,
    [property: System.Text.Json.Serialization.JsonPropertyName("currency")] string Currency,
    [property: System.Text.Json.Serialization.JsonPropertyName("settlement_amount")] int SettlementAmount,
    [property: System.Text.Json.Serialization.JsonPropertyName("settlement_currency")] string SettlementCurrency,
    [property: System.Text.Json.Serialization.JsonPropertyName("customer_credits")] long CustomerCredits);

public record DodoScheduledPlanChangeResponse(
    [property: System.Text.Json.Serialization.JsonPropertyName("id")] string Id,
    [property: System.Text.Json.Serialization.JsonPropertyName("product_id")] string ProductId,
    [property: System.Text.Json.Serialization.JsonPropertyName("quantity")] int Quantity,
    [property: System.Text.Json.Serialization.JsonPropertyName("effective_at")] DateTime EffectiveAt,
    [property: System.Text.Json.Serialization.JsonPropertyName("created_at")] DateTime CreatedAt);

public record DodoSubscriptionResponse(
    [property: System.Text.Json.Serialization.JsonPropertyName("subscription_id")] string SubscriptionId,
    [property: System.Text.Json.Serialization.JsonPropertyName("product_id")] string ProductId,
    [property: System.Text.Json.Serialization.JsonPropertyName("quantity")] int Quantity,
    [property: System.Text.Json.Serialization.JsonPropertyName("status")] string Status,
    [property: System.Text.Json.Serialization.JsonPropertyName("next_billing_date")] DateTime? NextBillingDate,
    [property: System.Text.Json.Serialization.JsonPropertyName("previous_billing_date")] DateTime? PreviousBillingDate,
    [property: System.Text.Json.Serialization.JsonPropertyName("cancel_at_next_billing_date")] bool CancelAtNextBillingDate,
    [property: System.Text.Json.Serialization.JsonPropertyName("scheduled_change")] DodoScheduledPlanChangeResponse? ScheduledChange);

/// <summary>Dodo Payments POST /checkouts (Checkout Sessions) response</summary>
public record DodoCheckoutSessionResponse(
    [property: System.Text.Json.Serialization.JsonPropertyName("session_id")] string SessionId,
    [property: System.Text.Json.Serialization.JsonPropertyName("checkout_url")] string? CheckoutUrl);      // URL to redirect the customer to

/// <summary>Dodo Payments webhook event envelope</summary>
public class DodoWebhookEvent
{
    public string? Type { get; init; }
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
    public bool? CancelAtNextBillingDate { get; set; }
    public Dictionary<string, string>? Metadata { get; set; }
    public DateTime? NextBillingDate { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public record CancelRequest(Guid OrgId);

/// <summary>Dodo Payments POST /customers/{customer_id}/portal response</summary>
public record DodoCustomerPortalResponse(
    [property: System.Text.Json.Serialization.JsonPropertyName("link")] string Link);    // URL to redirect the customer to the portal

public record PortalRequest(Guid OrgId, string? ReturnUrl);
