using tcv2.Api.Data.Dto;

namespace tcv2.Api.Hubs;

public interface ISetListClient
{
    Task SetListCreated(SetListDto setList);
    Task SetListUpdated(SetListDto setList);
    Task SetListDeleted(Guid setListId);

    Task OutputCreated(OutputDetailDto output);
    Task OutputUpdated(OutputDetailDto output);
    Task OutputDeleted(Guid outputId);

    Task ChordSheetCreated(ChordSheetDto chordSheet);
    Task ChordSheetUpdated(ChordSheetDto chordSheet);
    Task ChordSheetDeleted(Guid chordSheetId);
    Task BulkUploadProgress(int processed, int total, string message);
    Task BulkUploadFinished();
    Task BulkUploadSummary(BulkUploadSummaryDto summary);
}
