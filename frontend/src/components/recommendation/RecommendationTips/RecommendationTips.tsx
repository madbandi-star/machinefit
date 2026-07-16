import { useTranslation } from 'react-i18next';
import '@/styles/recommendation.css';

interface RecommendationTipsProps {
  tips: string[];
}

export function RecommendationTips({ tips }: RecommendationTipsProps) {
  const { t } = useTranslation('machines');

  if (tips.length === 0) return null;

  return (
    <aside className="recommendation-tips" role="note" aria-label={t('recommendation.tipsTitle')}>
      <h3 className="recommendation-tips__title">{t('recommendation.tipsTitle')}</h3>
      <ul className="recommendation-tips__list">
        {tips.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>
    </aside>
  );
}
