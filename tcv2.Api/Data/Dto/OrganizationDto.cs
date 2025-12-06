using System;
using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
public class OrganizationDto
{
    public Guid Id { get; set; }
    [Required(ErrorMessage = "Organization name is required.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Organization name must be between 2 and 100 characters.")]
    public string? Name { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
}
