using System;
using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
    public class InviteDto
    {
        public Guid? Id { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public Guid? InvitedBy { get; set; }

        [Required]
        public string Token { get; set; } = string.Empty;

        public bool Used { get; set; }

        public DateTimeOffset ExpiresAt { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
    }
}
