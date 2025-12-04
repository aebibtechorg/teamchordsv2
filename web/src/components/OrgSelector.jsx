import React, { useEffect } from 'react';
import { useProfileStore } from '../store/useProfileStore';

const OrgSelector = ({ className = '' }) => {
  const { profile, setActiveOrg } = useProfileStore();

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
    setActiveOrg(id);
  };

  if (!orgs || orgs.length === 0) return null;

  return (
    <select
      className={`w-full text-sm rounded px-2 py-1 bg-gray-600 text-white ${className}`}
      value={active || ''}
      onChange={handleChange}
    >
      {orgs.map((o) => (
        <option key={o.id || o.Id} value={o.id || o.Id}>
          {o.name || o.Name}
        </option>
      ))}
    </select>
  );
};

export default OrgSelector;
