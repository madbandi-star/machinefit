import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isAllGymsId, MACHINE_RARITY_GRADES } from '@machinefit/shared';
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

export function MachineDexPage() {
  const { t } = useTranslation('community');
  const { activeGymId, gyms } = useActiveGym();
  const dexQuery = useQuery({
    queryKey: QUERY_KEYS.machineDex,
    queryFn: async () => (await machineShowcaseApi.myDex()).data.data,
  });
  const holdingsQuery = useQuery({
    queryKey: QUERY_KEYS.machineShowcaseHoldings(activeGymId),
    queryFn: async () => (await machineShowcaseApi.myGymHoldings(activeGymId!)).data.data,
    enabled: Boolean(activeGymId) && !isAllGymsId(activeGymId),
  });

  if (dexQuery.isLoading) return <Skeleton count={4} height={80} />;
  const dex = dexQuery.data;

  return (
    <PageShell title={t('showcase.dexTitle')} subtitle={t('showcase.dexSubtitle')}>
      <p>
        {t('showcase.dexProgress', {
          found: dex?.discovered ?? 0,
          total: dex?.catalogTotal ?? 0,
        })}
      </p>
      <ul className="showcase-dex-grades">
        {MACHINE_RARITY_GRADES.map((grade) => (
          <li key={grade}>
            <RarityBadge grade={grade} compact /> {dex?.byGrade[grade] ?? 0}
          </li>
        ))}
      </ul>

      {holdingsQuery.data ? (
        <section className="showcase-step">
          <h2>
            🏠 {holdingsQuery.data.userGymName} · {t('showcase.holdingCount', { count: holdingsQuery.data.total })}
          </h2>
          <p>
            {holdingsQuery.data.byMuscle
              .map((m) => `${m.muscleGroup} ${m.count}`)
              .join(' · ')}
          </p>
          <p>{t('showcase.recentMachines')}</p>
          <ul>
            {holdingsQuery.data.recent.map((m) => (
              <li key={m.machineCode}>{m.machineName}</li>
            ))}
          </ul>
        </section>
      ) : gyms.length === 0 ? (
        <p className="showcase-empty">{t('showcase.needGym')}</p>
      ) : null}

      <div className="showcase-feed">
        {(dex?.items ?? []).map((item) => (
          <Link
            key={item.machineId}
            className={`showcase-card showcase-card--${item.grade.toLowerCase()}`}
            to={ROUTES.MACHINE_DETAIL.replace(':machineCode', item.machineCode)}
          >
            {item.coverThumbUrl ? (
              <div className="showcase-card__media">
                <img
                  className="showcase-card__img"
                  src={resolveShowcaseMediaUrl(item.coverThumbUrl)}
                  alt=""
                  loading="lazy"
                />
              </div>
            ) : null}
            <div className="showcase-card__body">
              <RarityBadge grade={item.grade} compact />
              <h3 className="showcase-card__title">{item.machineName}</h3>
              <p className="showcase-card__meta">
                {item.discoveryRank === 1 ? t('showcase.firstFinder') : null}
                {item.discoveryRank && item.discoveryRank > 1
                  ? t('showcase.finderRank', { rank: item.discoveryRank })
                  : null}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
