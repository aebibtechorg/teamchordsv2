using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
    public class UpdateMeDto
    {
        [Required]
        [StringLength(100)]
        public string? GivenName { get; set; }

        [Required]
        [StringLength(100)]
        public string? FamilyName { get; set; }
    }
}
