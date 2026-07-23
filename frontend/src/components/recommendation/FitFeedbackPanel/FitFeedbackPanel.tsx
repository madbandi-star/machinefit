import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { FitRating } from '@/api';
import { Icon } from '@/components/icons/Icon';
import '@/styles/recommendation.css';

interface FitFeedbackPanelProps {
  savedRating?: FitRating | null;
  onRating: (fitRating: FitRating) => void;
  isPending?: boolean;
}

export function FitFeedbackPanel({ savedRating, onRating, isPending = false }: FitFeedbackPanelProps) {
  const { t } = useTranslation('machines');
  const goodRef = useRef<HTMLButtonElement>(null);
  const badRef = useRef<HTMLButtonElement>(null);
  const wasPendingRef = useRef(false);

  const selectRating = (fitRating: FitRating) => {
    if (isPending) return;
    onRating(fitRating);
  };

  // After the request finishes, restore focus to the selected button.
  // Native `disabled` during pending moves focus away (often to the sibling).
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
      <div className="fit-feedback-panel__intro">
        <h3 className="fit-feedback-panel__title">{t('feedback.title')}</h3>
        <p className="fit-feedback-panel__desc">{t('feedback.desc')}</p>
      </div>
      <div className="fit-feedback-panel__actions" role="group" aria-label={t('feedback.actionsLabel')}>
        <button
          ref={goodRef}
          type="button"
          className={`fit-feedback-panel__btn${savedRating === 'good' ? ' fit-feedback-panel__btn--active' : ''}`}
          onClick={() => selectRating('good')}
          disabled={isPending}
          aria-pressed={savedRating === 'good'}
        >
          <Icon name="circleCheck" size={20} />
          {t('feedback.good')}
        </button>
        <button
          ref={badRef}
          type="button"
          className={`fit-feedback-panel__btn${savedRating === 'bad' ? ' fit-feedback-panel__btn--active' : ''}`}
          onClick={() => selectRating('bad')}
          disabled={isPending}
          aria-pressed={savedRating === 'bad'}
        >
          <Icon name="sliders" size={20} />
          {t('feedback.bad')}
        </button>
      </div>
      {isPending ? (
        <p className="fit-feedback-panel__pending" aria-live="polite">
          {t('feedback.saving')}
        </p>
      ) : null}
    </section>
  );
}
