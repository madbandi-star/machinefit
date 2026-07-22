import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { MachineUserPreferences, RecommendationSettings } from '@machinefit/shared';
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

  return useQuery({
    queryKey: [
      'history-settings-comparison',
      machineCodes,
      recommendationIds,
      preferenceScope?.gymId,
      preferenceScope?.memberId,
    ],
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

      return {
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
    },
    enabled: enabled && (machineCodes.length > 0 || recommendationIds.length > 0),
    staleTime: 60_000,
  });
}
