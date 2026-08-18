import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { RarityBadge } from '@/components/machine-showcase/RarityBadge';
import { machineShowcaseApi } from '@/api/machine-showcase.api';
import { useAuthStore } from '@/store/auth.store';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import '@/styles/machine-showcase.css';

export function MachineShowcaseLinks({ machineCode }: { machineCode: string }) {
  const { t } = useTranslation('community');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const postsQuery = useQuery({
    queryKey: QUERY_KEYS.machineShowcase({ machineCode, tab: 'latest', limit: 1 }),
    queryFn: async () =>
      (await machineShowcaseApi.list({ machineCode, tab: 'latest', limit: 1 })).data.data,
    enabled: isAuthenticated,
  });
  const gymsQuery = useQuery({
    queryKey: QUERY_KEYS.machineShowcaseGyms(machineCode),
    queryFn: async () => (await machineShowcaseApi.machineGyms(machineCode)).data.data,
    enabled: isAuthenticated,
  });

  const postCount = postsQuery.data?.meta.total ?? 0;
  const gymCount = gymsQuery.data?.totalGyms ?? 0;
  const rarity = gymsQuery.data?.rarity;

  return (
    <section className="showcase-machine-links">
      {rarity ? <RarityBadge grade={rarity.grade} /> : null}
      <Link
        className="btn btn--secondary btn--block"
        to={`${ROUTES.MACHINE_SHOWCASE}?tab=latest`}
      >
        {t('showcase.machinePosts', { count: postCount })}
      </Link>
      <Link
        className="btn btn--secondary btn--block"
        to={`${ROUTES.MACHINE_SHOWCASE_WRITE}`}
      >
        {t('showcase.writeCta')}
      </Link>
      {gymsQuery.data ? (
        <p className="showcase-empty">
          {t('showcase.machineGyms', { count: gymCount })}
          {gymsQuery.data.byRegion.length
            ? ` · ${gymsQuery.data.byRegion
                .slice(0, 4)
                .map((r) => `${r.region} ${r.count}`)
                .join(', ')}`
            : ''}
        </p>
      ) : null}
    </section>
  );
}
