using System;

namespace tcv2.Api.Data.Entities
{
    public enum OrgRole
    {
        Admin,
        Member
    }

    public class UserOrganization
    {
        public Guid UserId { get; set; }
        public Guid OrganizationId { get; set; }
        public OrgRole Role { get; set; }
        public DateTime CreatedAt { get; set; }

        // Navigation properties
        public User User { get; set; } = null!;
        public Organization Organization { get; set; } = null!;
    }
}
