import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  isAllGymsId,
  MACHINE_RARITY_GRADES,
  MACHINE_RARITY_META,
  type MachineRarityGrade,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Icon } from '@/components/icons/Icon';
import { RarityBadge } from '@/components/machine-showcase/RarityBadge';
import { machineShowcaseApi } from '@/api/machine-showcase.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { resolveShowcaseMediaUrl } from '@/utils/showcaseMediaUrl';
import '@/styles/components.css';
import '@/styles/machine-showcase.css';

function formatDiscoveredAt(iso: string, locale: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function MachineDexPage() {
  const { t, i18n } = useTranslation('community');
  const { t: tc } = useTranslation('common');
  const { t: tm } = useTranslation('machines');
  const { activeGymId, gyms } = useActiveGym();
  const [gradeFilter, setGradeFilter] = useState<MachineRarityGrade | 'ALL'>('ALL');
  const dexQuery = useQuery({
    queryKey: QUERY_KEYS.machineDex,
    queryFn: async () => (await machineShowcaseApi.myDex()).data.data,
  });
  const holdingsQuery = useQuery({
    queryKey: QUERY_KEYS.machineShowcaseHoldings(activeGymId),
    queryFn: async () => (await machineShowcaseApi.myGymHoldings(activeGymId!)).data.data,
    enabled: Boolean(activeGymId) && !isAllGymsId(activeGymId),
  });

  const allItems = dexQuery.data?.items ?? [];
  const items = useMemo(() => {
    if (gradeFilter === 'ALL') return allItems;
    return allItems.filter((item) => item.grade === gradeFilter);
  }, [allItems, gradeFilter]);

  const dex = dexQuery.data;
  const found = dex?.discovered ?? 0;
  const total = dex?.catalogTotal ?? 0;
  const remain = Math.max(0, total - found);
  const pct = total > 0 ? Math.min(100, Math.round((found / total) * 100)) : 0;
  const holdings = holdingsQuery.data;
  const muscleLabel = (group: string) => {
    const key = `muscleGroups.${group}`;
    const label = tm(key);
    return label === key ? group : label;
  };

  if (dexQuery.isLoading) {
    return (
      <div className="showcase-page showcase-page--dex">
        <PageShell>
          <Skeleton height={56} />
          <Skeleton height={140} />
          <Skeleton height={72} />
          <Skeleton count={4} height={168} />
        </PageShell>
      </div>
    );
  }

  if (dexQuery.isError) {
    return (
      <div className="showcase-page showcase-page--dex">
        <PageShell>
          <nav className="showcase-dex__nav">
            <Link to={ROUTES.MY_PAGE} className="showcase-dex__back">
              <Icon name="chevronLeft" size={18} aria-hidden />
              {t('showcase.dexBack')}
            </Link>
          </nav>
          <div className="showcase-empty-state">
            <strong>{t('showcase.dexLoadFailed')}</strong>
            <button type="button" className="btn btn--secondary" onClick={() => void dexQuery.refetch()}>
              {tc('actions.retry')}
            </button>
          </div>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="showcase-page showcase-page--dex">
      <PageShell>
        <nav className="showcase-dex__nav">
          <Link to={ROUTES.MY_PAGE} className="showcase-dex__back">
            <Icon name="chevronLeft" size={18} aria-hidden />
            {t('showcase.dexBack')}
          </Link>
          <Link to={ROUTES.MACHINE_SHOWCASE_WRITE} className="showcase-dex__write">
            {t('showcase.writeCtaShort')}
          </Link>
        </nav>

        <header className="showcase-dex__head">
          <h1 className="showcase-dex__title">{t('showcase.dexTitle')}</h1>
          <p className="showcase-dex__sub">{t('showcase.dexSubtitle')}</p>
        </header>

        <section className="showcase-dex-hero" aria-label={t('showcase.dexProgress', { found, total })}>
          <div className="showcase-dex-hero__top">
            <p className="showcase-dex-hero__frac">
              <strong>{found}</strong>
              <span> / {total}</span>
            </p>
            <span className="showcase-dex-hero__pct">{pct}%</span>
          </div>
          <div className="showcase-dex__bar" aria-hidden>
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className="showcase-dex-hero__meta">
            <span>{t('showcase.dexFoundChip', { count: found })}</span>
            <span>{t('showcase.dexRemainChip', { count: remain })}</span>
          </div>
        </section>

        {holdings ? (
          <section className="showcase-dex-gym" aria-label={holdings.userGymName}>
            <div className="showcase-dex-gym__head">
              <h2>{holdings.userGymName}</h2>
              <p>{t('showcase.holdingCount', { count: holdings.total })}</p>
            </div>
            {holdings.byMuscle.length > 0 ? (
              <ul className="showcase-dex-gym__muscles">
                {holdings.byMuscle.slice(0, 6).map((m) => (
                  <li key={m.muscleGroup}>
                    {muscleLabel(m.muscleGroup)} {m.count}
                  </li>
                ))}
              </ul>
            ) : null}
            {holdings.recent.length > 0 ? (
              <p className="showcase-dex-gym__recent">
                {t('showcase.recentMachines')}:{' '}
                {holdings.recent
                  .slice(0, 3)
                  .map((m) => m.machineName)
                  .join(' · ')}
              </p>
            ) : null}
          </section>
        ) : gyms.length === 0 ? (
          <section className="showcase-dex-gym showcase-dex-gym--empty">
            <p>{t('showcase.needGym')}</p>
            <Link to={ROUTES.SETTINGS} className="btn btn--secondary">
              {t('showcase.dexGoSettings')}
            </Link>
          </section>
        ) : null}

        <section className="showcase-dex-filter" aria-label={t('showcase.dexGradeFilter')}>
          <h2>{t('showcase.dexGradeFilter')}</h2>
          <div className="showcase-dex__grades" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={gradeFilter === 'ALL'}
              className={gradeFilter === 'ALL' ? 'is-on' : ''}
              onClick={() => setGradeFilter('ALL')}
            >
              <span>{t('showcase.dexAll')}</span>
              <em>{found}</em>
            </button>
            {MACHINE_RARITY_GRADES.map((grade) => {
              const count = dex?.byGrade[grade] ?? 0;
              return (
                <button
                  key={grade}
                  type="button"
                  role="tab"
                  aria-selected={gradeFilter === grade}
                  className={gradeFilter === grade ? 'is-on' : ''}
                  style={{ ['--rarity-swatch' as string]: MACHINE_RARITY_META[grade].swatch }}
                  onClick={() => setGradeFilter(gradeFilter === grade ? 'ALL' : grade)}
                >
                  <span>{t(`showcase.grades.${grade}`)}</span>
                  <em>{count}</em>
                </button>
              );
            })}
          </div>
        </section>

        <section className="showcase-dex-collection">
          <h2>
            {t('showcase.dexCollection')}
            <span>{items.length}</span>
          </h2>

          {allItems.length === 0 ? (
            <div className="showcase-empty-state">
              <strong>{t('showcase.dexEmpty')}</strong>
              <p>{t('showcase.dexEmptyHint')}</p>
              <Link to={ROUTES.MACHINE_SHOWCASE_WRITE} className="btn btn--primary">
                {t('showcase.writeCtaShort')}
              </Link>
            </div>
          ) : items.length === 0 ? (
            <div className="showcase-empty-state">
              <strong>{t('showcase.dexFilterEmpty')}</strong>
              <button type="button" className="btn btn--secondary" onClick={() => setGradeFilter('ALL')}>
                {t('showcase.dexAll')}
              </button>
            </div>
          ) : (
            <div className="showcase-dex-feed">
              {items.map((item) => {
                const rankLabel =
                  item.discoveryRank === 1
                    ? t('showcase.dexFirst')
                    : item.discoveryRank
                      ? t('showcase.finderRank', { rank: item.discoveryRank })
                      : null;
                return (
                  <Link
                    key={item.machineId}
                    className={`showcase-card showcase-dex-card showcase-card--${item.grade.toLowerCase()}`}
                    to={ROUTES.MACHINE_DETAIL.replace(':machineCode', item.machineCode)}
                  >
                    <div className="showcase-card__media">
                      {item.coverThumbUrl ? (
                        <img
                          className="showcase-card__img"
                          src={resolveShowcaseMediaUrl(item.coverThumbUrl)}
                          alt=""
                          loading="lazy"
                        />
                      ) : (
                        <div className="showcase-card__placeholder" aria-hidden />
                      )}
                      <RarityBadge grade={item.grade} compact />
                      {item.discoveryRank === 1 ? (
                        <span className="showcase-dex__first" aria-hidden>
                          🥇
                        </span>
                      ) : null}
                    </div>
                    <div className="showcase-dex-card__body">
                      <strong>{item.machineName}</strong>
                      <span className="showcase-dex-card__brand">{item.brandName || '\u00a0'}</span>
                      <p className="showcase-dex-card__meta">
                        {[
                          rankLabel,
                          item.gymHoldingCount > 0
                            ? t('showcase.dexGyms', { count: item.gymHoldingCount })
                            : null,
                          item.discoveredAt ? formatDiscoveredAt(item.discoveredAt, i18n.language) : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || '\u00a0'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </PageShell>
    </div>
  );
}
