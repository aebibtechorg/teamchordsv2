namespace tcv2.Api.Data.Dto;

public class BulkChordSheetRequestDto
{
    public required ChordSheetDto[] Dtos { get; set; }
    public required string ConnectionId { get; set; }
}