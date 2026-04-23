using System;

namespace tcv2.Api.Data.Dto
{
    public class OrgMemberDto
    {
        public Guid UserId { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Picture { get; set; }
        public string Role { get; set; } = "member";
        public DateTime JoinedAt { get; set; }
    }
}
