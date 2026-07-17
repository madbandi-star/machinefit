import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { GrowthChartBlock } from '@/components/progressive-overload/GrowthChartBlock/GrowthChartBlock';
import { CollapsibleCard } from '@/components/progressive-overload/CollapsibleCard/CollapsibleCard';
import { DailyBreakdownList } from '@/components/progressive-overload/DailyBreakdownList/DailyBreakdownList';
import { fetchAllWorkoutLogs } from '@/api/workout-log';
import { QUERY_KEYS } from '@/constants/query-keys';
import { GrowthInsightsPanel } from '@/components/progressive-overload/GrowthInsightsPanel/GrowthInsightsPanel';
import { fetchWorkoutInsights } from '@/api/growth-insights';
import { useAuthStore } from '@/store/auth.store';
import { GrowthPeriodFilter } from '@/components/progressive-overload/GrowthPeriodFilter/GrowthPeriodFilter';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import {
  type GrowthPeriod,
  type GrowthPeriodFilter as GrowthPeriodFilterState,
  type GrowthViewMode,
  aggregateDailySessions,
  computeDailyKpis,
  computeGrowthRanking,
  computeMachineKpis,
  detectPrAlert,
  extractWorkoutLogDateKeys,
  filterLogsByGrowthPeriod,
  formatGrowthPct,
  formatShortDate,
  formatWeightDelta,
  getDailyMaxWeightChartPoints,
  getDefaultCustomRange,
  getMachineOptions,
  getSessionsForMachine,
  resolveGrowthPeriodBounds,
} from '@/utils/workoutAnalytics';
import { formatHistoryDateHeader } from '@/utils/historyDate';
import '@/styles/growth-analysis.css';

