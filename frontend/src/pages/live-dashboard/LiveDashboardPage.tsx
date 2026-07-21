import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type {
  LiveChildNode,
  LiveDashboardLevel,
  LiveRankingBoard,
  LiveRankingPeriod,
  LiveScopeQuery,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { liveDashboardApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import './LiveDashboardPage.css';

function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(0);
  const frame = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.floor(target * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, durationMs]);
  return value;
}

function formatNum(n: number, locale: string): string {
  return Math.round(n).toLocaleString(locale.startsWith('ko') ? 'ko-KR' : 'en-US');
}

function heatClass(heat: number): string {
  if (heat >= 75) return 'heat-red';
  if (heat >= 50) return 'heat-orange';
  if (heat >= 25) return 'heat-yellow';
  return 'heat-green';
}

function StatValue({ value, locale }: { value: number; locale: string }) {
  const counted = useCountUp(value);
  return <span className="live-stat__value">{formatNum(counted, locale)}</span>;
}

export function LiveDashboardPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const [level, setLevel] = useState<LiveDashboardLevel>('world');
  const [scope, setScope] = useState<LiveScopeQuery>({});
  const [board, setBoard] = useState<LiveRankingBoard>('metro');
  const [period, setPeriod] = useState<LiveRankingPeriod>('today');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);

  const snapshotQuery = useQuery({
    queryKey: [...QUERY_KEYS.liveDashboard, level, scope],
    queryFn: async () => {
      const res = await liveDashboardApi.snapshot({ level, ...scope });
      return res.data.data;
    },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const rankingsQuery = useQuery({
    queryKey: [...QUERY_KEYS.liveRankings, board, period, scope],
    queryFn: async () => {
      const res = await liveDashboardApi.rankings({
        board,
        period,
        countryCode: scope.countryCode,
        metroCode: scope.metroCode,
        districtCode: scope.districtCode,
        gymId: scope.gymId,
      });
      return res.data.data;
    },
    refetchInterval: 30_000,
  });

  const searchQuery = useQuery({
    queryKey: [...QUERY_KEYS.liveSearch, debouncedSearch],
    queryFn: async () => {
      const res = await liveDashboardApi.search(debouncedSearch);
      return res.data.data;
    },
    enabled: debouncedSearch.trim().length >= 1,
    staleTime: 20_000,
  });

  const data = snapshotQuery.data;

  const drillInto = (child: LiveChildNode) => {
    if (child.level === 'country') {
      setLevel('country');
      setScope({ countryCode: child.code });
      setBoard('metro');
    } else if (child.level === 'metro') {
      setLevel('metro');
      setScope((s) => ({ ...s, metroCode: child.code, districtCode: undefined, gymId: undefined }));
      setBoard('district');
    } else if (child.level === 'district') {
      setLevel('district');
      setScope((s) => ({ ...s, districtCode: child.code, gymId: undefined }));
      setBoard('gym');
    } else if (child.level === 'gym') {
      setLevel('gym');
      setScope((s) => ({ ...s, gymId: child.code, userId: undefined }));
      setBoard('member');
    } else if (child.level === 'user') {
      setLevel('user');
      setScope((s) => ({ ...s, userId: child.code }));
    }
  };

  const goBreadcrumb = (index: number) => {
    if (!data) return;
    const item = data.breadcrumbs[index];
    if (!item) return;
    if (item.level === 'world') {
      setLevel('world');
      setScope({});
      setBoard('country');
      return;
    }
    if (item.level === 'country') {
      setLevel('country');
      setScope({ countryCode: item.code });
      setBoard('metro');
      return;
    }
    if (item.level === 'metro') {
      setLevel('metro');
      setScope((s) => ({
        countryCode: s.countryCode ?? 'KR',
        metroCode: item.code,
      }));
      setBoard('district');
      return;
    }
    if (item.level === 'district') {
      setLevel('district');
      setScope((s) => ({
        countryCode: s.countryCode ?? 'KR',
        metroCode: s.metroCode,
        districtCode: item.code,
      }));
      setBoard('gym');
      return;
    }
    if (item.level === 'gym') {
      setLevel('gym');
      setScope((s) => ({ ...s, gymId: item.code, userId: undefined }));
      setBoard('member');
    }
  };

  const maxHourly = useMemo(() => {
    if (!data?.hourly?.length) return 1;
    return Math.max(1, ...data.hourly.map((h) => h.activeUsers || h.sets));
  }, [data?.hourly]);

  const rankingBoards: { id: LiveRankingBoard; label: string }[] = [
    { id: 'country', label: t('liveDashboard.boardCountry') },
    { id: 'metro', label: t('liveDashboard.boardMetro') },
    { id: 'district', label: t('liveDashboard.boardDistrict') },
    { id: 'gym', label: t('liveDashboard.boardGym') },
    { id: 'member', label: t('liveDashboard.boardMember') },
    { id: 'machine', label: t('liveDashboard.boardMachine') },
    { id: 'brand', label: t('liveDashboard.boardBrand') },
    { id: 'muscle', label: t('liveDashboard.boardMuscle') },
  ];

  const rankingPeriods: { id: LiveRankingPeriod; label: string }[] = [
    { id: 'today', label: t('liveDashboard.periodToday') },
    { id: 'week', label: t('liveDashboard.periodWeek') },
    { id: 'month', label: t('liveDashboard.periodMonth') },
    { id: 'year', label: t('liveDashboard.periodYear') },
    { id: 'all', label: t('liveDashboard.periodAll') },
  ];

  return (
    <div className="live-dash">
      <PageShell title={t('liveDashboard.title')}>
        <div className="live-dash__top">
          <div className="live-badge pulse">
            <span className="live-badge__dot" />
            LIVE
          </div>
          <p className="live-dash__subtitle">{t('liveDashboard.subtitle')}</p>
        </div>

        <label className="live-search">
          <span className="sr-only">{t('liveDashboard.search')}</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('liveDashboard.searchPlaceholder')}
          />
        </label>
        {debouncedSearch && (searchQuery.data?.length ?? 0) > 0 && (
          <ul className="live-search__results">
            {searchQuery.data!.map((hit) => (
              <li key={`${hit.level}-${hit.code}`}>
                <button
                  type="button"
                  onClick={() => {
                    const path = hit.path;
                    const countryCode = path.find((p) => p.level === 'country')?.code;
                    const metroCode = path.find((p) => p.level === 'metro')?.code;
                    const districtCode = path.find((p) => p.level === 'district')?.code;
                    if (hit.level === 'country') {
                      setLevel('country');
                      setScope({ countryCode: hit.code });
                      setBoard('metro');
                    } else if (hit.level === 'metro') {
                      setLevel('metro');
                      setScope({ countryCode: countryCode ?? 'KR', metroCode: hit.code });
                      setBoard('district');
                    } else if (hit.level === 'district') {
                      setLevel('district');
                      setScope({
                        countryCode: countryCode ?? 'KR',
                        metroCode,
                        districtCode: hit.code,
                      });
                      setBoard('gym');
                    } else if (hit.level === 'gym') {
                      setLevel('gym');
                      setScope({
                        countryCode,
                        metroCode,
                        districtCode,
                        gymId: hit.code,
                      });
                      setBoard('member');
                    } else if (hit.level === 'user') {
                      setLevel('user');
                      setScope({ userId: hit.code });
                    }
                    setSearch('');
                  }}
                >
                  {hit.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        {snapshotQuery.isLoading || !data ? (
          <Skeleton count={6} height={72} />
        ) : (
          <>
            <nav className="live-breadcrumbs" aria-label="breadcrumb">
              {data.breadcrumbs.map((crumb, index) => (
                <button
                  key={`${crumb.level}-${crumb.code}-${index}`}
                  type="button"
                  className="live-breadcrumbs__item"
                  onClick={() => goBreadcrumb(index)}
                >
                  {index > 0 ? <span className="live-breadcrumbs__sep">›</span> : null}
                  {crumb.label}
                </button>
              ))}
            </nav>

            <header className="live-hero glass">
              <div className="live-hero__title-row">
                {data.flag ? <span className="live-hero__flag">{data.flag}</span> : null}
                <h2 className="live-hero__title">{data.title}</h2>
              </div>
              <p className="live-hero__meta">
                {t('liveDashboard.updated', {
                  time: new Date(data.refreshedAt).toLocaleTimeString(
                    locale.startsWith('ko') ? 'ko-KR' : 'en-US'
                  ),
                })}
              </p>
            </header>

            <section className="live-stats">
              {data.stats.map((stat) => (
                <article key={stat.id} className="live-stat glass">
                  <p className="live-stat__label">
                    <span aria-hidden>{stat.emoji}</span> {stat.label}
                  </p>
                  <p className="live-stat__row">
                    <StatValue value={stat.value} locale={locale} />
                    {stat.unit ? <span className="live-stat__unit">{stat.unit}</span> : null}
                  </p>
                </article>
              ))}
            </section>

            <section className="live-section">
              <h3 className="live-section__title">{t('liveDashboard.hotCards')}</h3>
              <div className="live-hot-grid">
                {data.hotCards.map((card) => (
                  <article key={card.id} className="live-hot glass">
                    <p className="live-hot__emoji" aria-hidden>
                      {card.emoji}
                    </p>
                    <p className="live-hot__title">{card.title}</p>
                    <p className="live-hot__value">{card.value}</p>
                    {card.subtitle ? <p className="live-hot__sub">{card.subtitle}</p> : null}
                  </article>
                ))}
              </div>
            </section>

            {data.children.length > 0 && (
              <section className="live-section">
                <h3 className="live-section__title">{t('liveDashboard.heatmap')}</h3>
                <div className="live-heat-grid">
                  {data.children.map((child) => (
                    <button
                      key={child.code}
                      type="button"
                      className={`live-heat-tile glass ${heatClass(child.heat)}`}
                      onClick={() => drillInto(child)}
                    >
                      <span className="live-heat-tile__name">
                        {child.flag ? `${child.flag} ` : ''}
                        {child.label}
                      </span>
                      <span className="live-heat-tile__meta">
                        👤 {child.activeNow} · {formatNum(child.volumeTodayKg, locale)} KG
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="live-section">
              <h3 className="live-section__title">{t('liveDashboard.hourly')}</h3>
              <div className="live-chart glass">
                <svg viewBox="0 0 240 80" className="live-chart__svg" role="img" aria-label="hourly">
                  {data.hourly.map((point) => {
                    const h = (Math.max(point.activeUsers, point.sets / 5) / maxHourly) * 60;
                    return (
                      <rect
                        key={point.hour}
                        x={point.hour * 10 + 1}
                        y={70 - h}
                        width={8}
                        height={Math.max(1, h)}
                        rx={2}
                        fill="rgba(74, 222, 128, 0.75)"
                      />
                    );
                  })}
                </svg>
                <div className="live-chart__axis">
                  <span>0</span>
                  <span>6</span>
                  <span>12</span>
                  <span>18</span>
                  <span>23</span>
                </div>
              </div>
            </section>

            <section className="live-section">
              <h3 className="live-section__title">{t('liveDashboard.insights')}</h3>
              <ul className="live-insights">
                {data.insights.map((insight) => (
                  <li key={insight.id} className="live-insights__item glass">
                    ✨ {insight.text}
                  </li>
                ))}
              </ul>
            </section>

            <section className="live-section">
              <h3 className="live-section__title">{t('liveDashboard.feed')}</h3>
              <ul className="live-feed">
                {data.feed.length === 0 ? (
                  <li className="live-feed__empty">{t('liveDashboard.feedEmpty')}</li>
                ) : (
                  data.feed.map((item) => (
                    <li key={item.id} className="live-feed__item glass">
                      <span aria-hidden>{item.emoji}</span>
                      <span>{item.text}</span>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="live-section">
              <h3 className="live-section__title">{t('liveDashboard.rankings')}</h3>
              <div className="live-rank-tabs">
                {rankingPeriods.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`live-rank-tabs__btn${period === item.id ? ' is-active' : ''}`}
                    onClick={() => setPeriod(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="live-rank-tabs">
                {rankingBoards.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`live-rank-tabs__btn${board === item.id ? ' is-active' : ''}`}
                    onClick={() => setBoard(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {rankingsQuery.isLoading || !rankingsQuery.data ? (
                <Skeleton count={5} height={40} />
              ) : (
                <ol className="live-rank-list">
                  {rankingsQuery.data.items.slice(0, 20).map((item) => (
                    <li key={`${item.rank}-${item.code}`} className="live-rank-list__item glass">
                      <span className="live-rank-list__rank">#{item.rank}</span>
                      <span className="live-rank-list__label">
                        {item.label}
                        {item.isMe ? ` (${t('liveDashboard.me')})` : ''}
                      </span>
                      <span className="live-rank-list__value">
                        {formatNum(item.value, locale)} {item.unit}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </PageShell>
    </div>
  );
}
