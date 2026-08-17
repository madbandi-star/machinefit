import { create } from 'zustand';

export type NetworkBannerKind = 'offline' | 'syncing' | 'synced' | null;

type NetworkSyncState = {
  online: boolean;
  pendingCount: number;
  banner: NetworkBannerKind;
  setOnline: (online: boolean) => void;
  setPendingCount: (n: number) => void;
  setBanner: (banner: NetworkBannerKind) => void;
};

export const useNetworkSyncStore = create<NetworkSyncState>((set) => ({
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  pendingCount: 0,
  banner: null,
  setOnline: (online) =>
    set((s) => ({
      online,
      banner: !online ? 'offline' : s.pendingCount > 0 ? 'syncing' : s.banner === 'offline' ? 'syncing' : s.banner,
    })),
  setPendingCount: (pendingCount) =>
    set((s) => ({
      pendingCount,
      banner: !s.online
        ? 'offline'
        : pendingCount > 0
          ? 'syncing'
          : s.banner === 'syncing'
            ? 'synced'
            : s.banner,
    })),
  setBanner: (banner) => set({ banner }),
}));
