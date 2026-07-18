import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { WorkoutInsights } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { formatBoxingWeightClassLabel } from '@/utils/boxingWeightClassLabel';
import { getCoachingFocusLabel, getCoachingSummary, getCoachingTips } from '@/utils/growthCoaching';
import { formatGrowthPct, formatRelativeGrowthPct, getGrowthValueClass } from '@/utils/workoutAnalytics';
import { ProfileCompareMetric } from '@/components/progressive-overload/ProfileCompareMetric/ProfileCompareMetric';
import { CollapsibleCard } from '@/components/progressive-overload/CollapsibleCard/CollapsibleCard';
import { useUserUnits } from '@/hooks/useUserUnits';

interface GrowthInsightsPanelProps {
  insights: WorkoutInsights | null;
  isLoading: boolean;
  periodLabel: string;
}

function CohortBadge({ label }: { label: string }) {
  return <span className="profile-compare-cohort__chip">{label}</span>;
}

function getPeerInterpretationKey(relativePct: number | null, isDaily: boolean): string {
  const prefix = isDaily
    ? 'growthAnalysis.daily.insights.peerComparison'
    : 'growthAnalysis.insights.peerComparison';
  if (relativePct == null) return `${prefix}.interpretUnknown`;
  if (relativePct >= 5) return `${prefix}.interpretAbove`;
  if (relativePct <= -5) return `${prefix}.interpretBelow`;
  return `${prefix}.interpretNear`;
}

function getPeerInterpretationClass(relativePct: number | null): string {
  if (relativePct == null) return 'peer-growth-compare__interpretation--neutral';
  if (relativePct >= 5) return '';
  if (relativePct <= -5) return 'peer-growth-compare__interpretation--below';
  return 'peer-growth-compare__interpretation--neutral';
}

