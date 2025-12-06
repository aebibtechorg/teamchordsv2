using System.Collections.Generic;

namespace tcv2.Api.Data.Dto
{
    public class SetListDetailDto : SetListDto
    {
        public List<OutputDto> Outputs { get; set; } = new List<OutputDto>();
    }
}
