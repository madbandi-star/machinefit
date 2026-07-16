import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import { useRecommendMachine } from '@/hooks/useRecommendMachine';
import '@/styles/recommendation.css';

interface RecommendationActionBarProps {
  machineCode: string;
  onSave: () => void;
  isSaving: boolean;
}

export function RecommendationActionBar({
  machineCode,
  onSave,
  isSaving,
}: RecommendationActionBarProps) {
  const { t } = useTranslation('machines');
  const { requestRecommendation, isPending: isRetrying } = useRecommendMachine(machineCode);

  return (
    <div className="recommendation-action-bar">
      <div className="recommendation-action-bar__row">
        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? '...' : t('recommendation.saveFavorite')}
        </button>
        <button
          type="button"
          className="btn btn--secondary btn--block"
          onClick={() => requestRecommendation()}
          disabled={isRetrying}
        >
          {isRetrying ? '...' : t('recommendation.retryRecommend')}
        </button>
      </div>
      <Link
        to={`${ROUTES.GYMS}?machineCode=${machineCode}`}
        className="btn btn--secondary btn--block"
      >
        {t('recommendation.findGyms')}
      </Link>
    </div>
  );
}
