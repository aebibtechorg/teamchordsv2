using System;
using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto;

public sealed class Auth0SyncUserDto
{
    [Required]
    public string? Auth0UserId { get; set; }

    [Required]
    [EmailAddress]
    public string? Email { get; set; }

    public bool? EmailVerified { get; set; }

    [StringLength(100)]
    public string? GivenName { get; set; }

    [StringLength(100)]
    public string? FamilyName { get; set; }

    [StringLength(200)]
    public string? Name { get; set; }

    [Url]
    public string? Picture { get; set; }

    public Guid? InviteId { get; set; }
}

