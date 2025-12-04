import { create } from 'zustand';

// Auth0 is the source of truth for session; keep a minimal store for compatibility.
export const useAuthStore = create(() => ({}));
