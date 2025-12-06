using System.Linq;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Data.Mappers;

public static class UserMappers
{
    public static UserDto ToDto(this User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            EmailVerified = user.EmailVerified,
            Auth0UserId = user.Auth0UserId,
            Name = user.Name,
            GivenName = user.GivenName,
            FamilyName = user.FamilyName,
            Picture = user.Picture,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt
        };
    }

    public static UserDetailDto ToDetailDto(this User user)
    {
        return new UserDetailDto
        {
            Id = user.Id,
            Email = user.Email,
            EmailVerified = user.EmailVerified,
            Auth0UserId = user.Auth0UserId,
            Name = user.Name,
            GivenName = user.GivenName,
            FamilyName = user.FamilyName,
            Picture = user.Picture,
            CreatedAt = user.CreatedAt,
            UpdatedAt = user.UpdatedAt,
            Profile = user.Profile?.ToDto(),
            Organizations = user.Organizations.Select(o => o.ToDto()).ToList()
        };
    }

    public static User ToEntity(this UserDto dto)
    {
        return new User
        {
            Email = dto.Email,
            EmailVerified = dto.EmailVerified,
            Auth0UserId = dto.Auth0UserId,
            Name = $"{dto.GivenName} {dto.FamilyName}",
            GivenName = dto.GivenName,
            FamilyName = dto.FamilyName,
            Picture = dto.Picture,
            CreatedAt = DateTime.UtcNow
        };
    }
}
