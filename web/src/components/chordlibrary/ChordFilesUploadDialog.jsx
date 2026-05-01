import { useState, useRef } from "react";
import { X } from "lucide-react";
import ChordSheetJS from "chordsheetjs";
import { createChordsheet, createChordsheetsBulk } from "../../utils/chordsheets";
import { useProfileStore } from "../../store/useProfileStore";
import { toast } from "react-hot-toast";

const ChordFilesUploadDialog = ({ connection, close, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ processed: 0, total: 0, message: '' });
  const inputRef = useRef(null);
  const pendingBulkUploadsRef = useRef(0);
  const fileProcessingCompleteRef = useRef(false);
  const finishedNotifiedRef = useRef(false);
  const { profile } = useProfileStore();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  }

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadProgress({ processed: 0, total: 0, message: 'Starting upload...' });
    pendingBulkUploadsRef.current = 0;
    fileProcessingCompleteRef.current = false;
    finishedNotifiedRef.current = false;

    const hasBulkJson = files.some((file) => file.name.endsWith('.json'));
    const canRunBulkUpload = !hasBulkJson || Boolean(connection?.connectionId);

    if (!canRunBulkUpload) {
      toast.error("Please wait for the library connection to finish before uploading JSON backups.");
      setIsUploading(false);
      return;
    }

    const handleProgress = (processed, total, message) => {
      setUploadProgress({ processed, total, message });
    };

    const notifyFinishedIfComplete = () => {
      if (finishedNotifiedRef.current) return;
      if (!fileProcessingCompleteRef.current || pendingBulkUploadsRef.current > 0) return;

      finishedNotifiedRef.current = true;
      setIsUploading(false);
      onUploadComplete?.();
    };

    const handleFinished = () => {
      if (pendingBulkUploadsRef.current > 0) {
        pendingBulkUploadsRef.current -= 1;
      }
      setUploadProgress((current) => ({
        ...current,
        processed: current.total,
        message: pendingBulkUploadsRef.current > 0 ? 'Finishing remaining bulk imports...' : 'Upload finished.'
      }));
      notifyFinishedIfComplete();
    };

    let handleSummary;
    if (connection && hasBulkJson) {
      connection.on("BulkUploadProgress", handleProgress);
      connection.on("BulkUploadFinished", handleFinished);
      handleSummary = (summary) => {
        // support camelCase or PascalCase coming from SignalR serialization
        const createdIds = summary?.createdIds ?? summary?.CreatedIds ?? [];
        const total = summary?.totalProcessed ?? summary?.TotalProcessed ?? 0;
        const successful = summary?.successful ?? summary?.Successful ?? (createdIds ? createdIds.length : 0);
        setUploadProgress({ processed: successful, total, message: `Imported ${successful} of ${total} songs` });
        // decrement pending count for this bulk file and attempt to finish
        if (pendingBulkUploadsRef.current > 0) pendingBulkUploadsRef.current -= 1;
        notifyFinishedIfComplete();
      };
      connection.on("BulkUploadSummary", handleSummary);
    }

    try {
      const uploadPromises = files.map((file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const text = String(reader.result ?? "");

            if (file.name.endsWith('.json')) {
              const sheets = JSON.parse(text);
              if (Array.isArray(sheets)) {
                pendingBulkUploadsRef.current += 1;
                const dtos = sheets.map((sheet) => ({ ...sheet, orgId: profile.orgId }));
                await createChordsheetsBulk({ dtos, connectionId: connection?.connectionId });
              }
            } else {
              const parser = new ChordSheetJS.ChordProParser();
              const chordsheet = parser.parse(text);
              await createChordsheet({ title: chordsheet.title || 'Untitled', artist: chordsheet.artist || 'Various', key: chordsheet.key || 'C', content: text, orgId: profile.orgId });
            }

            resolve();
          } catch (error) {
            console.error(`Failed to process file ${file.name}:`, error);
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file, "utf-8");
      }));

      const results = await Promise.allSettled(uploadPromises);
      const hadErrors = results.some((result) => result.status === 'rejected');

      fileProcessingCompleteRef.current = true;

      if (!hasBulkJson) {
        setIsUploading(false);
        onUploadComplete?.();
        return;
      }

      if (hadErrors) {
        toast.error("One or more files failed to upload. Waiting for the bulk import to finish...");
      }

      notifyFinishedIfComplete();
    } finally {
      if (connection && hasBulkJson) {
        connection.off("BulkUploadProgress", handleProgress);
        connection.off("BulkUploadFinished", handleFinished);
        if (handleSummary) connection.off("BulkUploadSummary", handleSummary);
      }
    }
  }

  function resetState() {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
    setIsUploading(false);
    setUploadProgress({ processed: 0, total: 0, message: '' });
    close();
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold flex justify-between items-center"><span>Upload Chordsheets</span><X size={24} onClick={resetState} className="cursor-pointer text-gray-500 hover:text-gray-600" /></h3>
      <h4 className="text-sm text-gray-500 mb-4">Select files to upload (.chordpro, .cho, .crd, .json)</h4>
      <input id="files" ref={inputRef} className="w-full p-2 border rounded text-lg mb-4" type="file" multiple onChange={handleFileChange} accept=".chordpro,.cho,.crd,.json" disabled={isUploading} />
      {isUploading && (
        <div className="mb-4">
          <progress className="w-full [&::-webkit-progress-value]:bg-gray-500 [&::-webkit-progress-bar]:bg-gray-100" value={uploadProgress.processed} max={uploadProgress.total}></progress>
          <p className="text-sm text-center text-gray-600">{uploadProgress.message} ({uploadProgress.processed} / {uploadProgress.total})</p>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={handleUpload} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={isUploading || files.length === 0}>Upload</button>
        <button onClick={resetState} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Close</button>
      </div>
    </div>
  )
}

export default ChordFilesUploadDialog;