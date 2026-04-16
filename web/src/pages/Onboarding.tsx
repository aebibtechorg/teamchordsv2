import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { getProfile, createOrganization } from "../utils/common";
import { useProfileStore } from "../store/useProfileStore";

const Onboarding = () => {
  const { user } = useAuth0();
  const { profile, setUserProfile } = useProfileStore();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [loading, setLoading] = useState(false);

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
        navigate("/library");
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input value={orgName} className="border rounded p-2 mb-3" placeholder="Organization Name" onChange={(e) => setOrgName(e.target.value)} />
        <button className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded disabled:opacity-50" disabled={!orgName}>Create</button>
      </form>
    </>
  );
};

export default Onboarding;