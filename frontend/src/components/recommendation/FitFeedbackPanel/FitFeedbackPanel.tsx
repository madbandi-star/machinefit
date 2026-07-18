import { useTranslation } from 'react-i18next';
import type { FitRating } from '@/api';
import '@/styles/recommendation.css';

interface FitFeedbackPanelProps {
  savedRating?: FitRating | null;
  onRating: (fitRating: FitRating) => void;
  isPending?: boolean;
}

export function FitFeedbackPanel({ savedRating, onRating, isPending = false }: FitFeedbackPanelProps) {
  const { t } = useTranslation('machines');

  return (
    <section className="fit-feedback-panel" aria-label={t('feedback.title')}>
      <div className="fit-feedback-panel__header">
        <h3 className="fit-feedback-panel__title">{t('feedback.title')}</h3>
        <p className="fit-feedback-panel__desc">{t('feedback.desc')}</p>
      </div>

      <div className="fit-feedback-panel__actions">
        <button
          type="button"
          className={`fit-feedback-panel__btn${savedRating === 'good' ? ' fit-feedback-panel__btn--active' : ''}`}
          onClick={() => onRating('good')}
          disabled={isPending}
          aria-pressed={savedRating === 'good'}
        >
          👍 {t('feedback.good')}
        </button>
        <button
          type="button"
          className={`fit-feedback-panel__btn${savedRating === 'bad' ? ' fit-feedback-panel__btn--active' : ''}`}
          onClick={() => onRating('bad')}
          disabled={isPending}
          aria-pressed={savedRating === 'bad'}
        >
          👎 {t('feedback.bad')}
        </button>
      </div>
    </section>
  );
}
