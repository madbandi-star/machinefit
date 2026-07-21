import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GymState {
  activeGymId: string | null;
  setActiveGymId: (id: string | null) => void;
}

export const useGymStore = create<GymState>()(
  persist(
    (set) => ({
      activeGymId: null,
      setActiveGymId: (activeGymId) => set({ activeGymId }),
    }),
    { name: 'machinefit-active-gym' }
  )
);
