using tcv2.Api.Data.Entities;
using tcv2.Api.Data.Dto;

namespace tcv2.Api.Hubs;

public interface IChordSheetClient
{
    Task ChordSheetCreated(ChordSheet chordSheet);
    Task ChordSheetUpdated(ChordSheet chordSheet);
    Task ChordSheetDeleted(Guid chordSheetId);
    Task BulkUploadProgress(int processed, int total, string message);
    Task BulkUploadFinished();
    Task BulkUploadSummary(BulkUploadSummaryDto summary);
}
