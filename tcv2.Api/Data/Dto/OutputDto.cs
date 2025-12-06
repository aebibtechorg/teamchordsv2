using System;
using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
    public class OutputDto
    {
        public Guid? Id { get; set; }
        public Guid? SetListId { get; set; }
        public Guid? ChordSheetId { get; set; }
        public string? TargetKey { get; set; }
        public short? Capo { get; set; }
        public short Order { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
