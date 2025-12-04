using System;
using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
    public class OutputDto
    {
        public Guid? Id { get; set; }

        public Guid? SetListId { get; set; }

        [StringLength(16)]
        public string? TargetKey { get; set; }

        public Guid? ChordSheetId { get; set; }

        [Range(0, 24)]
        public short? Capo { get; set; }
    }
}
