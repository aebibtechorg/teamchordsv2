using System;
using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
    public class ProfileDto
    {
        public Guid? Id { get; set; }

        public Guid? UserId { get; set; }

        public Guid? OrgId { get; set; }
    }
}
