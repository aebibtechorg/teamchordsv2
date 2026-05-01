using Microsoft.AspNetCore.SignalR;

namespace tcv2.Api.Hubs;

public class SetListHub : Hub<ISetListClient>
{
	public override async Task OnConnectedAsync()
	{
		var httpContext = Context.GetHttpContext();

		if (httpContext?.Request.Query.TryGetValue("orgId", out var orgIdValues) == true
			&& Guid.TryParse(orgIdValues.ToString(), out var orgId))
		{
			await Groups.AddToGroupAsync(Context.ConnectionId, HubGroupNames.Organization(orgId));
		}

		if (httpContext?.Request.Query.TryGetValue("setListId", out var setListIdValues) == true
			&& Guid.TryParse(setListIdValues.ToString(), out var setListId))
		{
			await Groups.AddToGroupAsync(Context.ConnectionId, HubGroupNames.SetList(setListId));
		}

		await base.OnConnectedAsync();
	}
}
