using System;
using System.ComponentModel.DataAnnotations;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Data.Dto
{
public class OrganizationDto
{
    public Guid Id { get; set; }
    public Guid? OwnerUserId { get; set; }
    [Required(ErrorMessage = "Organization name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Organization name must be between 2 and 100 characters.")]
    public string? Name { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Plan Plan { get; set; }
    public SubscriptionStatus SubscriptionStatus { get; set; }
    public DateTime? PlanExpiresAt { get; set; }
}
}
