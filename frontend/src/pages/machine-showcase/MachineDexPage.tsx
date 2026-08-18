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
import { RarityBadge } from '@/components/machine-showcase/RarityBadge';
import { machineShowcaseApi } from '@/api/machine-showcase.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { resolveShowcaseMediaUrl } from '@/utils/showcaseMediaUrl';
import '@/styles/components.css';
import '@/styles/machine-showcase.css';

const GRADE_MARK: Record<MachineRarityGrade, string> = {
  COMMON: '○',
  UNCOMMON: '◇',
  RARE: '◆',
  EPIC: '✦',
  LEGENDARY: '★',
  MYTHIC: '✸',
  UNIQUE: '❖',
};

export function MachineDexPage() {
  const { t } = useTranslation('community');
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

  const items = useMemo(() => {
    const all = dexQuery.data?.items ?? [];
    if (gradeFilter === 'ALL') return all;
    return all.filter((item) => item.grade === gradeFilter);
  }, [dexQuery.data?.items, gradeFilter]);

  if (dexQuery.isLoading) return <Skeleton count={4} height={80} />;
  const dex = dexQuery.data;
  const found = dex?.discovered ?? 0;
  const total = dex?.catalogTotal ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((found / total) * 100)) : 0;
  const holdings = holdingsQuery.data;

  return (
    <div className="showcase-page showcase-page--dex">
      <PageShell>
        <header className="showcase-dex__head">
          <div>
            <h1 className="showcase-dex__title">{t('showcase.dexTitle')}</h1>
            <p className="showcase-dex__sub">{t('showcase.dexSubtitle')}</p>
          </div>
          <p className="showcase-dex__count">
            {t('showcase.dexProgress', { found, total })}
          </p>
        </header>

        <div className="showcase-dex__bar" aria-hidden>
          <span style={{ width: `${pct}%` }} />
        </div>

        <div className="showcase-dex__grades" role="tablist" aria-label={t('showcase.dexTitle')}>
          <button
            type="button"
            role="tab"
            aria-selected={gradeFilter === 'ALL'}
            className={gradeFilter === 'ALL' ? 'is-on' : ''}
            onClick={() => setGradeFilter('ALL')}
          >
            {t('showcase.dexAll')} {found}
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
                <span aria-hidden>{GRADE_MARK[grade]}</span>
                {count}
              </button>
            );
          })}
        </div>

        {holdings ? (
          <p className="showcase-dex__hold">
            {holdings.userGymName} · {t('showcase.holdingCount', { count: holdings.total })}
            {holdings.byMuscle.length
              ? ` · ${holdings.byMuscle
                  .slice(0, 4)
                  .map((m) => `${m.muscleGroup} ${m.count}`)
                  .join(' · ')}`
              : ''}
          </p>
        ) : gyms.length === 0 ? (
          <p className="showcase-dex__hold showcase-dex__hold--muted">{t('showcase.needGym')}</p>
        ) : null}

        {items.length === 0 ? (
          <div className="showcase-empty-state">
            <strong>{t('showcase.dexEmpty')}</strong>
            <Link to={ROUTES.MACHINE_SHOWCASE_WRITE} className="btn btn--primary">
              {t('showcase.writeCtaShort')}
            </Link>
          </div>
        ) : (
          <div className="showcase-dex-feed">
            {items.map((item) => (
              <Link
                key={item.machineId}
                className={`showcase-card showcase-card--${item.grade.toLowerCase()}`}
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
                    <span className="showcase-dex__first" aria-label={t('showcase.firstFinder')}>
                      🥇
                    </span>
                  ) : null}
                  <span className="showcase-dex__name">{item.machineName}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}
