namespace tcv2.Api.Data.Dto;

#pragma warning disable CS9113
public record BillingPlanChangedNotificationDto(
    Guid OrgId,
    string EventType,
    string Plan,
    string SubscriptionStatus,
    DateTime? PlanExpiresAt,
    DateTime UpdatedAt,
    string? SubscriptionId);
#pragma warning restore CS9113