export function GrowthInsightsPanel({ insights, isLoading, periodLabel }: GrowthInsightsPanelProps) {
  const { t } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const { formatWeight } = useUserUnits();

  if (isLoading) {
    return (
      <section className="card growth-insights-panel">
        <h2>{t('growthAnalysis.insights.title')}</h2>
        <p className="growth-analysis-period-note">{t('growthAnalysis.insights.loading')}</p>
      </section>
    );
  }

  if (!insights) return null;

  const isDaily = insights.viewMode === 'daily';
  const insightKey = isDaily ? 'growthAnalysis.daily.insights' : 'growthAnalysis.insights';
  const viewMode = isDaily ? 'daily' : 'machine';

  if (!insights.hasProfile) {
    return (
      <section className="card growth-insights-panel">
        <h2>{t(`${insightKey}.title`)}</h2>
        <p>{t(`${insightKey}.profileRequired`)}</p>
        <Link to={ROUTES.SETTINGS} className="btn btn--secondary">
          {t(`${insightKey}.goSettings`)}
        </Link>
      </section>
    );
  }

  const coachingTips = insights.coaching ? getCoachingTips(t, insights.coaching, viewMode) : [];
  const coachingSummary = insights.coaching ? getCoachingSummary(t, insights.coaching, viewMode) : null;
  const peer = insights.peerComparison;
  const avgLabel = peer
    ? t(`${insightKey}.profileAverage.cohortAvgShort`, {
        gender: t(`auth.genders.${peer.gender}`),
        min: peer.heightMinCm,
        max: peer.heightMaxCm,
      })
    : t(`${insightKey}.average`);

  return (
    <section className="growth-insights-panel" aria-label={t(`${insightKey}.title`)}>
      <CollapsibleCard
        title={t(`${insightKey}.profileAverage.title`)}
        summary={t(`${insightKey}.profileAverage.desc`, { period: periodLabel })}
        defaultOpen={false}
        className="growth-insights-panel__section profile-compare-section"
      >
        {insights.profileAverage ? (
          <>
            <div className="profile-compare-cohort">
              {peer ? (
                <>
                  <CohortBadge label={t(`auth.genders.${peer.gender}`)} />
                  <CohortBadge
                    label={t(`${insightKey}.profileAverage.heightChip`, {
                      min: peer.heightMinCm,
                      max: peer.heightMaxCm,
                    })}
                  />
                  <CohortBadge
                    label={formatBoxingWeightClassLabel(t, {
                      weightClassKey: peer.weightClassKey,
                      weightMinKg: peer.weightMinKg,
                      weightMaxKg: peer.weightMaxKg,
                      weightClassUnlimited: peer.weightClassUnlimited,
                    })}
                  />
                </>
              ) : null}
              {user?.experienceLevel ? (
                <CohortBadge label={t(`auth.experienceLevels.${user.experienceLevel}`)} />
              ) : null}
              {user?.heightCm ? (
                <CohortBadge
                  label={t(`${insightKey}.profileAverage.myHeightChip`, {
                    height: user.heightCm,
                  })}
                />
              ) : null}
              {user?.weightKg ? (
                <CohortBadge
                  label={t(`${insightKey}.profileAverage.myWeightChip`, {
                    weight: formatWeight(user.weightKg),
                  })}
                />
              ) : null}
              <CohortBadge
                label={
                  insights.profileAverage.sampleSize > 0
                    ? t(`${insightKey}.sampleSize`, {
                        count: insights.profileAverage.sampleSize,
                      })
                    : t(`${insightKey}.estimatedBenchmark`)
                }
              />
            </div>

            <div className="profile-compare-metrics">
              <ProfileCompareMetric
                icon="🏋️"
                title={t(`${insightKey}.profileAverage.metrics.maxWeight.title`)}
                hint={t(`${insightKey}.profileAverage.metrics.maxWeight.hint`)}
                userValue={insights.userMaxWeightKg}
                avgValue={insights.profileAverage.avgMaxWeightKg}
                unit="kg"
                meLabel={t(`${insightKey}.me`)}
                avgLabel={avgLabel}
              />
              <ProfileCompareMetric
                icon="📊"
                title={t(`${insightKey}.profileAverage.metrics.sessionVolume.title`)}
                hint={t(`${insightKey}.profileAverage.metrics.sessionVolume.hint`)}
                userValue={insights.userAvgSessionVolumeKg}
                avgValue={insights.profileAverage.avgSessionVolumeKg}
                unit="kg"
                meLabel={t(`${insightKey}.me`)}
                avgLabel={avgLabel}
              />
              <ProfileCompareMetric
                icon="📈"
                title={t(`${insightKey}.profileAverage.metrics.growth.title`)}
                hint={t(`${insightKey}.profileAverage.metrics.growth.hint`, {
                  period: periodLabel,
                })}
                userValue={insights.userVolumeGrowthPct}
                avgValue={insights.profileAverage.avgVolumeGrowthPct}
                unit="%"
                meLabel={t(`${insightKey}.me`)}
                avgLabel={avgLabel}
              />
            </div>
          </>
        ) : (
          <p className="growth-analysis-chart-empty">{t(`${insightKey}.noBenchmark`)}</p>
        )}
      </CollapsibleCard>

      {insights.peerComparison ? (
        <CollapsibleCard
          title={t(`${insightKey}.peerComparison.title`)}
          summary={
            isDaily
              ? t(`${insightKey}.peerComparison.desc`, {
                  gender: t(`auth.genders.${insights.peerComparison.gender}`),
                  min: insights.peerComparison.heightMinCm,
                  max: insights.peerComparison.heightMaxCm,
                  weightClass: formatBoxingWeightClassLabel(t, {
                    weightClassKey: insights.peerComparison.weightClassKey,
                    weightMinKg: insights.peerComparison.weightMinKg,
                    weightMaxKg: insights.peerComparison.weightMaxKg,
                    weightClassUnlimited: insights.peerComparison.weightClassUnlimited,
                  }),
                  period: periodLabel,
                })
              : t(`${insightKey}.peerComparison.desc`, {
                  machine: insights.machineName ?? '',
                  gender: t(`auth.genders.${insights.peerComparison.gender}`),
                  min: insights.peerComparison.heightMinCm,
                  max: insights.peerComparison.heightMaxCm,
                  weightClass: formatBoxingWeightClassLabel(t, {
                    weightClassKey: insights.peerComparison.weightClassKey,
                    weightMinKg: insights.peerComparison.weightMinKg,
                    weightMaxKg: insights.peerComparison.weightMaxKg,
                    weightClassUnlimited: insights.peerComparison.weightClassUnlimited,
                  }),
                  period: periodLabel,
                })
          }
          defaultOpen={false}
          className="growth-insights-panel__section peer-growth-compare"
        >
          <div className="peer-growth-compare__definition" role="note">
            <strong>{t(`${insightKey}.peerComparison.definitionTitle`)}</strong>
            <p>{t(`${insightKey}.peerComparison.definition`, { period: periodLabel })}</p>
            <p className="peer-growth-compare__example">
              {t(`${insightKey}.peerComparison.definitionExample`)}
            </p>
          </div>

          {insights.peerComparison.sampleSize > 0 ? (
            <p className="peer-growth-compare__sample">
              {t(`${insightKey}.peerComparison.sampleSize`, {
                count: insights.peerComparison.sampleSize,
              })}
            </p>
          ) : null}

          <dl className="peer-growth-compare__metrics">
            <div className="peer-growth-compare__metric">
              <dt>
                <span>{t(`${insightKey}.peerComparison.myGrowth`)}</span>
                <small>{t(`${insightKey}.peerComparison.myGrowthHint`)}</small>
              </dt>
              <dd className={getGrowthValueClass(insights.peerComparison.userVolumeGrowthPct).trim()}>
                {formatGrowthPct(insights.peerComparison.userVolumeGrowthPct)}
              </dd>
            </div>
            <div className="peer-growth-compare__metric">
              <dt>
                <span>{t(`${insightKey}.peerComparison.peerAvg`)}</span>
                <small>{t(`${insightKey}.peerComparison.peerAvgHint`)}</small>
              </dt>
              <dd>{formatGrowthPct(insights.peerComparison.peerAvgVolumeGrowthPct)}</dd>
            </div>
            <div className="peer-growth-compare__metric">
              <dt>
                <span>{t(`${insightKey}.peerComparison.relative`)}</span>
                <small>{t(`${insightKey}.peerComparison.relativeHint`)}</small>
              </dt>
              <dd className={getGrowthValueClass(insights.peerComparison.relativePct).trim()}>
                {formatRelativeGrowthPct(insights.peerComparison.relativePct)}
              </dd>
            </div>
          </dl>

          <p
            className={`peer-growth-compare__interpretation ${getPeerInterpretationClass(
              insights.peerComparison.relativePct
            )}`}
          >
            {t(getPeerInterpretationKey(insights.peerComparison.relativePct, isDaily))}
          </p>
        </CollapsibleCard>
      ) : null}

      {insights.coaching ? (
        <CollapsibleCard
          title={t(`${insightKey}.coaching.title`)}
          summary={coachingSummary}
          defaultOpen={false}
          className="growth-insights-panel__section growth-insights-coaching"
        >
          <div className="growth-insights-coaching__header">
            <span className="growth-insights-coaching__badge">
              {getCoachingFocusLabel(t, insights.coaching.focus, viewMode)}
            </span>
          </div>
          <ul className="growth-insights-coaching__tips">
            {coachingTips.map((tip, index) => (
              <li key={`${index}-${tip}`}>{tip}</li>
            ))}
          </ul>
        </CollapsibleCard>
      ) : null}

      {insights.nextTarget ? (
        <CollapsibleCard
          title={t(`${insightKey}.nextTarget.title`)}
          summary={t(`${insightKey}.nextTarget.desc`)}
          defaultOpen
          className="growth-insights-panel__section growth-insights-target"
        >
          <div className="growth-insights-target__weights growth-insights-target__weights--triple">
            {insights.nextTarget.previousMaxWeightKg != null ? (
              <>
                <div>
                  <span>{t(`${insightKey}.nextTarget.previous`)}</span>
                  <strong>{insights.nextTarget.previousMaxWeightKg}kg</strong>
                </div>
                <div className="growth-insights-target__arrow" aria-hidden>
                  →
                </div>
              </>
            ) : null}
            <div>
              <span>{t(`${insightKey}.nextTarget.current`)}</span>
              <strong>{insights.nextTarget.currentMaxWeightKg}kg</strong>
            </div>
            <div className="growth-insights-target__arrow" aria-hidden>
              →
            </div>
            <div>
              <span>{t(`${insightKey}.nextTarget.suggested`)}</span>
              <strong className="growth-analysis-kpi__value--up">
                {insights.nextTarget.suggestedMaxWeightKg}kg
              </strong>
            </div>
          </div>
          <p className="growth-insights-target__sets">
            {t(`${insightKey}.nextTarget.sets`, {
              count: insights.nextTarget.setCount,
              weights: insights.nextTarget.suggestedSetWeightsKg.join('kg / ') + 'kg',
            })}
          </p>
        </CollapsibleCard>
      ) : null}

      {insights.nextVolumeTarget ? (
        <CollapsibleCard
          title={t(`${insightKey}.nextVolumeTarget.title`)}
          summary={t(`${insightKey}.nextVolumeTarget.desc`)}
          defaultOpen
          className="growth-insights-panel__section growth-insights-target"
        >
          <div className="growth-insights-target__weights growth-insights-target__weights--triple">
            {insights.nextVolumeTarget.previousTotalVolumeKg != null ? (
              <>
                <div>
                  <span>{t(`${insightKey}.nextVolumeTarget.previous`)}</span>
                  <strong>
                    {insights.nextVolumeTarget.previousTotalVolumeKg.toLocaleString()}kg
                  </strong>
                </div>
                <div className="growth-insights-target__arrow" aria-hidden>
                  →
                </div>
              </>
            ) : null}
            <div>
              <span>{t(`${insightKey}.nextVolumeTarget.current`)}</span>
              <strong>{insights.nextVolumeTarget.currentTotalVolumeKg.toLocaleString()}kg</strong>
            </div>
            <div className="growth-insights-target__arrow" aria-hidden>
              →
            </div>
            <div>
              <span>{t(`${insightKey}.nextVolumeTarget.suggested`)}</span>
              <strong className="growth-analysis-kpi__value--up">
                {insights.nextVolumeTarget.suggestedTotalVolumeKg.toLocaleString()}kg
              </strong>
            </div>
          </div>
        </CollapsibleCard>
      ) : null}
    </section>
  );
}
