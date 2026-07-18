import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { RecommendationSettings } from '@machinefit/shared';
import {
  machinePreferenceApi,
  recommendationFeedbackApi,
  type FitRating,
} from '@/api';
import type { HistoryRecordCard } from '@/utils/historyRecordsDisplay';

export interface HistorySettingsComparisonData {
  preferencesByMachine: Record<string, Partial<RecommendationSettings>>;
  feedbackByRecommendation: Record<string, FitRating | null>;
}

export function useHistorySettingsComparisonData(
  cards: HistoryRecordCard[],
  enabled: boolean
) {
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
    queryKey: ['history-settings-comparison', machineCodes, recommendationIds],
    queryFn: async (): Promise<HistorySettingsComparisonData> => {
      const [preferenceEntries, feedbackEntries] = await Promise.all([
        Promise.all(
          machineCodes.map(async (machineCode) => {
            try {
              const customSettings = await machinePreferenceApi.get(machineCode);
              return [machineCode, customSettings ?? {}] as const;
            } catch {
              return [machineCode, {}] as const;
            }
          })
        ),
        Promise.all(
          recommendationIds.map(async (recommendationId) => {
            try {
              const fitRating = await recommendationFeedbackApi.get(recommendationId);
              return [recommendationId, fitRating ?? null] as const;
            } catch {
              return [recommendationId, null] as const;
            }
          })
        ),
      ]);

      return {
        preferencesByMachine: Object.fromEntries(preferenceEntries),
        feedbackByRecommendation: Object.fromEntries(feedbackEntries),
      };
    },
    enabled: enabled && (machineCodes.length > 0 || recommendationIds.length > 0),
    staleTime: 60_000,
  });
}
