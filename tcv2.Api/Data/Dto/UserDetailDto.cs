using System;
using System.Collections.Generic;

namespace tcv2.Api.Data.Dto
{
    public class UserDetailDto
    {
        public Guid Id { get; set; }
        public string? Email { get; set; }
        public bool? EmailVerified { get; set; }
        public string? Auth0UserId { get; set; }
        public string? Name { get; set; }
        public string? GivenName { get; set; }
        public string? FamilyName { get; set; }
        public string? Picture { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public ProfileDto? Profile { get; set; }
        public ICollection<OrganizationWithRoleDto> Organizations { get; set; } = new List<OrganizationWithRoleDto>();
    }
}
