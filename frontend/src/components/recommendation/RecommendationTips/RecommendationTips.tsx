import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import '@/styles/recommendation.css';

interface RecommendationTipsProps {
  tips: string[];
}

export function RecommendationTips({ tips }: RecommendationTipsProps) {
  const { t } = useTranslation('machines');

  if (tips.length === 0) return null;

  return (
    <details className="recommendation-collapsible recommendation-tips">
      <summary className="recommendation-collapsible__summary">
        <span className="recommendation-collapsible__label">
          {t('recommendation.tipsTitle')}
          <span className="recommendation-collapsible__count">{tips.length}</span>
        </span>
        <Icon name="chevronDown" size={18} className="recommendation-collapsible__chevron" />
      </summary>
      <ul className="recommendation-tips__list">
        {tips.map((tip, i) => (
          <li key={i}>{tip}</li>
        ))}
      </ul>
    </details>
  );
}
