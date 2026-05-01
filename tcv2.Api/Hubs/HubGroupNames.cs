namespace tcv2.Api.Hubs;

internal static class HubGroupNames
{
    public static string Organization(Guid orgId) => $"org:{orgId:D}";

    public static string SetList(Guid setListId) => $"setlist:{setListId:D}";
}
