using System.Collections.Concurrent;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using tcv2.Api.Data.Entities;
using Plan = tcv2.Api.Data.Entities.Plan;

namespace tcv2.Api.Services;

internal sealed class DodoProductCatalogService
{
    private const string DefaultBaseUrl = "https://test.dodopayments.com";
    private const int PageSize = 100;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
    };

    private static readonly IReadOnlyDictionary<Plan, DodoPlanDefinition> Definitions = new Dictionary<Plan, DodoPlanDefinition>
    {
        [Plan.GiggingBand] = new DodoPlanDefinition(
            Plan.GiggingBand,
            "Gigging Band",
            500,
            "USD",
            "saas"),
        [Plan.Organization] = new DodoPlanDefinition(
            Plan.Organization,
            "Pro Library",
            4900,
            "USD",
            "saas")
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DodoProductCatalogService> _logger;
    private readonly ConcurrentDictionary<Plan, SemaphoreSlim> _planLocks = new();
    private readonly ConcurrentDictionary<Plan, string> _planToProductId = new();
    private readonly ConcurrentDictionary<string, Plan> _productIdToPlan = new(StringComparer.OrdinalIgnoreCase);
    private readonly SemaphoreSlim _catalogRefreshLock = new(1, 1);
    private bool _catalogLoaded;

    public DodoProductCatalogService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<DodoProductCatalogService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GetProductIdForPlanAsync(Plan plan, CancellationToken cancellationToken = default)
    {
        if (_planToProductId.TryGetValue(plan, out var cachedProductId))
            return cachedProductId;

        var gate = _planLocks.GetOrAdd(plan, _ => new SemaphoreSlim(1, 1));
        await gate.WaitAsync(cancellationToken);
        try
        {
            if (_planToProductId.TryGetValue(plan, out cachedProductId))
                return cachedProductId;

            await EnsureCatalogLoadedAsync(cancellationToken);

            if (_planToProductId.TryGetValue(plan, out cachedProductId))
                return cachedProductId;

            var definition = GetDefinition(plan);
            var product = await FindProductForDefinitionAsync(definition, cancellationToken);
            if (product is not null)
            {
                product = await EnsureStableMetadataAsync(product, definition, cancellationToken);
                CacheProduct(product, definition.Plan);
                return product.ProductId;
            }

            try
            {
                var created = await CreateProductAsync(definition, cancellationToken);
                CacheProduct(created, definition.Plan);
                return created.ProductId;
            }
            catch
            {
                await RefreshCatalogAsync(cancellationToken);
                product = await FindProductForDefinitionAsync(definition, cancellationToken);
                if (product is not null)
                {
                    product = await EnsureStableMetadataAsync(product, definition, cancellationToken);
                    CacheProduct(product, definition.Plan);
                    return product.ProductId;
                }

                throw;
            }
        }
        finally
        {
            gate.Release();
        }
    }

    public async Task<Plan?> GetPlanForProductIdAsync(string productId, CancellationToken cancellationToken = default)
    {
        if (_productIdToPlan.TryGetValue(productId, out var cachedPlan))
            return cachedPlan;

        var product = await RetrieveProductAsync(productId, cancellationToken);
        if (product is null)
            return null;

        if (TryResolvePlanFromProduct(product, out var resolvedPlan))
        {
            CacheProduct(product, resolvedPlan);
            return resolvedPlan;
        }

        return null;
    }

    private static DodoPlanDefinition GetDefinition(Plan plan)
    {
        if (!Definitions.TryGetValue(plan, out var definition))
            throw new InvalidOperationException($"No Dodo product definition exists for plan '{plan}'.");

        return definition;
    }

    private async Task EnsureCatalogLoadedAsync(CancellationToken cancellationToken)
    {
        if (_catalogLoaded)
            return;

        await _catalogRefreshLock.WaitAsync(cancellationToken);
        try
        {
            if (_catalogLoaded)
                return;

            await RefreshCatalogAsync(cancellationToken);
            _catalogLoaded = true;
        }
        finally
        {
            _catalogRefreshLock.Release();
        }
    }

    private async Task RefreshCatalogAsync(CancellationToken cancellationToken)
    {
        _planToProductId.Clear();
        _productIdToPlan.Clear();

        await foreach (var product in ListAllProductsAsync(cancellationToken))
        {
            if (TryResolvePlanFromProduct(product, out var plan))
                CacheProduct(product, plan);
        }
    }

    private async IAsyncEnumerable<DodoProductDto> ListAllProductsAsync([EnumeratorCancellation] CancellationToken cancellationToken)
    {
        var pageNumber = 0;

        while (true)
        {
            var page = await SendRequestAsync<DodoProductsListResponse>(
                HttpMethod.Get,
                $"/products?page_size={PageSize}&page_number={pageNumber}&archived=false&recurring=true",
                body: null,
                cancellationToken);

            var items = page?.Items ?? [];
            if (items.Count == 0)
                yield break;

            foreach (var item in items)
                yield return item;

            if (items.Count < PageSize)
                yield break;

            pageNumber++;
        }
    }

    private async Task<DodoProductDto?> FindProductForDefinitionAsync(DodoPlanDefinition definition, CancellationToken cancellationToken)
    {
        await foreach (var product in ListAllProductsAsync(cancellationToken))
        {
            if (MatchesDefinition(product, definition))
                return product;
        }

        return null;
    }

    private async Task<DodoProductDto?> RetrieveProductAsync(string productId, CancellationToken cancellationToken)
    {
        return await SendRequestAsync<DodoProductDto>(HttpMethod.Get, $"/products/{productId}", body: null, cancellationToken);
    }

    private async Task<DodoProductDto> CreateProductAsync(DodoPlanDefinition definition, CancellationToken cancellationToken)
    {
        var request = new
        {
            name = definition.Name,
            price = new
            {
                type = "recurring_price",
                currency = definition.Currency,
                discount = 0,
                price = definition.PriceCents,
                purchasing_power_parity = true,
                payment_frequency_count = 1,
                payment_frequency_interval = "Month",
                subscription_period_count = 1,
                subscription_period_interval = "Month"
            },
            tax_category = definition.TaxCategory,
            metadata = BuildStableMetadata(definition)
        };

        var created = await SendRequestAsync<DodoProductDto>(HttpMethod.Post, "/products", request, cancellationToken)
            ?? throw new InvalidOperationException($"Dodo did not return a product for plan '{definition.Plan}'.");

        return created;
    }

    private async Task<DodoProductDto> EnsureStableMetadataAsync(
        DodoProductDto product,
        DodoPlanDefinition definition,
        CancellationToken cancellationToken)
    {
        var metadata = new Dictionary<string, string>(product.Metadata ?? new Dictionary<string, string>(), StringComparer.OrdinalIgnoreCase);
        var stableMetadata = BuildStableMetadata(definition);

        var changed = false;
        foreach (var kvp in stableMetadata)
        {
            if (!metadata.TryGetValue(kvp.Key, out var existing) || !string.Equals(existing, kvp.Value, StringComparison.Ordinal))
            {
                metadata[kvp.Key] = kvp.Value;
                changed = true;
            }
        }

        if (!changed)
            return product;

        var updateRequest = new { metadata };
        var updated = await SendRequestAsync<DodoProductDto>(HttpMethod.Patch, $"/products/{product.ProductId}", updateRequest, cancellationToken);
        return updated ?? product with { Metadata = metadata };
    }

    private void CacheProduct(DodoProductDto product, Plan plan)
    {
        _planToProductId[plan] = product.ProductId;
        _productIdToPlan[product.ProductId] = plan;
    }

    private static bool MatchesDefinition(DodoProductDto product, DodoPlanDefinition definition)
    {
        if (!TryResolvePlanFromProduct(product, out var resolvedPlan) || resolvedPlan != definition.Plan)
            return false;

        return string.Equals(product.Name, definition.Name, StringComparison.OrdinalIgnoreCase)
            && product.IsRecurring
            && string.Equals(product.TaxCategory, definition.TaxCategory, StringComparison.OrdinalIgnoreCase)
            && product.Price == definition.PriceCents
            && string.Equals(product.Currency, definition.Currency, StringComparison.OrdinalIgnoreCase);
    }

    private static bool TryResolvePlanFromProduct(DodoProductDto product, out Plan plan)
    {
        var metadata = product.Metadata ?? new Dictionary<string, string>();

        if (TryParsePlan(GetMetadataValue(metadata, DodoProductIds.PlanMetadataKey), out plan))
            return true;

        if (TryParseLegacyProductId(GetMetadataValue(metadata, DodoProductIds.LegacyProductIdMetadataKey), out plan))
            return true;

        if (string.Equals(product.Name, Definitions[Plan.GiggingBand].Name, StringComparison.OrdinalIgnoreCase)
            && product.IsRecurring
            && string.Equals(product.TaxCategory, Definitions[Plan.GiggingBand].TaxCategory, StringComparison.OrdinalIgnoreCase)
            && product.Price == Definitions[Plan.GiggingBand].PriceCents)
        {
            plan = Plan.GiggingBand;
            return true;
        }

        if (string.Equals(product.Name, Definitions[Plan.Organization].Name, StringComparison.OrdinalIgnoreCase)
            && product.IsRecurring
            && string.Equals(product.TaxCategory, Definitions[Plan.Organization].TaxCategory, StringComparison.OrdinalIgnoreCase)
            && product.Price == Definitions[Plan.Organization].PriceCents)
        {
            plan = Plan.Organization;
            return true;
        }

        plan = default;
        return false;
    }

    private static bool TryParsePlan(string? value, out Plan plan)
    {
        if (!string.IsNullOrWhiteSpace(value) && Enum.TryParse(value, true, out plan))
            return true;

        plan = default;
        return false;
    }

    private static bool TryParseLegacyProductId(string? value, out Plan plan)
    {
        foreach (var entry in DodoProductIds.LegacyProductIds)
        {
            if (string.Equals(entry.Value, value, StringComparison.OrdinalIgnoreCase))
            {
                plan = entry.Key;
                return true;
            }
        }

        plan = default;
        return false;
    }

    private static string? GetMetadataValue(Dictionary<string, string> metadata, string key)
    {
        return metadata.TryGetValue(key, out var value) ? value : null;
    }

    private static Dictionary<string, string> BuildStableMetadata(DodoPlanDefinition definition)
    {
        return new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [DodoProductIds.PlanMetadataKey] = definition.Plan.ToString(),
            [DodoProductIds.LegacyProductIdMetadataKey] = DodoProductIds.LegacyProductIds[definition.Plan],
            [DodoProductIds.PlanDisplayNameMetadataKey] = definition.Name,
            [DodoProductIds.PlanPriceCentsMetadataKey] = definition.PriceCents.ToString(),
            [DodoProductIds.PlanCurrencyMetadataKey] = definition.Currency,
            [DodoProductIds.PlanTaxCategoryMetadataKey] = definition.TaxCategory
        };
    }

    private async Task<T?> SendRequestAsync<T>(HttpMethod method, string path, object? body, CancellationToken cancellationToken)
    {
        var apiKey = _configuration["Dodo:SecretKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException("Missing Dodo:SecretKey configuration.");

        var client = _httpClientFactory.CreateClient();
        client.BaseAddress = new Uri(_configuration["Dodo:BaseUrl"] ?? DefaultBaseUrl);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

        using var request = new HttpRequestMessage(method, path);
        if (body is not null)
            request.Content = JsonContent.Create(body, options: JsonOptions);

        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Dodo request {Method} {Path} failed with {StatusCode}: {Error}", method, path, (int)response.StatusCode, error);
            throw new InvalidOperationException($"Dodo request to {path} failed with status {(int)response.StatusCode}: {error}");
        }

        if (response.Content.Headers.ContentLength == 0)
            return default;

        return await response.Content.ReadFromJsonAsync<T>(JsonOptions, cancellationToken);
    }
}

internal sealed record DodoPlanDefinition(
    Plan Plan,
    string Name,
    int PriceCents,
    string Currency,
    string TaxCategory);

internal sealed record DodoProductsListResponse(
    [property: JsonPropertyName("items")] List<DodoProductDto> Items);

internal sealed record DodoProductDto
{
    [JsonPropertyName("product_id")]
    public string ProductId { get; init; } = string.Empty;

    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("metadata")]
    public Dictionary<string, string>? Metadata { get; init; }

    [JsonPropertyName("is_recurring")]
    public bool IsRecurring { get; init; }

    [JsonPropertyName("tax_category")]
    public string TaxCategory { get; init; } = string.Empty;

    [JsonPropertyName("price")]
    public int? Price { get; init; }

    [JsonPropertyName("currency")]
    public string? Currency { get; init; }

    [JsonPropertyName("price_detail")]
    public JsonElement? PriceDetail { get; init; }
}


