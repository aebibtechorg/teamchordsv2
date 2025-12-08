using System;
using System.ComponentModel.DataAnnotations;
 
namespace tcv2.Api.Data.Entities
{
    public class Invite
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Email { get; set; } = string.Empty;

        public Guid InvitedBy { get; set; }

        public DateTimeOffset CreatedAt { get; set; }

        [Required]
        public string Token { get; set; } = string.Empty;

        public bool Used { get; set; }

        public DateTimeOffset ExpiresAt { get; set; }

        public Guid? OrganizationId { get; set; }
        public Organization? Organization { get; set; }

        // Navigation - references auth.users; keep as raw id for now
    }
}
