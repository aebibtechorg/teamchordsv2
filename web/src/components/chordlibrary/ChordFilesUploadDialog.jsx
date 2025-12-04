import { useState, useRef } from "react";
import { X } from "lucide-react";
import ChordSheetJS from "chordsheetjs";
import { createChordsheet } from "../../utils/chordsheets";
import { useProfileStore } from "../../store/useProfileStore";

const ChordFilesUploadDialog = ({ isOpen, close }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);
  const { profile } = useProfileStore();

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  }

  const handleUpload = async () => {
    setIsUploading(true);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async () => {
        const parser = new ChordSheetJS.ChordProParser();
        const chordsheet = parser.parse(reader.result);
        await createChordsheet({ title: chordsheet.title || 'Untitled', artist: chordsheet.artist || 'Various', key: chordsheet.key || 'C', content: reader.result, orgId: profile.orgId });
      }
      reader.readAsText(file, "utf-8");
    }
    setFiles([]);
    inputRef.current.value = "";
    setIsUploading(false);
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold flex justify-between items-center"><span>Upload Chordsheets</span><X size={24} onClick={close} className="cursor-pointer text-gray-500 hover:text-gray-600" /></h3>
      <h4 className="text-sm text-gray-500 mb-4">Select files to upload (.chordpro, .cho, .crd)</h4>
      <input id="files" ref={inputRef} className="w-full p-2 border rounded text-lg mb-4" type="file" multiple onChange={handleFileChange} accept=".chordpro,.cho,.crd" />
      <div className="flex justify-end gap-2">
        <button onClick={handleUpload} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={isUploading || files.length === 0}>Upload</button>
        <button onClick={close} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Close</button>
      </div>
    </div>
  )
}

export default ChordFilesUploadDialog;