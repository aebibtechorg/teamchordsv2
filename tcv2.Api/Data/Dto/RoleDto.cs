using System.ComponentModel.DataAnnotations;

namespace tcv2.Api.Data.Dto
{
    public class RoleDto
    {
        [Required]
        [RegularExpression("^(Admin|Member)$", ErrorMessage = "Role must be 'Admin' or 'Member'")]
        public string Role { get; set; } = "Member";
    }
}
