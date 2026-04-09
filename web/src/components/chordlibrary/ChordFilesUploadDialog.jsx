import { useState, useRef } from "react";
import { X } from "lucide-react";
import ChordSheetJS from "chordsheetjs";
import { createChordsheet, createChordsheetsBulk } from "../../utils/chordsheets";
import { useProfileStore } from "../../store/useProfileStore";

const ChordFilesUploadDialog = ({ connection, isOpen, close, onUploadComplete }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ processed: 0, total: 0, message: '' });
  const inputRef = useRef(null);
  const { profile } = useProfileStore();

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  }

  const handleUpload = async () => {
    setIsUploading(true);
    setUploadProgress({ processed: 0, total: 0, message: 'Starting upload...' });

    if (connection) {
      connection.on("BulkUploadProgress", (processed, total, message) => {
        setUploadProgress({ processed, total, message });
      });
    }

    const uploadPromises = [];
    for (const file of files) {
      const promise = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            if (file.name.endsWith('.json')) {
              const sheets = JSON.parse(reader.result);
              if (Array.isArray(sheets)) {
                const dtos = sheets.map(sheet => ({ ...sheet, orgId: profile.orgId }));
                await createChordsheetsBulk({ dtos, connectionId: connection?.connectionId });
              }
            } else {
              // Try to detect format by attempting parsers in order
              let detectedType = 'ChordPro';
              let parsedSong = null;
              try {
                const tryParsers = [
                  { type: 'ChordPro', parser: new ChordSheetJS.ChordProParser() },
                  { type: 'UltimateGuitar', parser: new ChordSheetJS.UltimateGuitarParser() },
                  { type: 'ChordsOverWords', parser: new ChordSheetJS.ChordsOverWordsParser() }
                ];
                for (const p of tryParsers) {
                  try {
                    const s = p.parser.parse(reader.result);
                    if (s) {
                      detectedType = p.type;
                      parsedSong = s;
                      break;
                    }
                  } catch (e) {
                    // ignore and try next parser
                  }
                }
              } catch (err) {
                // fallback to chordpro
                detectedType = 'ChordPro';
              }

              const title = parsedSong?.title || 'Untitled';
              const artist = parsedSong?.artist || 'Various';
              const key = parsedSong?.key || 'C';

              await createChordsheet({ title, artist, key, content: reader.result, orgId: profile.orgId, sheetType: detectedType });
            }
            resolve();
          } catch (error) {
            console.error(`Failed to process file ${file.name}:`, error);
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file, "utf-8");
      });
      uploadPromises.push(promise);
    }

    await Promise.all(uploadPromises);

    // The backend will notify us when it's truly finished.
    // The UI state will be reset from the ChordLibrary component.
  }

  const resetState = () => {
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
    setIsUploading(false);
    setUploadProgress({ processed: 0, total: 0, message: '' });
    close();
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold flex justify-between items-center"><span>Upload Chordsheets</span><X size={24} onClick={close} className="cursor-pointer text-gray-500 hover:text-gray-600" /></h3>
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
        <button onClick={close} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Close</button>
      </div>
    </div>
  )
}

export default ChordFilesUploadDialog;