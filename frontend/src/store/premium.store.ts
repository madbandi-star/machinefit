import { create } from 'zustand';

interface PremiumState {
  premiumModalOpen: boolean;
  openPremiumModal: () => void;
  closePremiumModal: () => void;
}

export const usePremiumStore = create<PremiumState>((set) => ({
  premiumModalOpen: false,
  openPremiumModal: () => set({ premiumModalOpen: true }),
  closePremiumModal: () => set({ premiumModalOpen: false }),
}));
