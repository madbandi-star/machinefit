import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import '@/styles/recommendation.css';

interface RecommendationProTipsProps {
  proTips: string[];
}

export function RecommendationProTips({ proTips }: RecommendationProTipsProps) {
  const { t } = useTranslation('machines');

  if (!proTips?.length) return null;

  const content = proTips.filter(Boolean).join('\n\n').trim();
  if (!content) return null;

  return (
    <details className="recommendation-collapsible recommendation-pro-tips">
      <summary className="recommendation-collapsible__summary">
        <span className="recommendation-collapsible__label recommendation-pro-tips__label">
          {t('recommendation.proTipsTitle')}
        </span>
        <Icon name="chevronDown" size={18} className="recommendation-collapsible__chevron" />
      </summary>
      <div className="recommendation-pro-tips__body">{content}</div>
    </details>
  );
}
