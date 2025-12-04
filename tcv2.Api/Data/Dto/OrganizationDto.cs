using System;
using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
    public class OrganizationDto
    {
        public Guid? Id { get; set; }

        [StringLength(200)]
        public string? Name { get; set; }
    }
}
