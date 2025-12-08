using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Data.Mappers;

public static class InviteMappers
{
    public static InviteDto ToDto(this Invite invite)
    {
        return new InviteDto
        {
            Id = invite.Id,
            Email = invite.Email,
            InvitedBy = invite.InvitedBy,
            Token = invite.Token,
            Used = invite.Used,
            ExpiresAt = invite.ExpiresAt,
            CreatedAt = invite.CreatedAt,
            OrganizationId = invite.OrganizationId
        };
    }

    public static Invite ToEntity(this InviteDto dto)
    {
        // Note: This only maps properties that are safe to be set from a DTO.
        // The service/endpoint layer is responsible for setting properties
        // like Token, ExpiresAt, InvitedBy, etc.
        return new Invite
        {
            Email = dto.Email,
            Used = dto.Used,
            OrganizationId = dto.OrganizationId
        };
    }

    public static void UpdateFromDto(this Invite invite, InviteDto dto)
    {
        invite.Email = dto.Email;
        invite.Token = dto.Token;
        invite.Used = dto.Used;
        invite.ExpiresAt = dto.ExpiresAt;
        invite.OrganizationId = dto.OrganizationId;
    }
}
