import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { WorkoutInsights } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { formatGrowthPct } from '@/utils/workoutAnalytics';
import { getCoachingFocusLabel, getCoachingSummary, getCoachingTips } from '@/utils/growthCoaching';
import { ProfileCompareMetric } from '@/components/progressive-overload/ProfileCompareMetric/ProfileCompareMetric';

interface GrowthInsightsPanelProps {
  insights: WorkoutInsights | null;
  isLoading: boolean;
  periodLabel: string;
}

function CohortBadge({ label }: { label: string }) {
  return <span className="profile-compare-cohort__chip">{label}</span>;
}

export function GrowthInsightsPanel({ insights, isLoading, periodLabel }: GrowthInsightsPanelProps) {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);

  if (isLoading) {
    return (
      <section className="card growth-insights-panel">
        <h2>{t('growthAnalysis.insights.title')}</h2>
        <p className="growth-analysis-period-note">{t('growthAnalysis.insights.loading')}</p>
      </section>
    );
  }

  if (!insights) return null;

  if (!insights.hasProfile) {
    return (
      <section className="card growth-insights-panel">
        <h2>{t('growthAnalysis.insights.title')}</h2>
        <p>{t('growthAnalysis.insights.profileRequired')}</p>
        <Link to={ROUTES.SETTINGS} className="btn btn--secondary">
          {t('growthAnalysis.insights.goSettings')}
        </Link>
      </section>
    );
  }

  const coachingTips = insights.coaching ? getCoachingTips(t, insights.coaching) : [];
  const coachingSummary = insights.coaching ? getCoachingSummary(t, insights.coaching) : null;
  const peer = insights.peerComparison;
  const avgLabel = peer
    ? t('growthAnalysis.insights.profileAverage.cohortAvgShort', {
        gender: t(`auth.genders.${peer.gender}`),
        min: peer.heightMinCm,
        max: peer.heightMaxCm,
      })
    : t('growthAnalysis.insights.average');

  return (
    <section className="growth-insights-panel" aria-label={t('growthAnalysis.insights.title')}>
      <div className="card growth-insights-panel__section profile-compare-section">
        <div className="profile-compare-section__head">
          <div>
            <h2>{t('growthAnalysis.insights.profileAverage.title')}</h2>
            <p className="growth-analysis-chart-section__desc">
              {t('growthAnalysis.insights.profileAverage.desc', { period: periodLabel })}
            </p>
          </div>
        </div>

        {insights.profileAverage ? (
          <>
            <div className="profile-compare-cohort">
              {peer ? (
                <>
                  <CohortBadge label={t(`auth.genders.${peer.gender}`)} />
                  <CohortBadge
                    label={t('growthAnalysis.insights.profileAverage.heightChip', {
                      min: peer.heightMinCm,
                      max: peer.heightMaxCm,
                    })}
                  />
                </>
              ) : null}
              {user?.experienceLevel ? (
                <CohortBadge label={t(`auth.experienceLevels.${user.experienceLevel}`)} />
              ) : null}
              {user?.heightCm ? (
                <CohortBadge
                  label={t('growthAnalysis.insights.profileAverage.myHeightChip', {
                    height: user.heightCm,
                  })}
                />
              ) : null}
              <CohortBadge
                label={
                  insights.profileAverage.sampleSize > 0
                    ? t('growthAnalysis.insights.sampleSize', {
                        count: insights.profileAverage.sampleSize,
                      })
                    : t('growthAnalysis.insights.estimatedBenchmark')
                }
              />
            </div>

            <div className="profile-compare-metrics">
              <ProfileCompareMetric
                icon="🏋️"
                title={t('growthAnalysis.insights.profileAverage.metrics.maxWeight.title')}
                hint={t('growthAnalysis.insights.profileAverage.metrics.maxWeight.hint')}
                userValue={insights.userMaxWeightKg}
                avgValue={insights.profileAverage.avgMaxWeightKg}
                unit="kg"
                meLabel={t('growthAnalysis.insights.me')}
                avgLabel={avgLabel}
              />
              <ProfileCompareMetric
                icon="📊"
                title={t('growthAnalysis.insights.profileAverage.metrics.sessionVolume.title')}
                hint={t('growthAnalysis.insights.profileAverage.metrics.sessionVolume.hint')}
                userValue={insights.userAvgSessionVolumeKg}
                avgValue={insights.profileAverage.avgSessionVolumeKg}
                unit="kg"
                meLabel={t('growthAnalysis.insights.me')}
                avgLabel={avgLabel}
              />
              <ProfileCompareMetric
                icon="📈"
                title={t('growthAnalysis.insights.profileAverage.metrics.growth.title')}
                hint={t('growthAnalysis.insights.profileAverage.metrics.growth.hint', {
                  period: periodLabel,
                })}
                userValue={insights.userVolumeGrowthPct}
                avgValue={insights.profileAverage.avgVolumeGrowthPct}
                unit="%"
                meLabel={t('growthAnalysis.insights.me')}
                avgLabel={avgLabel}
              />
            </div>
          </>
        ) : (
          <p className="growth-analysis-chart-empty">{t('growthAnalysis.insights.noBenchmark')}</p>
        )}
      </div>

      {insights.peerComparison ? (
        <div className="card growth-insights-panel__section">
          <h2>{t('growthAnalysis.insights.peerComparison.title')}</h2>
          <p className="growth-analysis-chart-section__desc">
            {t('growthAnalysis.insights.peerComparison.desc', {
              gender: t(`auth.genders.${insights.peerComparison.gender}`),
              min: insights.peerComparison.heightMinCm,
              max: insights.peerComparison.heightMaxCm,
            })}
          </p>
          <div className="growth-insights-peer">
            <div>
              <span>{t('growthAnalysis.insights.peerComparison.myGrowth')}</span>
              <strong className="growth-analysis-kpi__value--up">
                {formatGrowthPct(insights.peerComparison.userVolumeGrowthPct)}
              </strong>
            </div>
            <div>
              <span>{t('growthAnalysis.insights.peerComparison.peerAvg')}</span>
              <strong>{formatGrowthPct(insights.peerComparison.peerAvgVolumeGrowthPct)}</strong>
            </div>
            <div>
              <span>{t('growthAnalysis.insights.peerComparison.relative')}</span>
              <strong
                className={
                  (insights.peerComparison.relativePct ?? 0) >= 0
                    ? 'growth-analysis-kpi__value--up'
                    : 'growth-analysis-kpi__value--down'
                }
              >
                {formatGrowthPct(insights.peerComparison.relativePct)}
              </strong>
            </div>
          </div>
        </div>
      ) : null}

      {insights.coaching ? (
        <div className="card growth-insights-panel__section growth-insights-coaching">
          <div className="growth-insights-coaching__header">
            <h2>{t('growthAnalysis.insights.coaching.title')}</h2>
            <span className="growth-insights-coaching__badge">
              {getCoachingFocusLabel(t, insights.coaching.focus)}
            </span>
          </div>
          {coachingSummary ? <p className="growth-insights-coaching__summary">{coachingSummary}</p> : null}
          <ul className="growth-insights-coaching__tips">
            {coachingTips.map((tip, index) => (
              <li key={`${index}-${tip}`}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {insights.nextTarget ? (
        <div className="card growth-insights-panel__section growth-insights-target">
          <h2>{t('growthAnalysis.insights.nextTarget.title')}</h2>
          <p className="growth-analysis-chart-section__desc">
            {t('growthAnalysis.insights.nextTarget.desc')}
          </p>
          <div className="growth-insights-target__weights">
            <div>
              <span>{t('growthAnalysis.insights.nextTarget.current')}</span>
              <strong>{insights.nextTarget.currentMaxWeightKg}kg</strong>
            </div>
            <div className="growth-insights-target__arrow" aria-hidden>
              →
            </div>
            <div>
              <span>{t('growthAnalysis.insights.nextTarget.suggested')}</span>
              <strong className="growth-analysis-kpi__value--up">
                {insights.nextTarget.suggestedMaxWeightKg}kg
              </strong>
            </div>
          </div>
          <p className="growth-insights-target__sets">
            {t('growthAnalysis.insights.nextTarget.sets', {
              count: insights.nextTarget.setCount,
              weights: insights.nextTarget.suggestedSetWeightsKg.join('kg / ') + 'kg',
            })}
          </p>
        </div>
      ) : null}
    </section>
  );
}
