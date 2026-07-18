import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RecommendationSettings } from '@machinefit/shared';
import { roundRecommendWeightKg } from '@machinefit/shared';
import { machinePreferenceApi, recommendationFeedbackApi, type FitRating } from '@/api';
import { useUIStore } from '@/store/ui.store';

interface UseMachineFitFeedbackOptions {
  recommendationId: string;
  machineCode: string;
  recommendedSettings?: RecommendationSettings;
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

  return seeded;
}

export function useMachineFitFeedback({
  recommendationId,
  machineCode,
  recommendedSettings,
  enabled = true,
}: UseMachineFitFeedbackOptions) {
  const { t } = useTranslation(['machines', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [customSettings, setCustomSettings] = useState<Partial<RecommendationSettings>>({});

  const feedbackQueryKey = ['recommendation-feedback', recommendationId];

  const { data: savedRating } = useQuery({
    queryKey: feedbackQueryKey,
    queryFn: () => recommendationFeedbackApi.get(recommendationId),
    enabled,
  });

  const { data: savedPreferences } = useQuery({
    queryKey: ['machine-preferences', machineCode],
    queryFn: () => machinePreferenceApi.get(machineCode),
    enabled,
  });

  useEffect(() => {
    if (savedPreferences) {
      setCustomSettings(savedPreferences);
      return;
    }

    setCustomSettings({});
  }, [savedPreferences]);

  useEffect(() => {
    if (savedRating !== 'bad' || !recommendedSettings) return;

    setCustomSettings((prev) => {
      if (savedPreferences && Object.keys(savedPreferences).length > 0) {
        return savedPreferences;
      }
      if (Object.keys(prev).length > 0) return prev;
      return seedCustomSettingsFromRecommendation(recommendedSettings);
    });
  }, [savedRating, recommendedSettings, savedPreferences]);

  const feedbackMutation = useMutation({
    mutationFn: (fitRating: FitRating) =>
      recommendationFeedbackApi.submit({ recommendationId, fitRating }),
    onSuccess: async (_data, fitRating) => {
      queryClient.setQueryData(feedbackQueryKey, fitRating);
      await queryClient.invalidateQueries({ queryKey: ['history-settings-comparison'] });
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
    mutationFn: () =>
      machinePreferenceApi.upsert({
        machineCode,
        customSettings,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['machine-preferences', machineCode] });
      await queryClient.invalidateQueries({ queryKey: ['history-settings-comparison'] });
      showToast(t('machines:feedback.preferencesSaved'), 'success');
    },
    onError: () => showToast(t('machines:feedback.preferencesSaveFailed'), 'error'),
  });

  const handleRating = (fitRating: FitRating) => {
    if (fitRating === 'bad' && recommendedSettings) {
      setCustomSettings((prev) => {
        if (savedPreferences && Object.keys(savedPreferences).length > 0) {
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

  const showAdjustment = savedRating === 'bad';

  return {
    savedRating,
    customSettings,
    showAdjustment,
    handleRating,
    handleCustomChange,
    savePreferences: () => preferenceMutation.mutate(),
    isFeedbackPending: feedbackMutation.isPending,
    isPreferencesPending: preferenceMutation.isPending,
  };
}
