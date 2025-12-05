using System;
using System.ComponentModel.DataAnnotations;
 
namespace tcv2.Api.Data.Entities
{
    public class Output
    {
        [Key]
        public Guid Id { get; set; }

        public Guid? SetListId { get; set; }

        public string? TargetKey { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public Guid? ChordSheetId { get; set; }

        public short? Capo { get; set; }

        public short Order { get; set; }

        // Navigation
        public SetList? SetList { get; set; }
        public ChordSheet? ChordSheet { get; set; }
    }
}
