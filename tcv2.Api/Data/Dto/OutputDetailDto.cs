namespace tcv2.Api.Data.Dto
{
    public class OutputDetailDto : OutputDto
    {
        public ChordSheetDetails? Chordsheets { get; set; }
    }

    public class ChordSheetDetails
    {
        public string? Key { get; set; }
        public string? Content { get; set; }
    }
}
