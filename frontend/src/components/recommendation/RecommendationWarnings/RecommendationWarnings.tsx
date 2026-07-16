import { useTranslation } from 'react-i18next';
import '@/styles/recommendation.css';

interface RecommendationWarningsProps {
  warnings: string[];
}

export function RecommendationWarnings({ warnings }: RecommendationWarningsProps) {
  const { t } = useTranslation('machines');

  if (warnings.length === 0) return null;

  return (
    <div className="recommendation-warnings" role="alert">
      <strong className="recommendation-warnings__title">
        {t('recommendation.warningsTitle')}
      </strong>
      <ul className="recommendation-warnings__list">
        {warnings.map((warning, i) => (
          <li key={i}>{warning}</li>
        ))}
      </ul>
    </div>
  );
}
