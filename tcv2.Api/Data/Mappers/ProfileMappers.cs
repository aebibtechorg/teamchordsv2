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
            OrgId = profile.OrgId,
            Bio = profile.Bio,
            Instruments = profile.Instruments,
            MusicalRole = profile.MusicalRole,
            PreferredKey = profile.PreferredKey,
            Website = profile.Website
        };
    }

    public static Profile ToEntity(this ProfileDto dto)
    {
        return new Profile
        {
            UserId = dto.UserId,
            OrgId = dto.OrgId,
            Bio = dto.Bio,
            Instruments = dto.Instruments,
            MusicalRole = dto.MusicalRole,
            PreferredKey = dto.PreferredKey,
            Website = dto.Website,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static void UpdateFromDto(this Profile profile, ProfileDto dto)
    {
        profile.UserId = dto.UserId;
        profile.OrgId = dto.OrgId;
        profile.Bio = dto.Bio;
        profile.Instruments = dto.Instruments;
        profile.MusicalRole = dto.MusicalRole;
        profile.PreferredKey = dto.PreferredKey;
        profile.Website = dto.Website;
        profile.UpdatedAt = DateTime.UtcNow;
    }
}
