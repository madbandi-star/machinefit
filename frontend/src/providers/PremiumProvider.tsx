import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubscriptionStatusView } from '@machinefit/shared';
import { billingApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';

type PremiumContextValue = {
  status: SubscriptionStatusView | undefined;
  isPremium: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: QUERY_KEYS.subscriptionStatus,
    queryFn: async () => (await billingApi.getStatus()).data.data,
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptionStatus });
  }, [queryClient]);

  const value = useMemo<PremiumContextValue>(
    () => ({
      status: statusQuery.data,
      isPremium: Boolean(statusQuery.data?.isPremium),
      isLoading: statusQuery.isLoading,
      refresh,
    }),
    [statusQuery.data, statusQuery.isLoading, refresh]
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium(): PremiumContextValue {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    return {
      status: undefined,
      isPremium: false,
      isLoading: false,
      refresh: async () => undefined,
    };
  }
  return ctx;
}
