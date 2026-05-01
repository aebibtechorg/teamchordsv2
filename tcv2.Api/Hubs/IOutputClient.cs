using tcv2.Api.Data.Dto;

namespace tcv2.Api.Hubs;

public interface IOutputClient
{
    Task OutputCreated(OutputDetailDto output);
    Task OutputUpdated(OutputDetailDto output);
    Task OutputDeleted(Guid outputId);
}
