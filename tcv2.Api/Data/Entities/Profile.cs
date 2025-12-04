using System;
using System.ComponentModel.DataAnnotations;
 
namespace tcv2.Api.Data.Entities
{
    public class Profile
    {
        [Key]
        public Guid Id { get; set; }

        public Guid? UserId { get; set; }

        public DateTime CreatedAt { get; set; }
    
        public DateTime? UpdatedAt { get; set; }

        public Guid? OrgId { get; set; }
    }
}
