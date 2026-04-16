import { useEffect, useState } from "react";
import { useProfileStore } from "../store/useProfileStore";
import { Link } from "react-router-dom";
import { Plus } from 'lucide-react'
import { getSetLists } from "../utils/setlists";
import SetListTable from "../components/setlist/SetListTable";
import { Toaster, toast } from 'react-hot-toast';
import Spinner from "../components/Spinner";
import { Button } from "../components/ui/button";

const SetList = () => {
  const { profile } = useProfileStore();
  const [setLists, setSetLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    const setLists = await getSetLists(profile.orgId);
    setSetLists(setLists);
  };

  useEffect(() => {
    fetchData().then(() => setIsLoading(false)).catch((err) => toast.error(`A network error has occured: ${err}.`));
  }, [profile.orgId]);

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
      <Toaster />
      <h1 className="w-full flex justify-between mb-4">
        <p className="text-2xl font-bold">Set Lists</p>
        <Link to="/setlists/new">
          <Button>
            <Plus size={16} className="mr-2" />
            New Set List
          </Button>
        </Link>
      </h1>
      {setLists && <SetListTable data={setLists} onRefresh={async () => await fetchData()} />}
    </div>
  );
};

export default SetList;