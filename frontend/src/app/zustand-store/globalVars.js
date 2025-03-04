import { create } from "zustand";

export const useStore = create((set) => ({
  globalState: [],
  setGlobalState: (newValue) => set({ globalState: newValue }),
  updateGlobalState: (newValue) => set((state) => ({ globalState: [...state.globalState, newValue] })),
  resetGlobalState: () => set({ globalState: [] }),
}));
