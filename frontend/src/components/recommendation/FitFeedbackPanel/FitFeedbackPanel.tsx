import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { FitRating } from '@/api';
import { Icon } from '@/components/icons/Icon';
import '@/styles/recommendation.css';

interface FitFeedbackPanelProps {
  savedRating?: FitRating | null;
  onRating: (fitRating: FitRating) => void;
  isPending?: boolean;
  /** Shown only when “셋팅값 조정필요” is selected. */
  onSavePreferences?: () => void;
  isPreferencesPending?: boolean;
}

export function FitFeedbackPanel({
  savedRating,
  onRating,
  isPending = false,
  onSavePreferences,
  isPreferencesPending = false,
}: FitFeedbackPanelProps) {
  const { t } = useTranslation('machines');
  const goodRef = useRef<HTMLButtonElement>(null);
  const badRef = useRef<HTMLButtonElement>(null);
  const wasPendingRef = useRef(false);
  const showSavePreferences = Boolean(onSavePreferences) && savedRating === 'bad';

  const selectRating = (fitRating: FitRating) => {
    if (isPending) return;
    onRating(fitRating);
  };

  // After the request finishes, restore focus to the selected button.
  useEffect(() => {
    if (isPending) {
      wasPendingRef.current = true;
      return;
    }
    if (!wasPendingRef.current) return;
    wasPendingRef.current = false;
    const target = savedRating === 'good' ? goodRef.current : savedRating === 'bad' ? badRef.current : null;
    target?.focus({ preventScroll: true });
  }, [isPending, savedRating]);

  return (
    <section className="fit-feedback-panel" aria-label={t('feedback.actionsLabel')} aria-busy={isPending}>
      <div className="fit-feedback-panel__header">
        <div className="fit-feedback-panel__intro">
          <h3 className="fit-feedback-panel__title">{t('feedback.title')}</h3>
          <p className="fit-feedback-panel__desc">{t('feedback.desc')}</p>
        </div>
        <div className="fit-feedback-panel__actions" role="group" aria-label={t('feedback.actionsLabel')}>
          <button
            ref={goodRef}
            type="button"
            className={`fit-feedback-panel__icon-btn fit-feedback-panel__icon-btn--good${
              savedRating === 'good' ? ' fit-feedback-panel__icon-btn--active' : ''
            }`}
            onClick={() => selectRating('good')}
            disabled={isPending}
            aria-pressed={savedRating === 'good'}
            aria-label={t('feedback.good')}
            title={t('feedback.good')}
          >
            <Icon name="thumbUp" size={22} />
          </button>
          <button
            ref={badRef}
            type="button"
            className={`fit-feedback-panel__icon-btn fit-feedback-panel__icon-btn--bad${
              savedRating === 'bad' ? ' fit-feedback-panel__icon-btn--active' : ''
            }`}
            onClick={() => selectRating('bad')}
            disabled={isPending}
            aria-pressed={savedRating === 'bad'}
            aria-label={t('feedback.bad')}
            title={t('feedback.bad')}
          >
            <Icon name="thumbDown" size={22} />
          </button>
        </div>
      </div>
      {showSavePreferences ? (
        <div className="fit-feedback-panel__save-row">
          <button
            type="button"
            className="btn btn--primary fit-feedback-panel__save-btn"
            disabled={isPreferencesPending}
            onClick={onSavePreferences}
          >
            {isPreferencesPending ? t('feedback.preferencesSaving') : t('feedback.savePreferences')}
          </button>
        </div>
      ) : null}
      {isPending ? (
        <p className="fit-feedback-panel__pending" aria-live="polite">
          {t('feedback.saving')}
        </p>
      ) : null}
    </section>
  );
}
