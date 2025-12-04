using System;
using System.ComponentModel.DataAnnotations;
 
namespace tcv2.Api.Data.Entities
{
    public class SetList
    {
        [Key]
        public Guid Id { get; set; }

        public Guid? OrgId { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? Name { get; set; }

        // Navigation
        public Organization? Organization { get; set; }
    }
}
