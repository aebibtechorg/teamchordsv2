using System;
using System.ComponentModel.DataAnnotations;
 
namespace tcv2.Api.Data.Entities
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }
        // OrgId removed: users may belong to many organizations via the Organizations collection

        public string? Email { get; set; }

        public bool? EmailVerified { get; set; }

        // Auth0 user identifier (e.g. "auth0|1234567890")
        public string? Auth0UserId { get; set; }

        public string? Name { get; set; }

        public string? GivenName { get; set; }

        public string? FamilyName { get; set; }

        public string? Picture { get; set; }

        public DateTime? CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public Profile? Profile { get; set; }
        // Many-to-many: a user can belong to multiple organizations
        public ICollection<Organization> Organizations { get; set; } = new List<Organization>();
    }
}
