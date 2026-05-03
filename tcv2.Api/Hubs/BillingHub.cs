using Microsoft.AspNetCore.SignalR;

namespace tcv2.Api.Hubs;

public class BillingHub : Hub<IBillingClient>
{
    public override async Task OnConnectedAsync()
    {
        var httpContext = Context.GetHttpContext();

        if (httpContext?.Request.Query.TryGetValue("orgId", out var orgIdValues) == true
            && Guid.TryParse(orgIdValues.ToString(), out var orgId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, HubGroupNames.Organization(orgId));
        }

        await base.OnConnectedAsync();
    }
}

