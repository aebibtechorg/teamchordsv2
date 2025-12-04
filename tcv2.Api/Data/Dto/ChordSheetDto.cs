using System;
using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
    public class ChordSheetDto
    {
        public Guid? Id { get; set; }

        public Guid? OrgId { get; set; }

        [StringLength(200)]
        public string? Title { get; set; }

        [StringLength(200)]
        public string? Artist { get; set; }

        public string? Content { get; set; }

        [StringLength(16)]
        public string? Key { get; set; }
    }
}
