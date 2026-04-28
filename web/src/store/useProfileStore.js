import { create } from 'zustand';

const getProfileFromStorage = () => {
  const profile = localStorage.getItem('profile');
  return profile ? JSON.parse(profile) : null;
};

export const useProfileStore = create((set) => ({
  profile: getProfileFromStorage(),
  setUserProfile: (user) => {
    if (user) {
      localStorage.setItem('profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('profile');
    }
    set({ profile: user });
  },
  clearUserProfile: () => {
    localStorage.removeItem('profile');
    set({ profile: null });
  },
  setActiveOrg: (orgId) => set((state) => {
    const p = state.profile ? { ...state.profile, orgId } : null;
    if (p) localStorage.setItem('profile', JSON.stringify(p));
    return { profile: p };
  })
}));