const VIEW_MODES: GrowthViewMode[] = ['daily', 'machine'];

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
  const [periodPreset, setPeriodPreset] = useState<GrowthPeriod>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [viewMode, setViewMode] = useState<GrowthViewMode>('daily');
  const [selectedMachineCode, setSelectedMachineCode] = useState('');

  const periodFilter: GrowthPeriodFilterState = useMemo(
    () => ({
      preset: periodPreset,
      customFrom: periodPreset === 'custom' ? customFrom : undefined,
      customTo: periodPreset === 'custom' ? customTo : undefined,
    }),
    [periodPreset, customFrom, customTo]
  );

  const { data: logs = [], isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.workoutLogsAll,
    queryFn: fetchAllWorkoutLogs,
  });

  const datesWithData = useMemo(() => extractWorkoutLogDateKeys(logs), [logs]);

  const periodLogs = useMemo(
    () => filterLogsByGrowthPeriod(logs, periodFilter),
    [logs, periodFilter]
  );
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
  const ranking = useMemo(() => computeGrowthRanking(logs, periodFilter), [logs, periodFilter]);

  const selectedMachineName = machineOptions.find(
    (option) => option.machineCode === selectedMachineCode
  )?.machineName;

  const periodLabel = useMemo(() => {
    if (periodPreset === 'custom' && customFrom && customTo) {
      return t('growthAnalysis.periodRange.selectedShort', {
        from: formatHistoryDateHeader(customFrom, i18n.language),
        to: formatHistoryDateHeader(customTo, i18n.language),
      });
    }
    return t(`growthAnalysis.period.${periodPreset}`);
  }, [periodPreset, customFrom, customTo, i18n.language, t]);

  const periodStart = resolveGrowthPeriodBounds(periodFilter).from;

  const handlePeriodPresetChange = (preset: GrowthPeriod) => {
    setPeriodPreset(preset);
    if (preset === 'custom') {
      const range = getDefaultCustomRange(logs);
      setCustomFrom(range.from);
      setCustomTo(range.to);
    }
  };

  const {
    data: insights,
    isLoading: isInsightsLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.workoutInsights(selectedMachineCode, periodPreset, customFrom, customTo),
    queryFn: () =>
      fetchWorkoutInsights({
        machineCode: selectedMachineCode,
        period: periodPreset,
        customFrom: periodPreset === 'custom' ? customFrom : undefined,
        customTo: periodPreset === 'custom' ? customTo : undefined,
        user,
        logs: periodLogs,
        machineName: selectedMachineName,
      }),
    enabled: Boolean(selectedMachineCode) && (periodPreset !== 'custom' || Boolean(customFrom && customTo)),
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

  const hasData = machineOptions.length > 0;

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

        {!isDailyView ? (
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
        ) : null}

        <div className="form-row">
          <GrowthPeriodFilter
            preset={periodPreset}
            customFrom={customFrom}
            customTo={customTo}
            datesWithData={datesWithData}
            locale={i18n.language}
            onPresetChange={handlePeriodPresetChange}
            onCustomRangeChange={(from, to) => {
              setCustomFrom(from);
              setCustomTo(to);
            }}
          />
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

          <section
            className={`growth-analysis-charts-grid${isDailyView ? ' growth-analysis-charts-grid--daily' : ''}`}
            aria-label={t('growthAnalysis.kpiSection')}
          >
            <GrowthChartBlock
              title={
                isDailyView
                  ? t('growthAnalysis.daily.volumeChart.title')
                  : t('growthAnalysis.volumeChart.title')
              }
              description={
                isDailyView
                  ? t('growthAnalysis.daily.volumeChart.desc')
                  : t('growthAnalysis.volumeChart.desc')
              }
              badge={
                volumeGrowthPct !== null ? (
                  <span className="growth-analysis-chart-section__badge growth-analysis-kpi__value--up">
                    {formatGrowthPct(volumeGrowthPct)} {t('growthAnalysis.growth')}
                  </span>
                ) : undefined
              }
              points={volumeChartPoints}
              unit="kg"
              showTrend
              ariaLabel={
                isDailyView
                  ? t('growthAnalysis.daily.volumeChart.title')
                  : t('growthAnalysis.volumeChart.title')
              }
            />

            <GrowthChartBlock
              title={t('growthAnalysis.maxWeightChart.title')}
              description={
                isDailyView
                  ? t('growthAnalysis.daily.maxWeightChart.desc')
                  : t('growthAnalysis.maxWeightChart.desc')
              }
              points={maxWeightChartPoints}
              unit="kg"
              accentColor="var(--color-accent, #f59e0b)"
              ariaLabel={t('growthAnalysis.maxWeightChart.title')}
              headerExtra={
                currentPr !== null ? (
                  <div className="growth-analysis-pr-summary growth-analysis-pr-summary--compact">
                    <span>
                      {t('growthAnalysis.maxWeightChart.previousPr')}{' '}
                      <strong>{previousPr}kg</strong>
                    </span>
                    <span className="growth-analysis-pr-summary__arrow" aria-hidden>
                      →
                    </span>
                    <span>
                      {t('growthAnalysis.maxWeightChart.currentPr')}{' '}
                      <strong>{currentPr}kg</strong>
                    </span>
                    {maxWeightDelta !== null ? (
                      <span className="growth-analysis-kpi__value--up">
                        {formatWeightDelta(maxWeightDelta)}
                      </span>
                    ) : null}
                  </div>
                ) : undefined
              }
            />

            {isDailyView ? (
              <GrowthChartBlock
                className="growth-analysis-charts-grid__span-half"
                title={t('growthAnalysis.daily.machineChart.title')}
                description={t('growthAnalysis.daily.machineChart.desc')}
                points={machineCountChartPoints}
                unit={t('growthAnalysis.daily.machineChart.unit')}
                accentColor="var(--color-primary)"
                ariaLabel={t('growthAnalysis.daily.machineChart.title')}
              />
            ) : null}
          </section>

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
        <CollapsibleCard
          title={t('growthAnalysis.ranking.title')}
          summary={
            <span className="growth-analysis-period-note">
              {periodStart
                ? t('growthAnalysis.ranking.periodNote', { period: periodLabel })
                : t('growthAnalysis.ranking.allTimeNote')}
            </span>
          }
          defaultOpen
          className="growth-analysis-ranking"
        >
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
        </CollapsibleCard>
      ) : null}
    </div>
  );
}
