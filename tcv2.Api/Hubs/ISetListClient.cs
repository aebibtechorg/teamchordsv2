using tcv2.Api.Data.Entities;

namespace tcv2.Api.Hubs;

public interface ISetListClient
{
    Task SetListCreated(SetList setList);
    Task SetListUpdated(SetList setList);
    Task SetListDeleted(Guid setListId);
}
