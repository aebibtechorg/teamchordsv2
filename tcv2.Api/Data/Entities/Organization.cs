using System;
using System.ComponentModel.DataAnnotations;
 
namespace tcv2.Api.Data.Entities
{
    public enum Plan
    {
        Free,
        GiggingBand,
        Organization
    }

    public enum SubscriptionStatus
    {
        None,
        Active,
        Canceled,
        PastDue,
        Incomplete
    }

    public class Organization
    {
        [Key]
        public Guid Id { get; set; }

        public Guid? OwnerUserId { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? Name { get; set; }

        public Plan Plan { get; set; } = Plan.Free;

        public SubscriptionStatus SubscriptionStatus { get; set; } = SubscriptionStatus.None;

        public string? DodoCustomerId { get; set; }

        public string? DodoSubscriptionId { get; set; }

        public DateTime? PlanExpiresAt { get; set; }

        public User? OwnerUser { get; set; }
        
        // Many-to-many: organization can have many users
        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<UserOrganization> UserOrganizations { get; set; } = new List<UserOrganization>();
    }
}
