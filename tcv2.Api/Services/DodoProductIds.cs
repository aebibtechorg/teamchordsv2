using tcv2.Api.Data.Entities;

namespace tcv2.Api.Services;

public static class DodoProductIds
{
    // Legacy product IDs from the original Dodo dashboard setup.
    // We keep these as stable references and stamp them into Dodo product metadata.
    public const string GiggingBand = "pdt_0NdNpENE8md4lwjlcR5Le";
    public const string Organization = "pdt_0NdNpac90mmb2cIVqi9rn";

    public const string PlanMetadataKey = "teamchords_plan";
    public const string LegacyProductIdMetadataKey = "teamchords_legacy_product_id";
    public const string PlanDisplayNameMetadataKey = "teamchords_plan_display_name";
    public const string PlanPriceCentsMetadataKey = "teamchords_plan_price_cents";
    public const string PlanCurrencyMetadataKey = "teamchords_plan_currency";
    public const string PlanTaxCategoryMetadataKey = "teamchords_plan_tax_category";

    public static IReadOnlyDictionary<Plan, string> LegacyProductIds { get; } = new Dictionary<Plan, string>
    {
        [Plan.GiggingBand] = GiggingBand,
        [Plan.Organization] = Organization,
    };
}
