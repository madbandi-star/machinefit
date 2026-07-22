import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { GrowthChartBlock } from '@/components/progressive-overload/GrowthChartBlock/GrowthChartBlock';
import { CollapsibleCard } from '@/components/progressive-overload/CollapsibleCard/CollapsibleCard';
import { DailyBreakdownList } from '@/components/progressive-overload/DailyBreakdownList/DailyBreakdownList';
import { fetchWorkoutLogs } from '@/api/workout-log';
import { QUERY_KEYS } from '@/constants/query-keys';
import { GrowthInsightsPanel } from '@/components/progressive-overload/GrowthInsightsPanel/GrowthInsightsPanel';
import { fetchWorkoutInsights } from '@/api/growth-insights';
import { useAuthStore } from '@/store/auth.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { GrowthPeriodFilter } from '@/components/progressive-overload/GrowthPeriodFilter/GrowthPeriodFilter';
import { GrowthMachineSelector } from '@/components/progressive-overload/GrowthMachineSelector/GrowthMachineSelector';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import {
  type GrowthPeriod,
  type GrowthPeriodFilter as GrowthPeriodFilterState,
  type GrowthViewMode,
  type MachineOption,
  aggregateDailySessions,
  computeDailyKpis,
  computeGrowthRanking,
  computeMachineKpis,
  detectDailyPeakAlert,
  detectPrAlert,
  extractWorkoutLogDateKeys,
  filterLogsByGrowthPeriod,
  formatGrowthPct,
  formatShortDate,
  formatWeightDelta,
  getDailyMaxWeightChartPoints,
  getDefaultCustomRange,
  getMachineOptions,
  getSessionsForMachineOption,
  resolveGrowthPeriodBounds,
} from '@/utils/workoutAnalytics';
import { formatFreeWeightRecordLabel, formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import { formatHistoryDateHeader } from '@/utils/historyDate';
import '@/styles/growth-analysis.css';

const VIEW_MODES: GrowthViewMode[] = ['daily', 'machine'];
const GROWTH_LOG_LIMIT = 500;
const DEFAULT_GROWTH_LOOKBACK_DAYS = 365;

function getDateKeyDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
  const { t, i18n } = useTranslation(['common', 'machines']);
  const user = useAuthStore((s) => s.user);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const memberKey = activeMemberId ?? '';
  const [periodPreset, setPeriodPreset] = useState<GrowthPeriod>('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [viewMode, setViewMode] = useState<GrowthViewMode>('daily');
  const [selectedMachineKey, setSelectedMachineKey] = useState('');

  const translateMuscleGroup = (group: string) =>
    t(`machines:muscleGroups.${group}`, { defaultValue: group });

  const formatMachineOptionLabel = (option: MachineOption) => {
    const branded = formatBrandedMachineLabel(
      option.machineName,
      option.brandName,
      option.machineCode
    );
    return option.targetMuscleGroup
      ? formatFreeWeightRecordLabel(
          branded,
          option.targetMuscleGroup,
          translateMuscleGroup
        )
      : branded;
  };

  const periodFilter: GrowthPeriodFilterState = useMemo(
    () => ({
      preset: periodPreset,
      customFrom: periodPreset === 'custom' ? customFrom : undefined,
      customTo: periodPreset === 'custom' ? customTo : undefined,
    }),
    [periodPreset, customFrom, customTo]
  );

  const logsQueryOptions = useMemo(() => {
    if (periodPreset === 'all') {
      return { limit: GROWTH_LOG_LIMIT };
    }

    if (periodPreset === 'custom' && !(customFrom && customTo)) {
      return {
        from: getDateKeyDaysAgo(DEFAULT_GROWTH_LOOKBACK_DAYS),
        to: getDateKeyDaysAgo(0),
        limit: GROWTH_LOG_LIMIT,
      };
    }

    const { from, to } = resolveGrowthPeriodBounds(periodFilter);
    return {
      from: from ?? undefined,
      to,
      limit: GROWTH_LOG_LIMIT,
    };
  }, [customFrom, customTo, periodFilter, periodPreset]);

  const { data: logs = [], isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.workoutLogsList(activeGymId ?? '', memberKey, logsQueryOptions),
    queryFn: () =>
      fetchWorkoutLogs({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        ...logsQueryOptions,
      }),
    enabled: Boolean(activeGymId) && memberScopeReady,
  });

  const datesWithData = useMemo(() => extractWorkoutLogDateKeys(logs), [logs]);

  const periodLogs = useMemo(
    () => filterLogsByGrowthPeriod(logs, periodFilter),
    [logs, periodFilter]
  );
  const machineOptions = useMemo(() => getMachineOptions(logs), [logs]);
  const machineSelectorOptions = useMemo(
    () =>
      machineOptions.map((option) => ({
        optionKey: option.optionKey,
        label: formatMachineOptionLabel(option),
        isFreeWeight: isFreeWeightMachineCode(option.machineCode),
        targetMuscleGroup: option.targetMuscleGroup,
      })),
    [machineOptions, t]
  );
  const dailyPoints = useMemo(() => aggregateDailySessions(periodLogs), [periodLogs]);
  const isDailyView = viewMode === 'daily';

  useEffect(() => {
    if (machineOptions.length === 0) {
      setSelectedMachineKey('');
      return;
    }
    if (!machineOptions.some((option) => option.optionKey === selectedMachineKey)) {
      setSelectedMachineKey(machineOptions[0].optionKey);
    }
  }, [machineOptions, selectedMachineKey]);

  const selectedMachineOption = useMemo(
    () => machineOptions.find((option) => option.optionKey === selectedMachineKey),
    [machineOptions, selectedMachineKey]
  );

  const sessions = useMemo(
    () =>
      selectedMachineOption
        ? getSessionsForMachineOption(periodLogs, selectedMachineOption)
        : [],
    [periodLogs, selectedMachineOption]
  );

  const machineKpis = useMemo(() => computeMachineKpis(sessions), [sessions]);
  const dailyKpis = useMemo(
    () => computeDailyKpis(dailyPoints, periodLogs.length),
    [dailyPoints, periodLogs.length]
  );

  const prAlert = useMemo(() => {
    if (isDailyView) {
      return detectDailyPeakAlert(dailyPoints);
    }
    return selectedMachineOption
      ? detectPrAlert(
          logs,
          selectedMachineOption.machineCode,
          selectedMachineOption.targetMuscleGroup
        )
      : null;
  }, [isDailyView, dailyPoints, logs, selectedMachineOption]);
  const ranking = useMemo(() => computeGrowthRanking(logs, periodFilter), [logs, periodFilter]);

  const selectedMachineName = selectedMachineOption
    ? formatMachineOptionLabel(selectedMachineOption)
    : undefined;

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
    queryKey: QUERY_KEYS.workoutInsights(
      activeGymId ?? '',
      memberKey,
      isDailyView ? 'daily' : 'machine',
      selectedMachineOption?.machineCode ?? '',
      selectedMachineOption?.targetMuscleGroup ?? '',
      periodPreset,
      customFrom,
      customTo
    ),
    queryFn: () =>
      fetchWorkoutInsights({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        viewMode: isDailyView ? 'daily' : 'machine',
        machineCode: isDailyView ? undefined : selectedMachineOption?.machineCode,
        targetMuscleGroup: isDailyView ? undefined : selectedMachineOption?.targetMuscleGroup,
        period: periodPreset,
        customFrom: periodPreset === 'custom' ? customFrom : undefined,
        customTo: periodPreset === 'custom' ? customTo : undefined,
        user,
        logs: periodLogs,
        machineName: selectedMachineName,
      }),
    enabled:
      Boolean(activeGymId) &&
      memberScopeReady &&
      (periodPreset !== 'custom' || Boolean(customFrom && customTo)
        ? isDailyView || Boolean(selectedMachineOption)
        : false),
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

  if (!activeGymId || !memberScopeReady || isLoading) {
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
          <GrowthMachineSelector
            label={t('growthAnalysis.machineSelect')}
            options={machineSelectorOptions}
            value={selectedMachineKey}
            onChange={setSelectedMachineKey}
            disabled={machineOptions.length === 0}
          />
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
          <Link to={ROUTES.MACHINES} className="btn btn--primary">
            {t('growthAnalysis.emptyCta', { defaultValue: t('nav.search') })}
          </Link>
        </div>
      ) : (
        <>
          {prAlert ? (
            <div className="card growth-analysis-pr-alert" role="status">
              <p className="growth-analysis-pr-alert__title">{t('growthAnalysis.prAlert.title')}</p>
              {isDailyView ? (
                <p className="growth-analysis-pr-alert__machine">
                  {t('growthAnalysis.daily.prAlert.desc', {
                    date: formatShortDate(prAlert.achievedDate, i18n.language),
                  })}
                </p>
              ) : (
                <p className="growth-analysis-pr-alert__machine">
                  {selectedMachineName ??
                    formatBrandedMachineLabel(
                      prAlert.machineName,
                      prAlert.brandName,
                      prAlert.machineCode
                    )}
                </p>
              )}
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
            className={`growth-analysis-charts-grid${
              isDailyView ? ' growth-analysis-charts-grid--daily' : ' growth-analysis-charts-grid--machine'
            }`}
            aria-label={t('growthAnalysis.kpiSection')}
          >
            {isDailyView ? (
              <GrowthChartBlock
                className="growth-chart-block--daily-primary"
                title={t('growthAnalysis.daily.volumeChart.title')}
                description={t('growthAnalysis.daily.volumeChart.desc')}
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
                ariaLabel={t('growthAnalysis.daily.volumeChart.title')}
              />
            ) : (
              <>
                <GrowthChartBlock
                  className="growth-chart-block--chart-secondary"
                  chartSize="micro"
                  title={t('growthAnalysis.volumeChart.title')}
                  description={t('growthAnalysis.volumeChart.desc')}
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
                  ariaLabel={t('growthAnalysis.volumeChart.title')}
                />
                <GrowthChartBlock
                  className="growth-chart-block--chart-secondary"
                  chartSize="micro"
                  title={t('growthAnalysis.maxWeightChart.title')}
                  description={t('growthAnalysis.maxWeightChart.desc')}
                  points={maxWeightChartPoints}
                  unit="kg"
                  accentColor="var(--color-accent, #f59e0b)"
                  ariaLabel={t('growthAnalysis.maxWeightChart.title')}
                />
              </>
            )}

            {isDailyView ? (
              <>
                <GrowthChartBlock
                  className="growth-chart-block--chart-secondary"
                  chartSize="micro"
                  title={t('growthAnalysis.daily.maxWeightChart.title')}
                  description={t('growthAnalysis.daily.maxWeightChart.desc')}
                  points={maxWeightChartPoints}
                  unit="kg"
                  accentColor="var(--color-accent, #f59e0b)"
                  ariaLabel={t('growthAnalysis.daily.maxWeightChart.title')}
                />
                <GrowthChartBlock
                  className="growth-chart-block--chart-secondary"
                  chartSize="micro"
                  title={t('growthAnalysis.daily.machineChart.title')}
                  description={t('growthAnalysis.daily.machineChart.desc')}
                  points={machineCountChartPoints}
                  unit={t('growthAnalysis.daily.machineChart.unit')}
                  accentColor="var(--color-primary)"
                  ariaLabel={t('growthAnalysis.daily.machineChart.title')}
                />
              </>
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

      {!isDailyView && ranking.length > 0 ? (
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
              <li key={item.optionKey}>
                <button
                  type="button"
                  className={`growth-analysis-ranking__item growth-analysis-ranking__item--selectable${
                    item.optionKey === selectedMachineKey
                      ? ' growth-analysis-ranking__item--active'
                      : ''
                  }`}
                  onClick={() => setSelectedMachineKey(item.optionKey)}
                >
                  <span className="growth-analysis-ranking__rank">{index + 1}</span>
                  <div className="growth-analysis-ranking__info">
                    <strong>
                      {item.targetMuscleGroup
                        ? formatFreeWeightRecordLabel(
                            formatBrandedMachineLabel(
                              item.machineName,
                              item.brandName,
                              item.machineCode
                            ),
                            item.targetMuscleGroup,
                            translateMuscleGroup
                          )
                        : formatBrandedMachineLabel(
                            item.machineName,
                            item.brandName,
                            item.machineCode
                          )}
                    </strong>
                    <span className="growth-analysis-kpi__value--up">
                      {formatGrowthPct(item.growthPct)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </CollapsibleCard>
      ) : null}
    </div>
  );
}
