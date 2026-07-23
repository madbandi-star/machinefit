import { useQuery, type QueryClient } from '@tanstack/react-query';
import type { RecommendationSettings } from '@machinefit/shared';

/** Live on-screen 조정값 for history summary 총 볼륨 — never overwritten by prefs refetch. */
export const HISTORY_LIVE_ADJUSTED_PREFS_KEY = ['history-live-adjusted-prefs'] as const;

export type HistoryLiveAdjustedPrefs = Record<string, Partial<RecommendationSettings>>;

export function setHistoryLiveAdjustedPrefs(
  queryClient: QueryClient,
  machineCode: string,
  prefs: Partial<RecommendationSettings>
): void {
  queryClient.setQueryData<HistoryLiveAdjustedPrefs>(
    HISTORY_LIVE_ADJUSTED_PREFS_KEY,
    (prev) => ({
      ...(prev ?? {}),
      [machineCode]: prefs,
    })
  );
}

export function clearHistoryLiveAdjustedPrefs(
  queryClient: QueryClient,
  machineCode: string
): void {
  queryClient.setQueryData<HistoryLiveAdjustedPrefs>(
    HISTORY_LIVE_ADJUSTED_PREFS_KEY,
    (prev) => {
      if (!prev || !(machineCode in prev)) return prev ?? {};
      const next = { ...prev };
      delete next[machineCode];
      return next;
    }
  );
}

/** Subscribe so history summary re-renders when 조정횟수/중량 change on a card. */
export function useHistoryLiveAdjustedPrefs(): HistoryLiveAdjustedPrefs {
  const { data } = useQuery({
    queryKey: HISTORY_LIVE_ADJUSTED_PREFS_KEY,
    queryFn: (): HistoryLiveAdjustedPrefs => ({}),
    staleTime: Infinity,
    gcTime: Infinity,
    initialData: {},
  });
  return data ?? {};
}

export function mergeHistoryPreferences(
  saved: Record<string, Partial<RecommendationSettings>> | undefined,
  live: HistoryLiveAdjustedPrefs
): Record<string, Partial<RecommendationSettings>> {
  const base = { ...(saved ?? {}) };
  for (const [machineCode, prefs] of Object.entries(live)) {
    base[machineCode] = {
      ...(base[machineCode] ?? {}),
      ...prefs,
    };
  }
  return base;
}
