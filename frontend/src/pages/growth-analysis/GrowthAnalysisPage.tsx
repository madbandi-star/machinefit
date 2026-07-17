import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { LineChart } from '@/components/progressive-overload/LineChart/LineChart';
import { DailyBreakdownList } from '@/components/progressive-overload/DailyBreakdownList/DailyBreakdownList';
import { fetchAllWorkoutLogs } from '@/api/workout-log';
import { QUERY_KEYS } from '@/constants/query-keys';
import { GrowthInsightsPanel } from '@/components/progressive-overload/GrowthInsightsPanel/GrowthInsightsPanel';
import { fetchWorkoutInsights } from '@/api/growth-insights';
import { useAuthStore } from '@/store/auth.store';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import {
  type GrowthPeriod,
  type GrowthViewMode,
  aggregateDailySessions,
  computeDailyKpis,
  computeGrowthRanking,
  computeMachineKpis,
  detectPrAlert,
  filterLogsByPeriod,
  formatGrowthPct,
  formatShortDate,
  formatWeightDelta,
  getDailyMaxWeightChartPoints,
  getMachineOptions,
  getPeriodStartDate,
  getSessionsForMachine,
} from '@/utils/workoutAnalytics';
import '@/styles/growth-analysis.css';

const PERIODS: GrowthPeriod[] = ['30d', '3m', 'all'];
const VIEW_MODES: GrowthViewMode[] = ['machine', 'daily'];

function KpiCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'up' | 'down' | 'neutral';
}) {
  const toneClass =
    tone === 'up'
      ? ' growth-analysis-kpi__value--up'
      : tone === 'down'
        ? ' growth-analysis-kpi__value--down'
        : '';

  return (
    <div className="growth-analysis-kpi card">
      <span className="growth-analysis-kpi__label">{label}</span>
      <strong className={`growth-analysis-kpi__value${toneClass}`}>{value}</strong>
    </div>
  );
}

