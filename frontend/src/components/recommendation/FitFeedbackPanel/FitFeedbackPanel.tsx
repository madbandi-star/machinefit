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

  return (
    <section className="fit-feedback-panel" aria-label={t('feedback.actionsLabel')}>
      <div className="fit-feedback-panel__actions" role="group" aria-label={t('feedback.actionsLabel')}>
        <button
          type="button"
          className={`fit-feedback-panel__btn${savedRating === 'good' ? ' fit-feedback-panel__btn--active' : ''}`}
          onClick={() => onRating('good')}
          disabled={isPending}
          aria-pressed={savedRating === 'good'}
        >
          <Icon name="thumbUp" size={18} />
          {t('feedback.good')}
        </button>
        <button
          type="button"
          className={`fit-feedback-panel__btn${savedRating === 'bad' ? ' fit-feedback-panel__btn--active' : ''}`}
          onClick={() => onRating('bad')}
          disabled={isPending}
          aria-pressed={savedRating === 'bad'}
        >
          <Icon name="thumbDown" size={18} />
          {t('feedback.bad')}
        </button>
      </div>
    </section>
  );
}
