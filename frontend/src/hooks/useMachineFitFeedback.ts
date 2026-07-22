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
  const activeSource: SettingsActiveSource =
    machinePreferences?.activeSource ??
    initialActiveSource ??
    (savedRating === 'bad' ? 'adjusted' : 'recommended');

  useEffect(() => {
    if (savedPreferences && hasMeaningfulCustomSettings(savedPreferences)) {
      setCustomSettings(savedPreferences);
      return;
    }
    setCustomSettings({});
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
      clearAdjusted?: boolean;
    }) =>
      machinePreferenceApi.upsert({
        machineCode,
        ...preferenceScope,
        ...input,
      }),
    onSuccess: async (_data, variables) => {
      await invalidateRelated();
      if (variables.clearAdjusted) {
        showToast(t('machines:feedback.adjustedCleared'), 'success');
        return;
      }
      if (variables.activeSource === 'recommended') {
        showToast(t('machines:feedback.usingRecommended'), 'success');
        return;
      }
      if (variables.activeSource === 'adjusted') {
        showToast(t('machines:feedback.usingAdjusted'), 'success');
        return;
      }
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

  const hasSavedPreferences = hasMeaningfulCustomSettings(savedPreferences);
  const showAdjustment = activeSource === 'adjusted' || savedRating === 'bad';

  return {
    savedRating,
    customSettings,
    activeSource,
    showAdjustment,
    hasSavedPreferences,
    handleRating,
    handleCustomChange,
    savePreferences: (onDone?: () => void) =>
      preferenceMutation.mutate(
        { customSettings, activeSource: 'adjusted' },
        {
          onSuccess: () => {
            queryClient.setQueryData(feedbackQueryKey, 'bad');
            onDone?.();
          },
        }
      ),
    useRecommended: () => {
      feedbackMutation.mutate('good');
    },
    useAdjusted: () => {
      if (!hasSavedPreferences && recommendedSettings) {
        const seeded = seedCustomSettingsFromRecommendation(recommendedSettings);
        setCustomSettings(seeded);
        preferenceMutation.mutate(
          { customSettings: seeded, activeSource: 'adjusted' },
          {
            onSuccess: () => {
              queryClient.setQueryData(feedbackQueryKey, 'bad');
            },
          }
        );
        return;
      }
      feedbackMutation.mutate('bad');
    },
    clearAdjusted: () => {
      setCustomSettings({});
      preferenceMutation.mutate(
        { clearAdjusted: true },
        {
          onSuccess: () => {
            queryClient.setQueryData(feedbackQueryKey, 'good');
          },
        }
      );
    },
    isFeedbackPending: feedbackMutation.isPending,
    isPreferencesPending: preferenceMutation.isPending,
  };
}
