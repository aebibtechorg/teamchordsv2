using System;
using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
    public class UserDto
    {
        public Guid? Id { get; set; }

        [EmailAddress]
        [Required]
        public string? Email { get; set; }

        public bool? EmailVerified { get; set; }
        public string? Auth0UserId { get; set; }

        [StringLength(200)]
        public string? Name { get; set; }

        [StringLength(100)]
        [Required]
        public string? GivenName { get; set; }

        [StringLength(100)]
        [Required]
        public string? FamilyName { get; set; }

        [Url]
        public string? Picture { get; set; }
        
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        [StringLength(200, MinimumLength = 6)]
        public string? Password { get; set; }

        public Guid? InviteOrganizationId { get; set; }
    }
}
