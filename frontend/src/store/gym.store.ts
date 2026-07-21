import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GymScopeId } from '@machinefit/shared';

interface GymState {
  activeGymId: GymScopeId | null;
  activeMemberId: string | null;
  setActiveGymId: (id: GymScopeId | null) => void;
  setActiveMemberId: (id: string | null) => void;
}

export const useGymStore = create<GymState>()(
  persist(
    (set) => ({
      activeGymId: null,
      activeMemberId: null,
      setActiveGymId: (activeGymId) => set({ activeGymId }),
      setActiveMemberId: (activeMemberId) => set({ activeMemberId }),
    }),
    { name: 'machinefit-active-gym' }
  )
);
