using System;

namespace tcv2.Api.Data.Dto
{
    public class OrganizationWithRoleDto : OrganizationDto
    {
        public string Role { get; set; } = "member";
    }
}
