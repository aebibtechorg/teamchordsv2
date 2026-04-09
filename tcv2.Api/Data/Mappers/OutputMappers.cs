using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Data.Mappers;

public static class OutputMappers
{
    public static OutputDto ToDto(this Output output)
    {
        return new OutputDto
        {
            Id = output.Id,
            SetListId = output.SetListId,
            ChordSheetId = output.ChordSheetId,
            TargetKey = output.TargetKey,
            Capo = output.Capo,
            Order = output.Order,
            CreatedAt = output.CreatedAt,
            UpdatedAt = output.UpdatedAt
        };
    }

    public static OutputDetailDto ToDetailDto(this Output output)
    {
        return new OutputDetailDto
        {
            Id = output.Id,
            SetListId = output.SetListId,
            ChordSheetId = output.ChordSheetId,
            TargetKey = output.TargetKey,
            Capo = output.Capo,
            Order = output.Order,
            CreatedAt = output.CreatedAt,
            UpdatedAt = output.UpdatedAt,
            Chordsheets = output.ChordSheet == null ? null : new ChordSheetDetails
            {
                Key = output.ChordSheet.Key,
                Content = output.ChordSheet.Content,
                SheetType = output.ChordSheet.SheetType
            }
        };
    }

    public static Output ToEntity(this OutputDto dto)
    {
        return new Output
        {
            SetListId = dto.SetListId,
            ChordSheetId = dto.ChordSheetId,
            TargetKey = dto.TargetKey,
            Capo = dto.Capo,
            Order = dto.Order,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static void UpdateFromDto(this Output output, OutputDto dto)
    {
        output.SetListId = dto.SetListId;
        output.ChordSheetId = dto.ChordSheetId;
        output.TargetKey = dto.TargetKey;
        output.Capo = dto.Capo;
        output.Order = dto.Order;
        output.UpdatedAt = DateTime.UtcNow;
    }
}
