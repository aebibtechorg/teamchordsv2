using tcv2.Api.Data.Dto;
using tcv2.Api.Data.Entities;

namespace tcv2.Api.Data.Mappers;

public static class ChordSheetMappers
{
    public static ChordSheetDto ToDto(this ChordSheet chordSheet)
    {
        return new ChordSheetDto
        {
            Id = chordSheet.Id,
            OrgId = chordSheet.OrgId,
            Title = chordSheet.Title,
            Artist = chordSheet.Artist,
            Content = chordSheet.Content,
            Key = chordSheet.Key,
            CreatedAt = chordSheet.CreatedAt,
            UpdatedAt = chordSheet.UpdatedAt
        };
    }

    public static ChordSheet ToEntity(this ChordSheetDto dto)
    {
        return new ChordSheet
        {
            OrgId = dto.OrgId,
            Title = dto.Title,
            Artist = dto.Artist,
            Content = dto.Content,
            Key = dto.Key,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static void UpdateFromDto(this ChordSheet chordSheet, ChordSheetDto dto)
    {
        chordSheet.OrgId = dto.OrgId;
        chordSheet.Title = dto.Title;
        chordSheet.Artist = dto.Artist;
        chordSheet.Content = dto.Content;
        chordSheet.Key = dto.Key;
        chordSheet.UpdatedAt = DateTime.UtcNow;
    }
}
