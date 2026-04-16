import { useEffect, useState, useRef } from "react";
import { getChordsheets, deleteChordsheet, backupChordsheets } from "../utils/chordsheets"; // Import backupChordsheets
import ChordLibraryTable from "../components/chordlibrary/ChordLibraryTable";
import ChordFilesUploadDialog from "../components/chordlibrary/ChordFilesUploadDialog";
import { Link } from "react-router-dom";
import { MoreVertical, Plus, Upload, Search, Download } from "lucide-react"; // Import Download icon
import { useProfileStore } from "../store/useProfileStore";
import { HubConnectionBuilder } from "@microsoft/signalr";
import { Toaster, toast } from 'react-hot-toast';
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

const ChordLibrary = () => {
  const [chordsheets, setChordsheets] = useState([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(12);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const { profile } = useProfileStore();
  const [connection, setConnection] = useState(null);
  const debounceTimeout = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // State for ConfirmDialog
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [chordSheetToDeleteId, setChordSheetToDeleteId] = useState(null);

  // Debounce effect to delay API call
  const fetchData = async () => {
    const { data, count } = await getChordsheets(profile.orgId, pageIndex, pageSize, debouncedSearchTerm);
    setChordsheets(data);
    setTotalCount(count);
  };

  const handleUploadComplete = () => {
    setIsUploadDialogOpen(false);
    fetchData().catch((err) => toast.error("A network error has occured."));
  };

  // Function to open the confirmation dialog
  const handleDeleteChordSheet = (id) => {
    setChordSheetToDeleteId(id);
    setIsConfirmDialogOpen(true);
  };

  // Function to perform the actual deletion after confirmation
  const confirmDelete = async () => {
    if (chordSheetToDeleteId) {
      try {
        await deleteChordsheet(chordSheetToDeleteId);
        toast.success("Chord sheet deleted successfully!");
        fetchData().catch((err) => toast.error("A network error has occured."));
      } catch (error) {
        console.error("Error deleting chord sheet:", error);
        toast.error("Failed to delete chord sheet.");
      } finally {
        setChordSheetToDeleteId(null);
        setIsConfirmDialogOpen(false);
      }
    }
  };

  const handleBackup = async () => {
    try {
      const response = await backupChordsheets(profile.orgId);
      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'chordsheets_backup.json';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success("Chord sheets backup downloaded!");
      } else {
        toast.error("Failed to download backup.");
      }
    } catch (error) {
      console.error("Error backing up chord sheets:", error);
      toast.error("A network error has occured during backup.");
    }
  };

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPageIndex(0);
    }, 500); // 500ms delay

    return () => clearTimeout(debounceTimeout.current);
  }, [searchTerm]);

  // Fetch data when search term or pagination changes
  useEffect(() => {
    fetchData().then(() => setIsLoading(false)).catch((err) => {
      toast.error("A network error has occured.");
      setIsLoading(false);
    });
  }, [pageIndex, pageSize, debouncedSearchTerm, profile.orgId]);

  // Initialize and manage SignalR connection
  useEffect(() => {
    const newConnection = new HubConnectionBuilder()
      .withUrl("/hubs/setlists")
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    return () => {
      newConnection.stop().catch(() => {});
    };
  }, []);

  // Listen for SignalR events once connection is established
  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          console.log('SignalR Connected!');
          connection.on("BulkUploadFinished", handleUploadComplete);
        })
        .catch(e => console.error('SignalR Connection failed: ', e));
    }
  }, [connection]);

  if (isLoading) {
    return (
        <>
            <Toaster />
            <Spinner />
        </>
    );
  }

  return (
    <div className="p-4 pb-12">
      <div className="sticky top-0 bg-gray-100">
      <h1 className="w-full flex justify-between mb-4">
        <p className="text-2xl font-bold">Library</p>
        <div className="flex gap-2">
          {/* Full Buttons for Larger Screens */}
          <div className="hidden sm:flex gap-2">
            <Link
              to="/library/new"
              className="border rounded px-2 py-2 bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
            >
              <Plus size={16} />
              New Song
            </Link>
            <button
              onClick={() => setIsUploadDialogOpen(true)}
              className="border rounded px-2 py-2 bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2"
            >
              <Upload size={16} /> Upload
            </button>
            <button
              onClick={handleBackup}
              className="border rounded px-2 py-2 bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
            >
              <Download size={16} /> Backup
            </button>
          </div>

          {/* Ellipsis Menu for Small Screens */}
          <div className="sm:hidden relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="border rounded px-2 py-2 text-gray-500 flex items-center"
            >
              <MoreVertical size={20} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 bg-white border rounded shadow-md w-32 z-10">
                <Link
                  to="/library/new"
                  className="block px-4 py-2 hover:bg-gray-200 text-black text-sm"
                  onClick={() => setMenuOpen(false)}
                >
                  <Plus size={14} className="inline-block mr-2" />
                  New Song
                </Link>
                <button
                  onClick={() => {
                    setIsUploadDialogOpen(true);
                    setMenuOpen(false);
                  }}
                  className="block px-4 py-2 w-full text-left hover:bg-gray-200 text-black text-sm"
                >
                  <Upload size={14} className="inline-block mr-2" />
                  Upload
                </button>
                <button
                  onClick={() => {
                    handleBackup();
                    setMenuOpen(false);
                  }}
                  className="block px-4 py-2 w-full text-left hover:bg-gray-200 text-black text-sm"
                >
                  <Download size={14} className="inline-block mr-2" />
                  Backup
                </button>
              </div>
            )}
          </div>
        </div>
      </h1>

      {/* Search Bar */}
      <div className="flex mb-4">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by title or artist..."
            className="w-full border border-gray-300 bg-white p-2 pl-10 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        </div>
      </div>
      </div>

      {chordsheets && (
        <ChordLibraryTable
          data={chordsheets}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          totalCount={totalCount}
          pageSize={pageSize}
          onDelete={handleDeleteChordSheet}
        />
      )}

      {isUploadDialogOpen && (
        <Modal onClose={() => setIsUploadDialogOpen(false)}>
          <ChordFilesUploadDialog connection={connection} close={() => setIsUploadDialogOpen(false)} onUploadComplete={handleUploadComplete} />
        </Modal>
      )}

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Chord Sheet"
        message="Are you sure you want to delete this chord sheet? This action cannot be undone."
      />
    </div>
  );
};

export default ChordLibrary;
