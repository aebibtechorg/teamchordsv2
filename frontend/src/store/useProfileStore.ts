import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserDetailDto } from '../types/api';

export interface UserProfileWithActiveOrg extends UserDetailDto {
  orgId?: string;
}

export interface ProfileStoreState {
  profile: UserProfileWithActiveOrg | null;
  setUserProfile: (user: UserProfileWithActiveOrg | null) => void;
  clearUserProfile: () => void;
  setActiveOrg: (orgId: string | null) => void;
  loadInitialProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileStoreState>((set) => ({
  profile: null,
  loadInitialProfile: async () => {
    try {
      const stored = await AsyncStorage.getItem('profile');
      if (stored) {
        set({ profile: JSON.parse(stored) });
      }
    } catch (e) {
      console.warn('Failed to load profile from storage', e);
    }
  },
  setUserProfile: (user) => {
    if (user) {
      AsyncStorage.setItem('profile', JSON.stringify(user)).catch(() => {});
    } else {
      AsyncStorage.removeItem('profile').catch(() => {});
    }
    set({ profile: user });
  },
  clearUserProfile: () => {
    AsyncStorage.removeItem('profile').catch(() => {});
    set({ profile: null });
  },
  setActiveOrg: (orgId) =>
    set((state) => {
      const p = state.profile ? { ...state.profile, orgId: orgId || undefined } : null;
      if (p) {
        AsyncStorage.setItem('profile', JSON.stringify(p)).catch(() => {});
      }
      return { profile: p };
    }),
}));
