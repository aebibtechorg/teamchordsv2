using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Data.Mappers;

public static class ProfileMappers
{
    public static ProfileDto ToDto(this Profile profile)
    {
        return new ProfileDto
        {
            Id = profile.Id,
            UserId = profile.UserId,
            OrgId = profile.OrgId
        };
    }

    public static Profile ToEntity(this ProfileDto dto)
    {
        return new Profile
        {
            UserId = dto.UserId,
            OrgId = dto.OrgId,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static void UpdateFromDto(this Profile profile, ProfileDto dto)
    {
        profile.UserId = dto.UserId;
        profile.OrgId = dto.OrgId;
        profile.UpdatedAt = DateTime.UtcNow;
    }
}
