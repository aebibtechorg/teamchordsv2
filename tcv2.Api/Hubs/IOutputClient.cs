using tcv2.Api.Data.Entities;

namespace tcv2.Api.Hubs;

public interface IOutputClient
{
    Task OutputCreated(object output);
    Task OutputUpdated(object output);
    Task OutputDeleted(Guid outputId);
}
