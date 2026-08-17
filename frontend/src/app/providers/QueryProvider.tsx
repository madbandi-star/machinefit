import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      retry: false, // axios-client already retries GET network/5xx with backoff
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      // Never auto-retry writes — duplicates risk DB / payment / push side effects.
      retry: false,
    },
  },
});

/** Drop viewer-scoped caches when the logged-in user changes (login/logout/switch). */
function AuthScopedQueryInvalidator() {
  const viewerId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequestsRoot });
    void queryClient.removeQueries({ queryKey: QUERY_KEYS.brandFavorites });
    // Ads/banners are audience + marketing-opt-in scoped; an early anonymous deny
    // must not stick after login (SPA nav would otherwise stay blank until F5).
    void queryClient.removeQueries({ queryKey: ['ads', 'decision'] });
    void queryClient.removeQueries({ queryKey: ['banners', 'public'] });
  }, [viewerId]);

  return null;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthScopedQueryInvalidator />
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
