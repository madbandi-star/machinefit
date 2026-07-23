import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { MachineUserPreferences, RecommendationSettings } from '@machinefit/shared';
import { hasMeaningfulCustomSettings } from '@machinefit/shared';
import {
  machinePreferenceApi,
  recommendationFeedbackApi,
  type FitRating,
  type MachinePreferencesResponse,
} from '@/api';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import type { HistoryRecordCard } from '@/utils/historyRecordsDisplay';

export interface HistorySettingsComparisonData {
  preferencesByMachine: Record<string, Partial<RecommendationSettings>>;
  activeSourceByMachine: Record<string, MachineUserPreferences['activeSource']>;
  feedbackByRecommendation: Record<string, FitRating | null>;
}

export function useHistorySettingsComparisonData(
  cards: HistoryRecordCard[],
  enabled: boolean
) {
  const queryClient = useQueryClient();
  const { activeGymId } = useActiveGym();
  const { activeMemberId, isRealGym } = useActiveMember();
  const preferenceScope =
    isRealGym && activeGymId && activeMemberId
      ? { gymId: activeGymId, memberId: activeMemberId }
      : undefined;

  const machineCodes = useMemo(
    () => [...new Set(cards.map((card) => card.machineCode))],
    [cards]
  );

  const recommendationIds = useMemo(
    () =>
      [
        ...new Set(
          cards
            .map((card) => card.recommendationId)
            .filter((id): id is string => Boolean(id))
        ),
      ],
    [cards]
  );

  const queryKey = useMemo(
    () => [
      'history-settings-comparison',
      machineCodes,
      recommendationIds,
      preferenceScope?.gymId,
      preferenceScope?.memberId,
    ],
    [machineCodes, recommendationIds, preferenceScope?.gymId, preferenceScope?.memberId]
  );

  return useQuery({
    queryKey,
    queryFn: async (): Promise<HistorySettingsComparisonData> => {
      const emptyPreferencesByMachine = Object.fromEntries(
        machineCodes.map((machineCode) => [machineCode, null])
      ) as Record<string, MachinePreferencesResponse | null>;
      const emptyFeedbackByRecommendation = Object.fromEntries(
        recommendationIds.map((recommendationId) => [recommendationId, null])
      ) as Record<string, FitRating | null>;

      const [preferencesByMachineResponse, feedbackByRecommendationResponse] =
        await Promise.all([
          machineCodes.length > 0
            ? machinePreferenceApi
                .getBatch(machineCodes, preferenceScope)
                .catch(() => emptyPreferencesByMachine)
            : Promise.resolve(emptyPreferencesByMachine),
          recommendationIds.length > 0
            ? recommendationFeedbackApi
                .getBatch(recommendationIds)
                .catch(() => emptyFeedbackByRecommendation)
            : Promise.resolve(emptyFeedbackByRecommendation),
        ]);

      const fromServer: HistorySettingsComparisonData = {
        preferencesByMachine: Object.fromEntries(
          machineCodes.map((machineCode) => [
            machineCode,
            preferencesByMachineResponse[machineCode]?.customSettings ?? {},
          ])
        ),
        activeSourceByMachine: Object.fromEntries(
          machineCodes.map((machineCode) => [
            machineCode,
            preferencesByMachineResponse[machineCode]?.activeSource ?? 'recommended',
          ])
        ),
        feedbackByRecommendation: Object.fromEntries(
          recommendationIds.map((recommendationId) => [
            recommendationId,
            feedbackByRecommendationResponse[recommendationId] ?? null,
          ])
        ),
      };

      // Keep live 조정횟수/중량 patches over a stale refetch (same race as machine prefs).
      const cached = queryClient.getQueryData<HistorySettingsComparisonData>(queryKey);
      if (!cached?.preferencesByMachine) return fromServer;

      const preferencesByMachine = { ...fromServer.preferencesByMachine };
      const activeSourceByMachine = { ...fromServer.activeSourceByMachine };
      for (const machineCode of machineCodes) {
        const local = cached.preferencesByMachine[machineCode];
        if (!hasMeaningfulCustomSettings(local)) continue;
        preferencesByMachine[machineCode] = {
          ...(fromServer.preferencesByMachine[machineCode] ?? {}),
          ...local,
        };
        if (cached.activeSourceByMachine?.[machineCode]) {
          activeSourceByMachine[machineCode] = cached.activeSourceByMachine[machineCode];
        }
      }

      return {
        ...fromServer,
        preferencesByMachine,
        activeSourceByMachine,
      };
    },
    enabled: enabled && (machineCodes.length > 0 || recommendationIds.length > 0),
    staleTime: 60_000,
  });
}
