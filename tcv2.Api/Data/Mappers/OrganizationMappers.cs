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
            OwnerUserId = organization.OwnerUserId,
            Name = organization.Name,
            CreatedAt = organization.CreatedAt,
            UpdatedAt = organization.UpdatedAt,
            Plan = organization.Plan,
            SubscriptionStatus = organization.SubscriptionStatus,
            PlanExpiresAt = organization.PlanExpiresAt
        };
    }

    public static void UpdateFromDto(this Organization organization, OrganizationDto dto)
    {
        organization.Name = dto.Name;
    }
}
