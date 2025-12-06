using System.Linq;
using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Data.Mappers;

public static class SetListMappers
{
    public static SetListDto ToDto(this SetList setList)
    {
        return new SetListDto
        {
            Id = setList.Id,
            OrgId = setList.OrgId,
            Name = setList.Name,
            CreatedAt = setList.CreatedAt,
            UpdatedAt = setList.UpdatedAt
        };
    }

    public static SetListDetailDto ToDetailDto(this SetList setList)
    {
        return new SetListDetailDto
        {
            Id = setList.Id,
            OrgId = setList.OrgId,
            Name = setList.Name,
            CreatedAt = setList.CreatedAt,
            UpdatedAt = setList.UpdatedAt,
            Outputs = setList.Outputs.Select(o => o.ToDto()).ToList()
        };
    }

    public static SetList ToEntity(this SetListDto dto)
    {
        return new SetList
        {
            OrgId = dto.OrgId,
            Name = dto.Name,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static void UpdateFromDto(this SetList setList, SetListDto dto)
    {
        setList.OrgId = dto.OrgId;
        setList.Name = dto.Name;
        setList.UpdatedAt = DateTime.UtcNow;
    }
}
