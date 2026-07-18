import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RecommendationSettings } from '@machinefit/shared';
import { machinePreferenceApi, recommendationFeedbackApi, type FitRating } from '@/api';
import { useUIStore } from '@/store/ui.store';

interface UseMachineFitFeedbackOptions {
  recommendationId: string;
  machineCode: string;
  enabled?: boolean;
}

export function useMachineFitFeedback({
  recommendationId,
  machineCode,
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
    } else {
      setCustomSettings({});
    }
  }, [savedPreferences]);

  const feedbackMutation = useMutation({
    mutationFn: (fitRating: FitRating) =>
      recommendationFeedbackApi.submit({ recommendationId, fitRating }),
    onSuccess: (_data, fitRating) => {
      queryClient.setQueryData(feedbackQueryKey, fitRating);
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
      showToast(t('machines:feedback.preferencesSaved'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const handleRating = (fitRating: FitRating) => {
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
      [key]: raw.trim() || undefined,
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
