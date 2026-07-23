import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RecommendationSettings, SettingsActiveSource } from '@machinefit/shared';
import { hasMeaningfulCustomSettings, roundRecommendWeightKg } from '@machinefit/shared';
import {
  machinePreferenceApi,
  recommendationFeedbackApi,
  type FitRating,
} from '@/api';
import { useUIStore } from '@/store/ui.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';

interface UseMachineFitFeedbackOptions {
  recommendationId: string;
  machineCode: string;
  recommendedSettings?: RecommendationSettings;
  /** Initial active source from the recommendation response when available. */
  initialActiveSource?: SettingsActiveSource;
  enabled?: boolean;
}

function seedCustomSettingsFromRecommendation(
  settings: RecommendationSettings
): Partial<RecommendationSettings> {
  const seeded: Partial<RecommendationSettings> = {
    seatPosition: settings.seatPosition,
    backPadPosition: settings.backPadPosition,
    footPosition: settings.footPosition,
    handlePosition: settings.handlePosition,
    romSetting: settings.romSetting,
  };

  if (settings.recommendedWeightKg != null) {
    seeded.recommendedWeightKg = roundRecommendWeightKg(settings.recommendedWeightKg);
  }
  if (settings.recommendedRepsMin != null) {
    seeded.recommendedRepsMin = settings.recommendedRepsMin;
  }
  if (settings.recommendedRepsMax != null) {
    seeded.recommendedRepsMax = settings.recommendedRepsMax;
  }

  return seeded;
}

