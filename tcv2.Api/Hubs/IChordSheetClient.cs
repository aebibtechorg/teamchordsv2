using tcv2.Api.Data.Entities;

namespace tcv2.Api.Hubs;

public interface IChordSheetClient
{
    Task ChordSheetCreated(ChordSheet chordSheet);
    Task ChordSheetUpdated(ChordSheet chordSheet);
    Task ChordSheetDeleted(Guid chordSheetId);
    Task BulkUploadProgress(int processed, int total, string message);
    Task BulkUploadFinished();
}
