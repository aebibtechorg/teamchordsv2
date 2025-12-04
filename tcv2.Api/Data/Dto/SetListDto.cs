using System;
using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
    public class SetListDto
    {
        public Guid? Id { get; set; }

        public Guid? OrgId { get; set; }

        [StringLength(200)]
        public string? Name { get; set; }
    }
}
