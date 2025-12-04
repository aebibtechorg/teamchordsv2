using System;
using System.ComponentModel.DataAnnotations;
 
namespace tcv2.Api.Data.Entities
{
    public class Organization
    {
        [Key]
        public Guid Id { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? Name { get; set; }
        
        // Many-to-many: organization can have many users
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
