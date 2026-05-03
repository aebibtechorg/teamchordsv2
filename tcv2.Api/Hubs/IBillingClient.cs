using tcv2.Api.Data.Dto;

namespace tcv2.Api.Hubs;

public interface IBillingClient
{
    Task BillingUpdated(BillingPlanChangedNotificationDto notification);
}


