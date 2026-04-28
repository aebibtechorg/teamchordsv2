import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getProfile, createOrganization } from "../utils/common";
import { useProfileStore } from "../store/useProfileStore";

const Onboarding = () => {
  const { profile, setUserProfile } = useProfileStore();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);
  const profileId = profile?.id || profile?.Id;
  const organizations = profile?.organizations || profile?.Organizations || [];
  const ownsOrganization = organizations.some((o) => (o.ownerUserId || o.OwnerUserId) === profileId);

  // useEffect(() => {
  //   if (profile && (profile.organizations && profile.organizations.length > 0)) {
  //     navigate("/library");
  //   }
  // }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orgName) return;
    setLoading(true);
    try {
      const dataOrg = await createOrganization({ name: orgName });
      if (!dataOrg) {
        console.error("Error creating organization");
        setLoading(false);
        return;
      }

      // Refresh the user/profile from backend so organizations are included
      const updated = await getProfile();
      if (updated) {
        setUserProfile(updated);
        const pendingPlan = localStorage.getItem("pendingPlanCheckout");
        navigate(pendingPlan ? "/pricing?checkout=1" : "/library");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold">Create Organization</h1>
      <p className="text-sm text-gray-500 mb-3">Create an organization to get started.</p>
      {ownsOrganization ? (
        <p className="rounded border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          You already own an organization. You can still join additional organizations through invites.
        </p>
      ) : (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input value={orgName} className="border rounded p-2 mb-3" placeholder="Organization Name" onChange={(e) => setOrgName(e.target.value)} />
        <button className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded disabled:opacity-50" disabled={!orgName}>Create</button>
      </form>
      )}
    </>
  );
};

export default Onboarding;