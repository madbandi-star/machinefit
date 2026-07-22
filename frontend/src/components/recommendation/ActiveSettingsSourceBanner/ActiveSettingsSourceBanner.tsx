import { useTranslation } from 'react-i18next';
import type { RecommendationSettings, SettingsActiveSource } from '@machinefit/shared';
import { hasMeaningfulCustomSettings } from '@machinefit/shared';
import '@/styles/recommendation.css';

interface ActiveSettingsSourceBannerProps {
  activeSource: SettingsActiveSource;
  aiSettings?: RecommendationSettings | null;
  adjustedSettings?: Partial<RecommendationSettings> | null;
  formatWeight: (kg: number) => string;
  onUseRecommended?: () => void;
  onUseAdjusted?: () => void;
  onClearAdjusted?: () => void;
  isPending?: boolean;
}

export function ActiveSettingsSourceBanner({
  activeSource,
  aiSettings,
  adjustedSettings,
  formatWeight,
  onUseRecommended,
  onUseAdjusted,
  onClearAdjusted,
  isPending = false,
}: ActiveSettingsSourceBannerProps) {
  const { t } = useTranslation('machines');
  const hasAdjusted = hasMeaningfulCustomSettings(adjustedSettings);
  const aiWeight = aiSettings?.recommendedWeightKg;
  const adjustedWeight = adjustedSettings?.recommendedWeightKg;
  // Banner shows the source currently applied for recommendations (activeSource),
  // not the stats-calculation rule (adjusted-first).
  const activeWeight =
    activeSource === 'adjusted' && adjustedWeight != null ? adjustedWeight : aiWeight;

  return (
    <section className="active-source-banner" aria-label={t('feedback.activeSourceLabel')}>
      <p className="active-source-banner__status">
        <span className="active-source-banner__kicker">{t('feedback.currentlyApplied')}</span>
        <strong>
          {activeSource === 'adjusted'
            ? t('feedback.usingAdjustedBadge')
            : t('feedback.usingRecommendedBadge')}
        </strong>
        {activeWeight != null ? (
          <span className="active-source-banner__active-weight">
            {t('feedback.activeWeight', { weight: formatWeight(activeWeight) })}
          </span>
        ) : null}
      </p>

      <div className="active-source-banner__compare">
        <div
          className={`active-source-banner__col${activeSource === 'recommended' ? ' is-active' : ''}`}
        >
          <span className="active-source-banner__col-label">{t('feedback.aiRecommended')}</span>
          <strong>
            {aiWeight != null ? formatWeight(aiWeight) : t('feedback.valueUnavailable')}
          </strong>
        </div>
        <div
          className={`active-source-banner__col${activeSource === 'adjusted' ? ' is-active' : ''}`}
        >
          <span className="active-source-banner__col-label">{t('feedback.userAdjusted')}</span>
          <strong>
            {adjustedWeight != null
              ? formatWeight(adjustedWeight)
              : t('feedback.valueUnavailable')}
          </strong>
        </div>
      </div>

      <div className="active-source-banner__actions">
        {activeSource !== 'recommended' && onUseRecommended ? (
          <button
            type="button"
            className="btn btn--secondary"
            disabled={isPending}
            onClick={onUseRecommended}
          >
            {t('feedback.useRecommended')}
          </button>
        ) : null}
        {activeSource !== 'adjusted' && onUseAdjusted ? (
          <button
            type="button"
            className="btn btn--secondary"
            disabled={isPending}
            onClick={onUseAdjusted}
          >
            {t('feedback.useAdjusted')}
          </button>
        ) : null}
        {hasAdjusted && onClearAdjusted ? (
          <button
            type="button"
            className="btn btn--ghost"
            disabled={isPending}
            onClick={onClearAdjusted}
          >
            {t('feedback.clearAdjusted')}
          </button>
        ) : null}
      </div>
    </section>
  );
}