export function GrowthAnalysisPage() {
  const { t, i18n } = useTranslation('common');
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<GrowthPeriod>('30d');
  const [viewMode, setViewMode] = useState<GrowthViewMode>('machine');
  const [selectedMachineCode, setSelectedMachineCode] = useState('');

  const { data: logs = [], isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.workoutLogsAll,
    queryFn: fetchAllWorkoutLogs,
  });

  const periodLogs = useMemo(() => filterLogsByPeriod(logs, period), [logs, period]);
  const machineOptions = useMemo(() => getMachineOptions(logs), [logs]);
  const dailyPoints = useMemo(() => aggregateDailySessions(periodLogs), [periodLogs]);
  const isDailyView = viewMode === 'daily';

  useEffect(() => {
    if (machineOptions.length === 0) {
      setSelectedMachineCode('');
      return;
    }
    if (!machineOptions.some((option) => option.machineCode === selectedMachineCode)) {
      setSelectedMachineCode(machineOptions[0].machineCode);
    }
  }, [machineOptions, selectedMachineCode]);

  const sessions = useMemo(
    () => (selectedMachineCode ? getSessionsForMachine(periodLogs, selectedMachineCode) : []),
    [periodLogs, selectedMachineCode]
  );

  const machineKpis = useMemo(() => computeMachineKpis(sessions), [sessions]);
  const dailyKpis = useMemo(
    () => computeDailyKpis(dailyPoints, periodLogs.length),
    [dailyPoints, periodLogs.length]
  );

  const prAlert = useMemo(
    () => (selectedMachineCode ? detectPrAlert(logs, selectedMachineCode) : null),
    [logs, selectedMachineCode]
  );
  const ranking = useMemo(() => computeGrowthRanking(logs, period), [logs, period]);

  const selectedMachineName = machineOptions.find(
    (option) => option.machineCode === selectedMachineCode
  )?.machineName;

  const {
    data: insights,
    isLoading: isInsightsLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.workoutInsights(selectedMachineCode, period),
    queryFn: () =>
      fetchWorkoutInsights({
        machineCode: selectedMachineCode,
        period,
        user,
        logs: periodLogs,
        machineName: selectedMachineName,
      }),
    enabled: Boolean(selectedMachineCode),
  });

  const volumeChartPoints = useMemo(() => {
    if (isDailyView) {
      return dailyPoints.map((day) => ({
        label: formatShortDate(day.logDate, i18n.language),
        value: day.totalVolume,
      }));
    }

    return sessions.map((session) => ({
      label: formatShortDate(session.logDate, i18n.language),
      value: session.totalVolume,
    }));
  }, [isDailyView, dailyPoints, sessions, i18n.language]);

  const maxWeightChartPoints = useMemo(() => {
    if (isDailyView) {
      const values = getDailyMaxWeightChartPoints(dailyPoints);
      return dailyPoints.map((day, index) => ({
        label: formatShortDate(day.logDate, i18n.language),
        value: values[index],
      }));
    }

    let runningMax = 0;
    return sessions.map((session) => {
      runningMax = Math.max(runningMax, session.maxWeight);
      return {
        label: formatShortDate(session.logDate, i18n.language),
        value: runningMax,
      };
    });
  }, [isDailyView, dailyPoints, sessions, i18n.language]);

  const machineCountChartPoints = useMemo(
    () =>
      dailyPoints.map((day) => ({
        label: formatShortDate(day.logDate, i18n.language),
        value: day.machineCount,
      })),
    [dailyPoints, i18n.language]
  );

  const periodLabel = t(`growthAnalysis.period.${period}`);
  const periodStart = getPeriodStartDate(period);
  const hasData = machineOptions.length > 0;

  const volumeGrowthPct = isDailyView ? dailyKpis.volumeGrowthPct : machineKpis.volumeGrowthPct;
  const maxWeightDelta = isDailyView ? dailyKpis.maxWeightDelta : machineKpis.maxWeightDelta;
  const workoutCount = isDailyView ? dailyKpis.totalLogCount : machineKpis.workoutCount;
  const currentPr = isDailyView ? dailyKpis.currentPeakWeight : machineKpis.currentPr;
  const previousPr = isDailyView
    ? dailyKpis.previousPeakWeight ?? dailyPoints[0]?.peakSetWeight ?? 0
    : machineKpis.previousPr ?? sessions[0]?.maxWeight ?? 0;

  if (isLoading) {
    return (
      <div className="growth-analysis-page">
        <PageShell title={t('growthAnalysis.title')} />
        <Skeleton count={4} height={80} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="growth-analysis-page">
        <PageShell title={t('growthAnalysis.title')} />
        <div className="card growth-analysis-empty">
          <p>{t('errors.loadFailed')}</p>
          <button type="button" className="btn btn--secondary" onClick={() => void refetch()}>
            {t('actions.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="growth-analysis-page">
      <PageShell
        title={t('growthAnalysis.title')}
        subtitle={
          isDailyView ? t('growthAnalysis.daily.subtitle') : t('growthAnalysis.subtitle')
        }
      />

      <div className="growth-analysis-filters card">
        <div className="form-row">
          <span className="form-row__label">{t('growthAnalysis.viewMode.label')}</span>
          <div
            className="growth-analysis-period"
            role="group"
            aria-label={t('growthAnalysis.viewMode.label')}
          >
            {VIEW_MODES.map((value) => (
              <button
                key={value}
                type="button"
                className={`growth-analysis-period__btn${viewMode === value ? ' growth-analysis-period__btn--active' : ''}`}
                onClick={() => setViewMode(value)}
              >
                {t(`growthAnalysis.viewMode.${value}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <label htmlFor="growth-machine">{t('growthAnalysis.machineSelect')}</label>
          <select
            id="growth-machine"
            className="input"
            value={selectedMachineCode}
            onChange={(event) => setSelectedMachineCode(event.target.value)}
            disabled={machineOptions.length === 0}
          >
            {machineOptions.length === 0 ? (
              <option value="">{t('growthAnalysis.noMachines')}</option>
            ) : (
              machineOptions.map((option) => (
                <option key={option.machineCode} value={option.machineCode}>
                  {option.machineName}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="form-row">
          <span className="form-row__label">{t('growthAnalysis.periodSelect')}</span>
          <div className="growth-analysis-period" role="group" aria-label={t('growthAnalysis.periodSelect')}>
            {PERIODS.map((value) => (
              <button
                key={value}
                type="button"
                className={`growth-analysis-period__btn${period === value ? ' growth-analysis-period__btn--active' : ''}`}
                onClick={() => setPeriod(value)}
              >
                {t(`growthAnalysis.period.${value}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="card growth-analysis-empty">
          <p>{t('growthAnalysis.empty')}</p>
        </div>
      ) : (
        <>
          {prAlert ? (
            <div className="card growth-analysis-pr-alert" role="status">
              <p className="growth-analysis-pr-alert__title">{t('growthAnalysis.prAlert.title')}</p>
              <p className="growth-analysis-pr-alert__machine">{prAlert.machineName}</p>
              <dl className="growth-analysis-pr-alert__stats">
                <div>
                  <dt>{t('growthAnalysis.prAlert.previous')}</dt>
                  <dd>{prAlert.previousPr}kg</dd>
                </div>
                <div>
                  <dt>{t('growthAnalysis.prAlert.current')}</dt>
                  <dd>{prAlert.currentPr}kg</dd>
                </div>
                <div>
                  <dt>{t('growthAnalysis.prAlert.delta')}</dt>
                  <dd className="growth-analysis-kpi__value--up">
                    +{prAlert.currentPr - prAlert.previousPr}kg
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <section className="growth-analysis-kpis" aria-label={t('growthAnalysis.kpiSection')}>
            <KpiCard
              label={t('growthAnalysis.kpi.volume')}
              value={`${(volumeGrowthPct ?? 0) >= 0 ? '▲ ' : '▼ '}${formatGrowthPct(volumeGrowthPct)}`}
              tone={
                volumeGrowthPct == null ? 'neutral' : volumeGrowthPct >= 0 ? 'up' : 'down'
              }
            />
            <KpiCard
              label={t('growthAnalysis.kpi.maxWeight')}
              value={`${(maxWeightDelta ?? 0) >= 0 ? '▲ ' : '▼ '}${formatWeightDelta(maxWeightDelta)}`}
              tone={
                maxWeightDelta == null ? 'neutral' : maxWeightDelta >= 0 ? 'up' : 'down'
              }
            />
            <KpiCard
              label={
                isDailyView
                  ? t('growthAnalysis.daily.kpi.totalLogs')
                  : t('growthAnalysis.kpi.workoutCount')
              }
              value={`${workoutCount}${isDailyView ? t('growthAnalysis.daily.kpi.logs') : t('growthAnalysis.kpi.times')}`}
            />
          </section>

          {isDailyView ? (
            <section
              className="growth-analysis-kpis growth-analysis-kpis--daily-extra"
              aria-label={t('growthAnalysis.daily.kpiSection')}
            >
              <KpiCard
                label={t('growthAnalysis.daily.kpi.avgVolume')}
                value={
                  dailyKpis.avgDailyVolume == null
                    ? '—'
                    : `${Math.round(dailyKpis.avgDailyVolume).toLocaleString()}kg`
                }
              />
              <KpiCard
                label={t('growthAnalysis.daily.kpi.workoutDays')}
                value={`${dailyKpis.workoutDayCount}${t('growthAnalysis.daily.kpi.days')}`}
              />
            </section>
          ) : null}

          <p className="growth-analysis-period-note">
            {t('growthAnalysis.periodNote', { period: periodLabel })}
          </p>

          <section className="card growth-analysis-chart-section">
            <div className="growth-analysis-chart-section__header">
              <h2>
                {isDailyView
                  ? t('growthAnalysis.daily.volumeChart.title')
                  : t('growthAnalysis.volumeChart.title')}
              </h2>
              {volumeGrowthPct !== null ? (
                <span className="growth-analysis-chart-section__badge growth-analysis-kpi__value--up">
                  {formatGrowthPct(volumeGrowthPct)} {t('growthAnalysis.growth')}
                </span>
              ) : null}
            </div>
            <p className="growth-analysis-chart-section__desc">
              {isDailyView
                ? t('growthAnalysis.daily.volumeChart.desc')
                : t('growthAnalysis.volumeChart.desc')}
            </p>
            {volumeChartPoints.length > 0 ? (
              <LineChart
                points={volumeChartPoints}
                unit="kg"
                showTrend
                ariaLabel={
                  isDailyView
                    ? t('growthAnalysis.daily.volumeChart.title')
                    : t('growthAnalysis.volumeChart.title')
                }
              />
            ) : (
              <p className="growth-analysis-chart-empty">{t('growthAnalysis.noDataInPeriod')}</p>
            )}
          </section>

          <section className="card growth-analysis-chart-section">
            <div className="growth-analysis-chart-section__header">
              <h2>{t('growthAnalysis.maxWeightChart.title')}</h2>
            </div>
            <p className="growth-analysis-chart-section__desc">
              {isDailyView
                ? t('growthAnalysis.daily.maxWeightChart.desc')
                : t('growthAnalysis.maxWeightChart.desc')}
            </p>
            {currentPr !== null ? (
              <div className="growth-analysis-pr-summary">
                <div>
                  <span>{t('growthAnalysis.maxWeightChart.previousPr')}</span>
                  <strong>{previousPr}kg</strong>
                </div>
                <div>
                  <span>{t('growthAnalysis.maxWeightChart.currentPr')}</span>
                  <strong>{currentPr}kg</strong>
                </div>
                {maxWeightDelta !== null ? (
                  <div className="growth-analysis-kpi__value--up">
                    {formatWeightDelta(maxWeightDelta)} {t('growthAnalysis.maxWeightChart.rise')}
                  </div>
                ) : null}
              </div>
            ) : null}
            {maxWeightChartPoints.length > 0 ? (
              <LineChart
                points={maxWeightChartPoints}
                unit="kg"
                accentColor="var(--color-accent, #f59e0b)"
                ariaLabel={t('growthAnalysis.maxWeightChart.title')}
              />
            ) : (
              <p className="growth-analysis-chart-empty">{t('growthAnalysis.noDataInPeriod')}</p>
            )}
          </section>

          {isDailyView ? (
            <section className="card growth-analysis-chart-section">
              <div className="growth-analysis-chart-section__header">
                <h2>{t('growthAnalysis.daily.machineChart.title')}</h2>
              </div>
              <p className="growth-analysis-chart-section__desc">
                {t('growthAnalysis.daily.machineChart.desc')}
              </p>
              {machineCountChartPoints.length > 0 ? (
                <LineChart
                  points={machineCountChartPoints}
                  unit={t('growthAnalysis.daily.machineChart.unit')}
                  accentColor="var(--color-primary)"
                  ariaLabel={t('growthAnalysis.daily.machineChart.title')}
                />
              ) : (
                <p className="growth-analysis-chart-empty">{t('growthAnalysis.noDataInPeriod')}</p>
              )}
            </section>
          ) : null}

          <GrowthInsightsPanel
            insights={insights ?? null}
            isLoading={isInsightsLoading}
            periodLabel={periodLabel}
          />

          {isDailyView ? (
            <DailyBreakdownList days={dailyPoints} locale={i18n.language} />
          ) : null}
        </>
      )}

      {ranking.length > 0 ? (
        <section className="card growth-analysis-ranking">
          <h2>{t('growthAnalysis.ranking.title')}</h2>
          <ol className="growth-analysis-ranking__list">
            {ranking.map((item, index) => (
              <li key={item.machineCode} className="growth-analysis-ranking__item">
                <span className="growth-analysis-ranking__rank">{index + 1}</span>
                <div className="growth-analysis-ranking__info">
                  <strong>{item.machineName}</strong>
                  <span className="growth-analysis-kpi__value--up">
                    {formatGrowthPct(item.growthPct)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
          <p className="growth-analysis-period-note">
            {periodStart
              ? t('growthAnalysis.ranking.periodNote', { period: periodLabel })
              : t('growthAnalysis.ranking.allTimeNote')}
          </p>
        </section>
      ) : null}
    </div>
  );
}
