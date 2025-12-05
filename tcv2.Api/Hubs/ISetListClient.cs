using tcv2.Api.Data.Entities;

namespace tcv2.Api.Hubs;

public interface ISetListClient
{
    Task SetListCreated(SetList setList);
    Task SetListUpdated(SetList setList);
    Task SetListDeleted(Guid setListId);

    Task OutputCreated(object output);
    Task OutputUpdated(object output);
    Task OutputDeleted(Guid outputId);

    Task ChordSheetCreated(ChordSheet chordSheet);
    Task ChordSheetUpdated(ChordSheet chordSheet);
    Task ChordSheetDeleted(Guid chordSheetId);
    Task BulkUploadProgress(int processed, int total, string message);
    Task BulkUploadFinished();
}
