import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user, hydrated: true }),
  clear: () => set({ user: null, hydrated: true }),
}));
