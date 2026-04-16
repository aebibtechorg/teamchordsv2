import { useEffect, useState } from 'react';
import { useProfileStore } from '../store/useProfileStore';
import Onboarding from '../pages/Onboarding';
import Modal from './Modal';

const OrgSelector = ({ className = '' }) => {
  const { profile, setActiveOrg } = useProfileStore();
  const [isOpenCreateOrg, setIsOpenCreateOrg] = useState(() => false);

  useEffect(() => {
    // If no active org is set, set it to the first organization
    if (profile) {
      const orgs = profile.organizations || profile.Organizations || [];
      if (orgs.length > 0) {
        const active = profile.orgId || (orgs[0].id || orgs[0].Id);
        if (!profile.orgId) {
          setActiveOrg(active);
        }
      }
    }
  }, [profile, setActiveOrg]);

  if (!profile) return null;

  // profile may include `organizations` array from /api/users/me
  const orgs = profile.organizations || profile.Organizations || [];
  const active = profile.orgId || (orgs.length ? orgs[0].id || orgs[0].Id || null : null);

  const handleChange = (e) => {
    const id = e.target.value || null;
    if (id == 'create-new') {
      setIsOpenCreateOrg(true);
      setActiveOrg((previous) => previous);
    } else {
      setActiveOrg(id);
    }
  };

  if (!orgs || orgs.length === 0) return null;

  return (
    <>
    <select
      className={`w-full text-sm rounded px-2 py-1${className}`}
      value={active || ''}
      onChange={handleChange}
    >
      {orgs.map((o) => (
        <option key={o.id || o.Id} value={o.id || o.Id}>
          {o.name || o.Name}
        </option>
      ))}
      <option value="create-new">Create new</option>
    </select>
    {isOpenCreateOrg && (<Modal onClose={() => setIsOpenCreateOrg(false)}>
      <div className="p-4">
        <Onboarding />
      </div>
    </Modal>)}
    </>
  );
};

export default OrgSelector;
