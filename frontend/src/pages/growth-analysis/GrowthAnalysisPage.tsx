import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { LineChart } from '@/components/progressive-overload/LineChart/LineChart';
import { workoutLogApi } from '@/api';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import {
  type GrowthPeriod,
  computeGrowthRanking,
  computeMachineKpis,
  detectPrAlert,
  filterLogsByPeriod,
  formatGrowthPct,
  formatShortDate,
  formatWeightDelta,
  getMachineOptions,
  getPeriodStartDate,
  getSessionsForMachine,
} from '@/utils/workoutAnalytics';
import '@/styles/growth-analysis.css';

const PERIODS: GrowthPeriod[] = ['30d', '3m', 'all'];

export function GrowthAnalysisPage() {
  const { t, i18n } = useTranslation('common');
  const [period, setPeriod] = useState<GrowthPeriod>('30d');
  const [selectedMachineCode, setSelectedMachineCode] = useState('');

  const { data: logs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['workoutLogs', 'all'],
    queryFn: async () => {
      const res = await workoutLogApi.list();
      return res.data.data ?? [];
    },
  });

  const periodLogs = useMemo(() => filterLogsByPeriod(logs, period), [logs, period]);
  const machineOptions = useMemo(() => getMachineOptions(periodLogs), [periodLogs]);

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

  const kpis = useMemo(() => computeMachineKpis(sessions), [sessions]);
  const prAlert = useMemo(
    () => (selectedMachineCode ? detectPrAlert(logs, selectedMachineCode) : null),
    [logs, selectedMachineCode]
  );
  const ranking = useMemo(() => computeGrowthRanking(logs, period), [logs, period]);

  const volumeChartPoints = useMemo(
    () =>
      sessions.map((session) => ({
        label: formatShortDate(session.logDate, i18n.language),
        value: session.totalVolume,
      })),
    [sessions, i18n.language]
  );

  const maxWeightChartPoints = useMemo(() => {
    let runningMax = 0;
    return sessions.map((session) => {
      runningMax = Math.max(runningMax, session.maxWeight);
      return {
        label: formatShortDate(session.logDate, i18n.language),
        value: runningMax,
      };
    });
  }, [sessions, i18n.language]);

  const periodLabel = t(`growthAnalysis.period.${period}`);
  const periodStart = getPeriodStartDate(period);

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
        subtitle={t('growthAnalysis.subtitle')}
      />

      <div className="growth-analysis-filters card">
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

      {machineOptions.length === 0 ? (
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
            <div className="growth-analysis-kpi card">
              <span className="growth-analysis-kpi__label">{t('growthAnalysis.kpi.volume')}</span>
              <strong
                className={`growth-analysis-kpi__value${
                  (kpis.volumeGrowthPct ?? 0) >= 0 ? ' growth-analysis-kpi__value--up' : ' growth-analysis-kpi__value--down'
                }`}
              >
                {(kpis.volumeGrowthPct ?? 0) >= 0 ? '▲ ' : '▼ '}
                {formatGrowthPct(kpis.volumeGrowthPct)}
              </strong>
            </div>
            <div className="growth-analysis-kpi card">
              <span className="growth-analysis-kpi__label">{t('growthAnalysis.kpi.maxWeight')}</span>
              <strong
                className={`growth-analysis-kpi__value${
                  (kpis.maxWeightDelta ?? 0) >= 0 ? ' growth-analysis-kpi__value--up' : ' growth-analysis-kpi__value--down'
                }`}
              >
                {(kpis.maxWeightDelta ?? 0) >= 0 ? '▲ ' : '▼ '}
                {formatWeightDelta(kpis.maxWeightDelta)}
              </strong>
            </div>
            <div className="growth-analysis-kpi card">
              <span className="growth-analysis-kpi__label">{t('growthAnalysis.kpi.workoutCount')}</span>
              <strong className="growth-analysis-kpi__value">{kpis.workoutCount}{t('growthAnalysis.kpi.times')}</strong>
            </div>
          </section>

          <p className="growth-analysis-period-note">
            {t('growthAnalysis.periodNote', { period: periodLabel })}
          </p>

          <section className="card growth-analysis-chart-section">
            <div className="growth-analysis-chart-section__header">
              <h2>{t('growthAnalysis.volumeChart.title')}</h2>
              {kpis.volumeGrowthPct !== null ? (
                <span className="growth-analysis-chart-section__badge growth-analysis-kpi__value--up">
                  {formatGrowthPct(kpis.volumeGrowthPct)} {t('growthAnalysis.growth')}
                </span>
              ) : null}
            </div>
            <p className="growth-analysis-chart-section__desc">{t('growthAnalysis.volumeChart.desc')}</p>
            {volumeChartPoints.length > 0 ? (
              <LineChart
                points={volumeChartPoints}
                unit="kg"
                showTrend
                ariaLabel={t('growthAnalysis.volumeChart.title')}
              />
            ) : (
              <p className="growth-analysis-chart-empty">{t('growthAnalysis.noDataInPeriod')}</p>
            )}
          </section>

          <section className="card growth-analysis-chart-section">
            <div className="growth-analysis-chart-section__header">
              <h2>{t('growthAnalysis.maxWeightChart.title')}</h2>
            </div>
            <p className="growth-analysis-chart-section__desc">{t('growthAnalysis.maxWeightChart.desc')}</p>
            {kpis.currentPr !== null ? (
              <div className="growth-analysis-pr-summary">
                <div>
                  <span>{t('growthAnalysis.maxWeightChart.previousPr')}</span>
                  <strong>{kpis.previousPr ?? sessions[0]?.maxWeight ?? 0}kg</strong>
                </div>
                <div>
                  <span>{t('growthAnalysis.maxWeightChart.currentPr')}</span>
                  <strong>{kpis.currentPr}kg</strong>
                </div>
                {kpis.maxWeightDelta !== null ? (
                  <div className="growth-analysis-kpi__value--up">
                    {formatWeightDelta(kpis.maxWeightDelta)} {t('growthAnalysis.maxWeightChart.rise')}
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
