import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RecommendationSettings } from '@machinefit/shared';
import { machinePreferenceApi, recommendationFeedbackApi, type FitRating } from '@/api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/recommendation.css';

interface FitFeedbackPanelProps {
  recommendationId: string;
  machineCode: string;
  settings: RecommendationSettings;
}

const CUSTOM_SETTING_FIELDS: Array<{
  key: keyof RecommendationSettings;
  labelKey: string;
  type?: 'number' | 'text';
}> = [
  { key: 'recommendedWeightKg', labelKey: 'settings.weight', type: 'number' },
  { key: 'seatPosition', labelKey: 'settings.seat', type: 'number' },
  { key: 'backPadPosition', labelKey: 'settings.backPad', type: 'number' },
  { key: 'footPosition', labelKey: 'settings.foot', type: 'number' },
  { key: 'handlePosition', labelKey: 'settings.handle', type: 'number' },
  { key: 'romSetting', labelKey: 'settings.rom', type: 'text' },
];

export function FitFeedbackPanel({
  recommendationId,
  machineCode,
  settings,
}: FitFeedbackPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customSettings, setCustomSettings] = useState<Partial<RecommendationSettings>>({});

  const feedbackQueryKey = ['recommendation-feedback', recommendationId];

  const { data: savedRating } = useQuery({
    queryKey: feedbackQueryKey,
    queryFn: () => recommendationFeedbackApi.get(recommendationId),
  });

  const { data: savedPreferences } = useQuery({
    queryKey: ['machine-preferences', machineCode],
    queryFn: () => machinePreferenceApi.get(machineCode),
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
    onSuccess: async (_data, fitRating) => {
      queryClient.setQueryData(feedbackQueryKey, fitRating);
      if (fitRating === 'bad') {
        setShowCustomForm(true);
        showToast(t('machines:feedback.savedBad'), 'success');
      } else {
        setShowCustomForm(false);
        showToast(t('machines:feedback.savedGood'), 'success');
      }
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
      setShowCustomForm(false);
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

  return (
    <section className="fit-feedback-panel" aria-label={t('machines:feedback.title')}>
      <div className="fit-feedback-panel__header">
        <h3 className="fit-feedback-panel__title">{t('machines:feedback.title')}</h3>
        <p className="fit-feedback-panel__desc">{t('machines:feedback.desc')}</p>
      </div>

      <div className="fit-feedback-panel__actions">
        <button
          type="button"
          className={`fit-feedback-panel__btn${savedRating === 'good' ? ' fit-feedback-panel__btn--active' : ''}`}
          onClick={() => handleRating('good')}
          disabled={feedbackMutation.isPending}
          aria-pressed={savedRating === 'good'}
        >
          👍 {t('machines:feedback.good')}
        </button>
        <button
          type="button"
          className={`fit-feedback-panel__btn${savedRating === 'bad' ? ' fit-feedback-panel__btn--active' : ''}`}
          onClick={() => handleRating('bad')}
          disabled={feedbackMutation.isPending}
          aria-pressed={savedRating === 'bad'}
        >
          👎 {t('machines:feedback.bad')}
        </button>
      </div>

      {(showCustomForm || savedRating === 'bad') && (
        <form
          className="fit-feedback-panel__custom"
          onSubmit={(e) => {
            e.preventDefault();
            preferenceMutation.mutate();
          }}
        >
          <p className="fit-feedback-panel__custom-title">{t('machines:feedback.customTitle')}</p>
          <p className="fit-feedback-panel__custom-desc">{t('machines:feedback.customDesc')}</p>
          <div className="fit-feedback-panel__custom-grid">
            {CUSTOM_SETTING_FIELDS.map((field) => {
              const recommended = settings[field.key];
              if (recommended == null && customSettings[field.key] == null) return null;

              return (
                <label key={field.key} className="fit-feedback-panel__field">
                  {t(`machines:${field.labelKey}`)}
                  <input
                    className="input"
                    type={field.type ?? 'text'}
                    step={field.type === 'number' ? '0.5' : undefined}
                    placeholder={recommended != null ? String(recommended) : undefined}
                    value={
                      customSettings[field.key] != null ? String(customSettings[field.key]) : ''
                    }
                    onChange={(e) =>
                      handleCustomChange(field.key, e.target.value, field.type ?? 'text')
                    }
                  />
                </label>
              );
            })}
          </div>
          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={preferenceMutation.isPending}
          >
            {preferenceMutation.isPending
              ? t('common:actions.submit')
              : t('machines:feedback.savePreferences')}
          </button>
        </form>
      )}
    </section>
  );
}
