import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type {
  GrowthChartMetric,
  GrowthTimelinePeriod,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { LineChart } from '@/components/progressive-overload/LineChart/LineChart';
import { growthTimelineApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { buildGrowthTimelineShareCard } from '@/utils/growthTimelineShareCard';
import './GrowthTimelinePage.css';

function loc(text: { ko: string; en: string } | undefined | null, locale: string): string {
  if (!text) return '';
  return locale.startsWith('ko') ? text.ko : text.en;
}

function formatInt(n: number, locale: string): string {
  return Math.floor(n).toLocaleString(locale.startsWith('ko') ? 'ko-KR' : 'en-US');
}

const CHART_METRICS: GrowthChartMetric[] = [
  'max_weight',
  'volume',
  'workouts',
  'duration',
  'prs',
  'frequency',
  'machines',
  'brands',
  'upper_lower',
  'intensity',
];

const PERIODS: GrowthTimelinePeriod[] = ['day', 'week', 'month', 'year'];

export function GrowthTimelinePage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const showToast = useUIStore((s) => s.showToast);
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<GrowthTimelinePeriod>('month');
  const [metric, setMetric] = useState<GrowthChartMetric>('volume');
  const [wrappedIdx, setWrappedIdx] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.growthTimeline,
    queryFn: async () => {
      const res = await growthTimelineApi.snapshot();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const chartSeries = useMemo(() => {
    if (!data) return null;
    return data.charts[period]?.find((s) => s.metric === metric) ?? null;
  }, [data, period, metric]);

  const headline = data?.headlines[0] ? loc(data.headlines[0].text, locale) : '';

  const handleShare = async () => {
    if (!data) return;
    try {
      const blob = await buildGrowthTimelineShareCard({
        locale,
        displayName: user?.displayName ?? 'MachineFit',
        journeyDays: data.shareSummary.journeyDays,
        workouts: data.shareSummary.workouts,
        volumeKg: data.shareSummary.volumeKg,
        topMachineName: data.shareSummary.topMachineName,
        bestGrowthPct: data.shareSummary.bestGrowthPct,
        headline,
      });
      const file = new File([blob], 'machinefit-growth.png', { type: 'image/png' });
      const text = t('growthTimeline.shareText', {
        days: data.shareSummary.journeyDays,
        workouts: data.shareSummary.workouts,
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: 'MachineFit' });
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'machinefit-growth.png';
      a.click();
      URL.revokeObjectURL(url);
      await navigator.clipboard?.writeText(text).catch(() => undefined);
      showToast(t('growthTimeline.shareSaved'), 'success');
    } catch {
      showToast(t('growthTimeline.shareFailed'), 'error');
    }
  };

  const wrappedSlides = data?.wrapped?.slides ?? [];
  const wrappedSlide = wrappedSlides[wrappedIdx] ?? null;

  return (
    <PageShell title={t('growthTimeline.title')}>
      <div className="gt-page">
        {isLoading && <Skeleton count={6} height={80} />}
        {isError && <p className="form-error-summary">{t('growthTimeline.loadError')}</p>}

        {data && (
          <>
            <section className="gt-hero">
              <p className="gt-hero__eyebrow">{t('growthTimeline.eyebrow')}</p>
              <h2 className="gt-hero__title">{t('growthTimeline.heroTitle')}</h2>
              <div className="gt-headlines">
                {data.headlines.map((h) => (
                  <article key={h.id} className="gt-headline">
                    <span className="gt-headline__emoji" aria-hidden>
                      {h.emoji}
                    </span>
                    <p className="gt-headline__text">{loc(h.text, locale)}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.timeline')}</h3>
              <div className="gt-timeline">
                {data.timeline.map((event) => (
                  <div key={event.id} className="gt-timeline__item">
                    <div className="gt-timeline__dot" aria-hidden>
                      {event.emoji}
                    </div>
                    <div>
                      <p className="gt-timeline__date">{event.date}</p>
                      <p className="gt-timeline__title">{loc(event.title, locale)}</p>
                      <p className="gt-timeline__desc">{loc(event.description, locale)}</p>
                    </div>
                  </div>
                ))}
                {!data.timeline.length && (
                  <p className="gt-section__desc">{t('growthTimeline.emptyTimeline')}</p>
                )}
              </div>
            </section>

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.beforeNow')}</h3>
              <div className="gt-compare-grid">
                {data.beforeNow.map((item) => (
                  <article key={item.id} className="gt-compare-card">
                    <p className="gt-compare-card__label">{loc(item.label, locale)}</p>
                    <div className="gt-compare-card__row">
                      <span>
                        {t('growthTimeline.then')}: {item.beforeValue}
                      </span>
                      <span>
                        {t('growthTimeline.now')}: {item.nowValue}
                      </span>
                    </div>
                    {item.deltaPct != null && (
                      <p
                        className={`gt-compare-card__delta${item.deltaPct < 0 ? ' is-down' : ''}`}
                      >
                        {item.deltaPct > 0 ? '+' : ''}
                        {item.deltaPct}%
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.charts')}</h3>
              <div className="gt-chart-toolbar">
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`gt-chip${period === p ? ' gt-chip--active' : ''}`}
                    onClick={() => setPeriod(p)}
                  >
                    {t(`growthTimeline.period.${p}`)}
                  </button>
                ))}
              </div>
              <div className="gt-chart-toolbar">
                {CHART_METRICS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`gt-chip${metric === m ? ' gt-chip--active' : ''}`}
                    onClick={() => setMetric(m)}
                  >
                    {t(`growthTimeline.metric.${m}`)}
                  </button>
                ))}
              </div>
              {chartSeries && chartSeries.points.length > 0 ? (
                <LineChart
                  points={chartSeries.points}
                  unit={chartSeries.unit}
                  showTrend
                  accentColor="#0f766e"
                  ariaLabel={t(`growthTimeline.metric.${metric}`)}
                  size="large"
                />
              ) : (
                <p className="gt-section__desc">{t('growthTimeline.emptyChart')}</p>
              )}
            </section>

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.insights')}</h3>
              <div className="gt-insight-list">
                {data.insights.map((insight) => (
                  <article key={insight.id} className="gt-insight">
                    {insight.emoji} {loc(insight.text, locale)}
                  </article>
                ))}
              </div>
            </section>

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.highlights')}</h3>
              <div className="gt-highlight-grid">
                {data.highlights.map((h) => (
                  <article key={h.id} className="gt-highlight-card">
                    <div className="gt-highlight-card__emoji" aria-hidden>
                      {h.emoji}
                    </div>
                    <p className="gt-highlight-card__title">{loc(h.title, locale)}</p>
                    <p className="gt-highlight-card__value">{h.value}</p>
                    <p className="gt-highlight-card__detail">{loc(h.detail, locale)}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.machines')}</h3>
              <div className="gt-machine-list">
                {data.machineHistories.slice(0, 8).map((m) => (
                  <article key={m.machineCode} className="gt-compare-card">
                    <p className="gt-machine-card__name">{m.machineName}</p>
                    <p className="gt-machine-card__meta">
                      {Math.round(m.firstKg)}kg → {Math.round(m.currentKg)}kg · +{m.growthPct}%
                    </p>
                    <div className="gt-machine-steps">
                      {m.points.map((p) => (
                        <span key={`${m.machineCode}-${p.date}-${p.maxKg}`}>
                          {Math.round(p.maxKg)}kg
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.style')}</h3>
              <div className="gt-style-flow">
                {data.styleEvolution.map((phase) => (
                  <article key={phase.id} className="gt-style-card">
                    <p className="gt-style-card__phase">{loc(phase.periodLabel, locale)}</p>
                    <p className="gt-style-card__style">{loc(phase.style, locale)}</p>
                    <p className="gt-style-card__detail">{loc(phase.detail, locale)}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.monthly')}</h3>
              <div className="gt-month-grid">
                {[...data.monthlyReports].reverse().slice(0, 6).map((r) => (
                  <article key={r.yearMonth} className="gt-month-card">
                    <p className="gt-month-card__ym">{r.yearMonth}</p>
                    <div className="gt-month-card__stats">
                      <span>
                        {t('growthTimeline.workouts')}: {formatInt(r.workouts, locale)}
                      </span>
                      <span>
                        {t('growthTimeline.volume')}:{' '}
                        {(r.volumeKg / 1000).toLocaleString(locale.startsWith('ko') ? 'ko-KR' : 'en-US', {
                          maximumFractionDigits: 1,
                        })}
                        t
                      </span>
                      <span>
                        PR: {formatInt(r.prCount, locale)}
                      </span>
                      <span>
                        {t('growthTimeline.topMachine')}: {r.topMachineName ?? '-'}
                      </span>
                      <span>
                        {t('growthTimeline.avgMinutes')}: {r.avgMinutes}
                        {locale.startsWith('ko') ? '분' : 'm'}
                      </span>
                      {r.vsPrevMonthPct != null && (
                        <span>
                          {t('growthTimeline.vsPrev')}: {r.vsPrevMonthPct > 0 ? '+' : ''}
                          {r.vsPrevMonthPct}%
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {data.wrapped && wrappedSlide && (
              <section className="gt-section">
                <h3 className="gt-section__title">
                  {t('growthTimeline.wrapped', { year: data.wrapped.year })}
                </h3>
                <div className="gt-wrapped">
                  <div className="gt-wrapped__stage" key={wrappedSlide.id}>
                    <div className="gt-wrapped__emoji">{wrappedSlide.emoji}</div>
                    <p className="gt-wrapped__title">{loc(wrappedSlide.title, locale)}</p>
                    <p className="gt-wrapped__value">{wrappedSlide.value}</p>
                    {wrappedSlide.subtitle && (
                      <p className="gt-wrapped__sub">{loc(wrappedSlide.subtitle, locale)}</p>
                    )}
                  </div>
                  <div className="gt-wrapped__nav">
                    <button
                      type="button"
                      className="btn"
                      disabled={wrappedIdx <= 0}
                      onClick={() => setWrappedIdx((i) => Math.max(0, i - 1))}
                    >
                      {t('growthTimeline.prev')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={wrappedIdx >= wrappedSlides.length - 1}
                      onClick={() =>
                        setWrappedIdx((i) => Math.min(wrappedSlides.length - 1, i + 1))
                      }
                    >
                      {t('growthTimeline.next')}
                    </button>
                  </div>
                </div>
              </section>
            )}

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.forecast')}</h3>
              <p className="gt-forecast-note">{loc(data.forecast.disclaimer, locale)}</p>
              <div className="gt-compare-grid">
                {data.forecast.items.map((item) => (
                  <article key={item.id} className="gt-forecast-card">
                    <p className="gt-peer-card__label">
                      {loc(item.label, locale)} · {loc(item.horizon, locale)}
                    </p>
                    <p className="gt-peer-card__value">{item.predicted}</p>
                    <p className="gt-peer-card__detail">
                      {t('growthTimeline.now')}: {item.current}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.compare')}</h3>
              <div className="gt-compare-grid">
                {data.comparisons.map((c) => (
                  <article key={c.id} className="gt-peer-card">
                    <p className="gt-peer-card__label">{loc(c.label, locale)}</p>
                    <p className={`gt-peer-card__value${c.deltaPct < 0 ? ' is-down' : ''}`}>
                      {c.deltaPct > 0 ? '+' : ''}
                      {c.deltaPct}%
                    </p>
                    <p className="gt-peer-card__detail">{loc(c.detail, locale)}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="gt-section">
              <h3 className="gt-section__title">{t('growthTimeline.memories')}</h3>
              <div className="gt-memory-rail">
                {data.memories.map((m) => (
                  <article key={m.id} className="gt-memory">
                    <p className="gt-memory__date">
                      {m.emoji} {m.date}
                    </p>
                    <p className="gt-memory__title">{loc(m.title, locale)}</p>
                    <p className="gt-memory__detail">{loc(m.detail, locale)}</p>
                  </article>
                ))}
              </div>
            </section>

            <div className="gt-actions">
              <button type="button" className="btn btn--primary btn--block" onClick={handleShare}>
                {t('growthTimeline.share')}
              </button>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
