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
    <div className="showcase-page">
      <PageShell title={t('showcase.dexTitle')} subtitle={t('showcase.dexSubtitle')}>
        <p className="showcase-dex-progress">
          {t('showcase.dexProgress', {
            found: dex?.discovered ?? 0,
            total: dex?.catalogTotal ?? 0,
          })}
        </p>
        <ul className="showcase-dex-grades">
          {MACHINE_RARITY_GRADES.map((grade) => (
            <li key={grade}>
              <RarityBadge grade={grade} compact />
              <strong>{dex?.byGrade[grade] ?? 0}</strong>
            </li>
          ))}
        </ul>

        {holdingsQuery.data ? (
          <section className="showcase-step">
            <h2>
              {holdingsQuery.data.userGymName} · {t('showcase.holdingCount', { count: holdingsQuery.data.total })}
            </h2>
            <p>
              {holdingsQuery.data.byMuscle
                .map((m) => `${m.muscleGroup} ${m.count}`)
                .join(' · ')}
            </p>
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
              </div>
              <div className="showcase-card__body">
                <h3 className="showcase-card__title">{item.machineName}</h3>
                <p className="showcase-card__place">
                  {item.discoveryRank === 1
                    ? t('showcase.firstFinder')
                    : item.discoveryRank && item.discoveryRank > 1
                      ? t('showcase.finderRank', { rank: item.discoveryRank })
                      : '—'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </PageShell>
    </div>
  );
}
