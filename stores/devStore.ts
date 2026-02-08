import { create } from 'zustand';

interface DevState {
  devMode: boolean;
  setDevMode: (enabled: boolean) => void;
}

export const useDevStore = create<DevState>((set) => ({
  devMode: false,
  setDevMode: (enabled) => set({ devMode: enabled }),
}));
