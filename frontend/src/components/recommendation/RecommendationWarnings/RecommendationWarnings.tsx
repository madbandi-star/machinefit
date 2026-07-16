import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import '@/styles/recommendation.css';

interface RecommendationWarningsProps {
  warnings: string[];
}

export function RecommendationWarnings({ warnings }: RecommendationWarningsProps) {
  const { t } = useTranslation('machines');

  if (warnings.length === 0) return null;

  const preview = warnings[0];
  const extraCount = warnings.length - 1;

  return (
    <details className="recommendation-collapsible recommendation-warnings" open>
      <summary className="recommendation-collapsible__summary">
        <span className="recommendation-collapsible__label recommendation-warnings__summary-text">
          <span className="recommendation-warnings__badge">{t('recommendation.warningsTitle')}</span>
          <span className="recommendation-warnings__preview">{preview}</span>
          {extraCount > 0 && (
            <span className="recommendation-collapsible__count">+{extraCount}</span>
          )}
        </span>
        <Icon name="chevronDown" size={18} className="recommendation-collapsible__chevron" />
      </summary>
      <ul className="recommendation-warnings__list">
        {warnings.map((warning, i) => (
          <li key={i}>{warning}</li>
        ))}
      </ul>
    </details>
  );
}
