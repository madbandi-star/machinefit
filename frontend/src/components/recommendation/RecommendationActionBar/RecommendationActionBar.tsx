import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import '@/styles/recommendation.css';

interface RecommendationActionBarProps {
  machineCode: string;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  isFavoritePending: boolean;
  fixed?: boolean;
}

export function RecommendationActionBar({
  isFavorited,
  onToggleFavorite,
  isFavoritePending,
  fixed = false,
}: RecommendationActionBarProps) {
  const { t } = useTranslation('machines');

  const barClass = [
    'recommendation-action-bar',
    fixed ? 'recommendation-action-bar--fixed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={barClass}>
      <div className="recommendation-action-bar__primary-row">
        <button
          type="button"
          className={[
            'btn recommendation-action-bar__save btn--block',
            isFavorited ? 'btn--secondary recommendation-action-bar__save--active' : 'btn--primary',
          ].join(' ')}
          onClick={onToggleFavorite}
          disabled={isFavoritePending}
          aria-pressed={isFavorited}
        >
          <Icon name="heart" size={18} />
          {isFavoritePending
            ? '...'
            : isFavorited
              ? t('recommendation.removeFavorite')
              : t('recommendation.saveFavorite')}
        </button>
      </div>
    </div>
  );
}
