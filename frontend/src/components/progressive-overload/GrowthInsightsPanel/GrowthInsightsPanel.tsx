import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { WorkoutInsights } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import { formatGrowthPct } from '@/utils/workoutAnalytics';
import { getCoachingFocusLabel, getCoachingSummary, getCoachingTips } from '@/utils/growthCoaching';

interface GrowthInsightsPanelProps {
  insights: WorkoutInsights | null;
  isLoading: boolean;
  periodLabel: string;
}

function ComparisonBar({
  meLabel,
  avgLabel,
  userValue,
  avgValue,
  unit,
}: {
  meLabel: string;
  avgLabel: string;
  userValue: number | null;
  avgValue: number;
  unit: string;
}) {
  const max = Math.max(userValue ?? 0, avgValue, 1);
  const userWidth = userValue == null ? 0 : (userValue / max) * 100;
  const avgWidth = (avgValue / max) * 100;

  return (
    <div className="growth-insights-compare">
      <div className="growth-insights-compare__bars">
        <div className="growth-insights-compare__row">
          <span>{meLabel}</span>
          <div className="growth-insights-compare__track">
            <div
              className="growth-insights-compare__fill growth-insights-compare__fill--user"
              style={{ width: `${userWidth}%` }}
            />
          </div>
          <strong>{userValue == null ? '—' : `${userValue}${unit}`}</strong>
        </div>
        <div className="growth-insights-compare__row">
          <span>{avgLabel}</span>
          <div className="growth-insights-compare__track">
            <div
              className="growth-insights-compare__fill growth-insights-compare__fill--avg"
              style={{ width: `${avgWidth}%` }}
            />
          </div>
          <strong>{avgValue}{unit}</strong>
        </div>
      </div>
    </div>
  );
}

export function GrowthInsightsPanel({ insights, isLoading, periodLabel }: GrowthInsightsPanelProps) {
  const { t } = useTranslation('common');

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

  return (
    <section className="growth-insights-panel" aria-label={t('growthAnalysis.insights.title')}>
      <div className="card growth-insights-panel__section">
        <h2>{t('growthAnalysis.insights.profileAverage.title')}</h2>
        <p className="growth-analysis-chart-section__desc">
          {t('growthAnalysis.insights.profileAverage.desc', { period: periodLabel })}
        </p>
        {insights.profileAverage ? (
          <>
            {insights.profileAverage.sampleSize > 0 ? (
              <p className="growth-analysis-period-note">
                {t('growthAnalysis.insights.sampleSize', {
                  count: insights.profileAverage.sampleSize,
                })}
              </p>
            ) : (
              <p className="growth-analysis-period-note">
                {t('growthAnalysis.insights.estimatedBenchmark')}
              </p>
            )}
            <ComparisonBar
              meLabel={t('growthAnalysis.insights.me')}
              avgLabel={t('growthAnalysis.insights.average')}
              userValue={insights.userMaxWeightKg}
              avgValue={insights.profileAverage.avgMaxWeightKg}
              unit="kg"
            />
            <ComparisonBar
              meLabel={t('growthAnalysis.insights.me')}
              avgLabel={t('growthAnalysis.insights.average')}
              userValue={insights.userAvgSessionVolumeKg}
              avgValue={insights.profileAverage.avgSessionVolumeKg}
              unit="kg"
            />
            <ComparisonBar
              meLabel={t('growthAnalysis.insights.me')}
              avgLabel={t('growthAnalysis.insights.average')}
              userValue={insights.userVolumeGrowthPct}
              avgValue={insights.profileAverage.avgVolumeGrowthPct}
              unit="%"
            />
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
            {coachingTips.map((tip) => (
              <li key={tip}>{tip}</li>
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
