using tcv2.Api.Data.Dto;

namespace tcv2.Api.Hubs;

public interface IChordSheetClient
{
    Task ChordSheetCreated(ChordSheetDto chordSheet);
    Task ChordSheetUpdated(ChordSheetDto chordSheet);
    Task ChordSheetDeleted(Guid chordSheetId);
    Task BulkUploadProgress(int processed, int total, string message);
    Task BulkUploadFinished();
    Task BulkUploadSummary(BulkUploadSummaryDto summary);
}
