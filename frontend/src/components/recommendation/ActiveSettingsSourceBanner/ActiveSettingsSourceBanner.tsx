import { useTranslation } from 'react-i18next';
import type { RecommendationSettings, SettingsActiveSource } from '@machinefit/shared';
import '@/styles/recommendation.css';

interface ActiveSettingsSourceBannerProps {
  activeSource: SettingsActiveSource;
  aiSettings?: RecommendationSettings | null;
  adjustedSettings?: Partial<RecommendationSettings> | null;
  formatWeight: (kg: number) => string;
  pendingAdjustment?: boolean;
  /** When false, only the AI recommended value is shown (e.g. 추천값 잘맞음). */
  showAdjustedCompare?: boolean;
}

export function ActiveSettingsSourceBanner({
  activeSource,
  aiSettings,
  adjustedSettings,
  formatWeight,
  pendingAdjustment = false,
  showAdjustedCompare = true,
}: ActiveSettingsSourceBannerProps) {
  const { t } = useTranslation('machines');
  const aiWeight = aiSettings?.recommendedWeightKg;
  const adjustedWeight = adjustedSettings?.recommendedWeightKg;
  const showCompare = showAdjustedCompare && activeSource === 'adjusted';
  // Banner shows the source currently applied for recommendations (activeSource),
  // not the stats-calculation rule (adjusted-first).
  const activeWeight =
    showCompare && adjustedWeight != null ? adjustedWeight : aiWeight;
  const adjustedLabel =
    adjustedWeight != null
      ? formatWeight(adjustedWeight)
      : pendingAdjustment || activeSource === 'adjusted'
        ? t('feedback.adjustedPending')
        : t('feedback.valueUnavailable');

  return (
    <section className="active-source-banner" aria-label={t('feedback.activeSourceLabel')}>
      <p className="active-source-banner__status">
        <span className="active-source-banner__kicker">{t('feedback.currentlyApplied')}</span>
        <strong>
          {showCompare
            ? t('feedback.usingAdjustedBadge')
            : t('feedback.usingRecommendedBadge')}
        </strong>
        {activeWeight != null ? (
          <span className="active-source-banner__active-weight">
            {t('feedback.activeWeight', { weight: formatWeight(activeWeight) })}
          </span>
        ) : null}
      </p>

      {showCompare ? (
        <div className="active-source-banner__compare">
          <div className="active-source-banner__col">
            <span className="active-source-banner__col-label">{t('feedback.aiRecommended')}</span>
            <strong>
              {aiWeight != null ? formatWeight(aiWeight) : t('feedback.valueUnavailable')}
            </strong>
          </div>
          <div className="active-source-banner__col is-active">
            <span className="active-source-banner__col-label">{t('feedback.userAdjusted')}</span>
            <strong className={adjustedWeight == null ? 'is-muted' : undefined}>{adjustedLabel}</strong>
          </div>
        </div>
      ) : (
        <div className="active-source-banner__compare active-source-banner__compare--single">
          <div className="active-source-banner__col is-active">
            <span className="active-source-banner__col-label">{t('feedback.aiRecommended')}</span>
            <strong>
              {aiWeight != null ? formatWeight(aiWeight) : t('feedback.valueUnavailable')}
            </strong>
          </div>
        </div>
      )}
    </section>
  );
}
