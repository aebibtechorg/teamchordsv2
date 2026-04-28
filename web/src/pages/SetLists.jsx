import { useEffect, useState, useRef } from "react";
import { useProfileStore } from "../store/useProfileStore";
import { Link } from "react-router-dom";
import { Plus, Search } from 'lucide-react'
import { getSetLists } from "../utils/setlists";
import SetListTable from "../components/setlist/SetListTable";
import { Toaster, toast } from 'react-hot-toast';

const SetList = () => {
  const { profile } = useProfileStore();
  const [setLists, setSetLists] = useState([]);
  const [cursorStack, setCursorStack] = useState([]);
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const debounceTimeout = useRef(null);
  const orgId = profile?.orgId;

  const fetchData = async () => {
    if (!orgId) {
      setSetLists([]);
      setNextCursor(null);
      return;
    }

    const { data, nextCursor } = await getSetLists(orgId, { search: debouncedSearchTerm, afterCreatedAt: currentCursor?.createdAt, afterId: currentCursor?.id, pageSize: 12 });
    setSetLists(data || []);
    setNextCursor(nextCursor);
  };

  // Fetch data when org, cursor or debounced search changes
  useEffect(() => {
    if (!orgId) {
      setSetLists([]);
      setNextCursor(null);
      return;
    }

    setIsLoading(true);
    fetchData().then(() => setIsLoading(false)).catch((err) => toast.error(`A network error has occured: ${err}.`));
  }, [currentCursor, debouncedSearchTerm, orgId]);

  // Debounce searchTerm -> debouncedSearchTerm and reset pagination when search changes
  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // reset cursor stack so search starts from first page
      setCursorStack([]);
      setCurrentCursor(null);
    }, 300);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchTerm]);

  // Do not short-circuit render for loading; show inline loading text instead

  return (
    <div className="p-4">
      <Toaster />
      <h1 className="w-full flex justify-between mb-4">
        <p className="text-2xl font-bold">Set Lists</p>
        <Link to="/setlists/new" className="border rounded px-2 py-2 bg-gray-500 hover:bg-gray-600 text-white flex items-center gap-2">
          <Plus size={16} />
          New Set List
        </Link>
      </h1>
      {/* Search Bar */}
      <div className="flex mb-4">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full border border-gray-300 bg-white p-2 pl-10 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        setLists && <SetListTable data={setLists} onRefresh={async () => await fetchData()} hasPrev={cursorStack.length > 0} hasNext={!!nextCursor} onPrev={() => {
          const stack = [...cursorStack];
          const prev = stack.pop() || null;
          setCursorStack(stack);
          setCurrentCursor(prev);
        }} onNext={() => {
          if (!nextCursor) return;
          setCursorStack((s) => [...s, currentCursor]);
          setCurrentCursor(nextCursor);
        }} />
      )}
    </div>
  );
};

export default SetList;