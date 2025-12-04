using System;
using System.ComponentModel.DataAnnotations;


namespace tcv2.Api.Data.Entities
{
    public class ChordSheet
    {
        [Key]
        public Guid Id { get; set; }

        public Guid? OrgId { get; set; }

        public string? Title { get; set; }

        public string? Artist { get; set; }

        public string? Content { get; set; }

        public string? Key { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public Organization? Organization { get; set; }
    }
}
