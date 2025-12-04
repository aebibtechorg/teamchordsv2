import { useEffect, useState, useRef } from "react";
import { getChordsheets } from "../utils/chordsheets";
import ChordLibraryTable from "../components/chordlibrary/ChordLibraryTable";
import ChordFilesUploadDialog from "../components/chordlibrary/ChordFilesUploadDialog";
import { Link } from "react-router-dom";
import { MoreVertical, Plus, Upload, Search } from "lucide-react";
import { useProfileStore } from "../store/useProfileStore";
import { Toaster, toast } from 'react-hot-toast';
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";

const ChordLibrary = () => {
  const [chordsheets, setChordsheets] = useState([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(21);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const { profile } = useProfileStore();
  const debounceTimeout = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Debounce effect to delay API call
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
    const fetchData = async () => {
      const { data, count } = await getChordsheets(profile.orgId, pageIndex, pageSize, debouncedSearchTerm);
      setChordsheets(data);
      setTotalCount(count);
    };
    fetchData().then(() => setIsLoading(false)).catch((err) => toast.error("A network error has occured."));
  }, [pageIndex, pageSize, debouncedSearchTerm, profile.orgId]);

  if (isLoading) {
    return (
        <>
            <Toaster />
            <Spinner />
        </>
    );
  }

  return (
    <>
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
            className="w-full border p-2 pl-10 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        </div>
      </div>

      {chordsheets && (
        <ChordLibraryTable
          data={chordsheets}
          pageIndex={pageIndex}
          setPageIndex={setPageIndex}
          totalCount={totalCount}
          pageSize={pageSize}
        />
      )}

      {isUploadDialogOpen && (
        <Modal onClose={() => setIsUploadDialogOpen(false)}>
          <ChordFilesUploadDialog close={() => setIsUploadDialogOpen(false)} />
        </Modal>
      )}
    </>
  );
};

export default ChordLibrary;