export function useMachineFitFeedback({
  recommendationId,
  machineCode,
  recommendedSettings,
  initialActiveSource,
  enabled = true,
}: UseMachineFitFeedbackOptions) {
  const { t } = useTranslation(['machines', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const { activeGymId } = useActiveGym();
  const { activeMemberId, isRealGym } = useActiveMember();
  const [customSettings, setCustomSettings] = useState<Partial<RecommendationSettings>>({});

  const preferenceScope =
    isRealGym && activeGymId && activeMemberId
      ? { gymId: activeGymId, memberId: activeMemberId }
      : undefined;

  const feedbackQueryKey = ['recommendation-feedback', recommendationId];
  const prefsQueryKey = ['machine-preferences', machineCode, preferenceScope?.gymId, preferenceScope?.memberId];

  const { data: savedRating } = useQuery({
    queryKey: feedbackQueryKey,
    queryFn: () => recommendationFeedbackApi.get(recommendationId),
    enabled,
  });

  const { data: machinePreferences } = useQuery({
    queryKey: prefsQueryKey,
    queryFn: () => machinePreferenceApi.get(machineCode, preferenceScope),
    enabled,
  });

  const savedPreferences = machinePreferences?.customSettings;
  const hasSavedPreferences = hasMeaningfulCustomSettings(savedPreferences);

  // UI source for banner/highlight.
  // Explicit fit rating wins: "추천값 잘맞음" must not keep adjusted UI just because
  // machine prefs still have activeSource=adjusted (or briefly lag after save).
  const activeSource: SettingsActiveSource = (() => {
    if (savedRating === 'good') return 'recommended';
    const stored = machinePreferences?.activeSource;
    if (stored === 'adjusted') return 'adjusted';
    if (
      savedRating === 'bad' &&
      (hasMeaningfulCustomSettings(customSettings) || hasSavedPreferences)
    ) {
      return 'adjusted';
    }
    return stored ?? initialActiveSource ?? (savedRating === 'bad' ? 'adjusted' : 'recommended');
  })();

  useEffect(() => {
    if (savedPreferences && hasMeaningfulCustomSettings(savedPreferences)) {
      setCustomSettings(savedPreferences);
    }
    // Do not clear local edits when the server still has no prefs (e.g. right after
    // tapping "needs adjustment" — invalidate would otherwise wipe seeded inputs).
  }, [savedPreferences]);

  useEffect(() => {
    if (activeSource !== 'adjusted' || !recommendedSettings) return;

    setCustomSettings((prev) => {
      if (savedPreferences && hasMeaningfulCustomSettings(savedPreferences)) {
        return savedPreferences;
      }
      if (Object.keys(prev).length > 0) return prev;
      return seedCustomSettingsFromRecommendation(recommendedSettings);
    });
  }, [activeSource, recommendedSettings, savedPreferences]);

  const invalidateRelated = async () => {
    await queryClient.invalidateQueries({ queryKey: prefsQueryKey });
    await queryClient.invalidateQueries({ queryKey: ['history-settings-comparison'] });
  };

  const feedbackMutation = useMutation({
    mutationFn: (fitRating: FitRating) =>
      recommendationFeedbackApi.submit({
        recommendationId,
        fitRating,
        ...preferenceScope,
      }),
    onSuccess: async (_data, fitRating) => {
      queryClient.setQueryData(feedbackQueryKey, fitRating);
      const nextSource: SettingsActiveSource = fitRating === 'bad' ? 'adjusted' : 'recommended';
      queryClient.setQueryData(prefsQueryKey, (prev: unknown) => {
        const current = (prev && typeof prev === 'object' ? prev : {}) as {
          customSettings?: Partial<RecommendationSettings>;
          personalTipMemo?: string;
          activeSource?: SettingsActiveSource;
        };
        return {
          customSettings: current.customSettings ?? {},
          personalTipMemo: current.personalTipMemo ?? '',
          activeSource: nextSource,
        };
      });
      await invalidateRelated();
      showToast(
        fitRating === 'bad'
          ? t('machines:feedback.savedBad')
          : t('machines:feedback.savedGood'),
        'success'
      );
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const preferenceMutation = useMutation({
    mutationFn: (input: {
      customSettings?: Partial<RecommendationSettings>;
      activeSource?: SettingsActiveSource;
    }) =>
      machinePreferenceApi.upsert({
        machineCode,
        ...preferenceScope,
        ...input,
      }),
    onSuccess: async (data, variables) => {
      const nextSource: SettingsActiveSource =
        variables.activeSource ?? data.activeSource ?? 'adjusted';
      queryClient.setQueryData(prefsQueryKey, {
        customSettings: data.customSettings ?? variables.customSettings ?? {},
        personalTipMemo: data.personalTipMemo ?? '',
        activeSource: nextSource,
      });
      if (variables.customSettings) {
        setCustomSettings(variables.customSettings);
      }
      await invalidateRelated();
      // Keep history summary prefs in sync immediately after 조정값 저장.
      queryClient.setQueriesData(
        { queryKey: ['history-settings-comparison'] },
        (prev: unknown) => {
          if (!prev || typeof prev !== 'object') return prev;
          const row = prev as {
            preferencesByMachine?: Record<string, Partial<RecommendationSettings>>;
            activeSourceByMachine?: Record<string, SettingsActiveSource>;
            feedbackByRecommendation?: Record<string, FitRating | null>;
          };
          if (!row.preferencesByMachine) return prev;
          const nextPrefs = { ...row.preferencesByMachine };
          if (variables.customSettings) {
            nextPrefs[machineCode] = variables.customSettings;
          }
          const nextActive = { ...(row.activeSourceByMachine ?? {}) };
          nextActive[machineCode] = nextSource;
          return {
            ...row,
            preferencesByMachine: nextPrefs,
            activeSourceByMachine: nextActive,
          };
        }
      );
      showToast(t('machines:feedback.preferencesSaved'), 'success');
    },
    onError: () => showToast(t('machines:feedback.preferencesSaveFailed'), 'error'),
  });

  const handleRating = (fitRating: FitRating) => {
    if (fitRating === 'bad' && recommendedSettings) {
      setCustomSettings((prev) => {
        if (savedPreferences && hasMeaningfulCustomSettings(savedPreferences)) {
          return savedPreferences;
        }
        if (Object.keys(prev).length > 0) return prev;
        return seedCustomSettingsFromRecommendation(recommendedSettings);
      });
    }
    feedbackMutation.mutate(fitRating);
  };

  const handleCustomChange = (
    key: keyof RecommendationSettings,
    raw: string,
    type: 'number' | 'text' = 'text'
  ) => {
    if (type === 'number') {
      const parsed = raw === '' ? undefined : Number.parseFloat(raw);
      setCustomSettings((prev) => ({
        ...prev,
        [key]: parsed != null && Number.isFinite(parsed) ? parsed : undefined,
      }));
      return;
    }

    setCustomSettings((prev) => ({
      ...prev,
      [key]: raw.trim(),
    }));
  };

  // Only show 추천/조정 비교 when NOT on "추천값 잘맞음".
  // Saved adjusted weights may still exist in prefs, but good rating means AI-only UI.
  const showAdjustment =
    savedRating !== 'good' && (savedRating === 'bad' || activeSource === 'adjusted');
  const displayAdjustedSettings = showAdjustment
    ? hasMeaningfulCustomSettings(customSettings)
      ? customSettings
      : hasSavedPreferences
        ? savedPreferences
        : undefined
    : undefined;

  return {
    savedRating,
    customSettings,
    displayAdjustedSettings,
    activeSource,
    showAdjustment,
    hasSavedPreferences,
    handleRating,
    handleCustomChange,
    savePreferences: (onDone?: () => void) =>
      preferenceMutation.mutate(
        { customSettings, activeSource: 'adjusted' },
        {
          onSuccess: (data) => {
            queryClient.setQueryData(feedbackQueryKey, 'bad');
            queryClient.setQueryData(prefsQueryKey, {
              customSettings: data.customSettings ?? customSettings,
              personalTipMemo: data.personalTipMemo ?? '',
              activeSource: 'adjusted' as SettingsActiveSource,
            });
            onDone?.();
          },
        }
      ),
    isFeedbackPending: feedbackMutation.isPending,
    isPreferencesPending: preferenceMutation.isPending,
  };
}
