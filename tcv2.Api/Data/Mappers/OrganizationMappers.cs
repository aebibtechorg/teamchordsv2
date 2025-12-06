using tcv2.Api.Data.Entities;
using tcv2.Api.Data.Dto;

namespace tcv2.Api.Data.Mappers;

public static class OrganizationMappers
{
    public static OrganizationDto ToDto(this Organization organization)
    {
        return new OrganizationDto
        {
            Id = organization.Id,
            Name = organization.Name,
            CreatedAt = organization.CreatedAt,
            UpdatedAt = organization.UpdatedAt
        };
    }

    public static void UpdateFromDto(this Organization organization, OrganizationDto dto)
    {
        organization.Name = dto.Name;
    }
}
