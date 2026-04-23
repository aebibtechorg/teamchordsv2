import { useEffect, useState } from "react";
import { useProfileStore } from "../store/useProfileStore";
import { Link } from "react-router-dom";
import { Plus } from 'lucide-react'
import { getSetLists } from "../utils/setlists";
import SetListTable from "../components/setlist/SetListTable";
import { Toaster, toast } from 'react-hot-toast';
import Spinner from "../components/Spinner";

const SetList = () => {
  const { profile } = useProfileStore();
  const [setLists, setSetLists] = useState([]);
  const [cursorStack, setCursorStack] = useState([]);
  const [currentCursor, setCurrentCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    const { data, nextCursor } = await getSetLists(profile.orgId, { afterCreatedAt: currentCursor?.createdAt, afterId: currentCursor?.id, pageSize: 12 });
    setSetLists(data || []);
    setNextCursor(nextCursor);
  };

  useEffect(() => {
    fetchData().then(() => setIsLoading(false)).catch((err) => toast.error(`A network error has occured: ${err}.`));
  }, [profile.orgId, currentCursor]);

  if (isLoading) {
    return (
      <>
        <Toaster />
        <Spinner />
      </>
    );
  }

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
      {setLists && <SetListTable data={setLists} onRefresh={async () => await fetchData()} hasPrev={cursorStack.length > 0} hasNext={!!nextCursor} onPrev={() => {
        const stack = [...cursorStack];
        const prev = stack.pop() || null;
        setCursorStack(stack);
        setCurrentCursor(prev);
      }} onNext={() => {
        if (!nextCursor) return;
        setCursorStack((s) => [...s, currentCursor]);
        setCurrentCursor(nextCursor);
      }} />}
    </div>
  );
};

export default SetList;