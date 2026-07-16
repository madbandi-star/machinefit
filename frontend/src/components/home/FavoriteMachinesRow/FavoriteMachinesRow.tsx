import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState';
import { MachineMiniCard } from '@/components/home/MachineMiniCard/MachineMiniCard';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { favoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';

export function FavoriteMachinesRow() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.favorites,
    queryFn: async () => {
      const res = await favoriteApi.list();
      return res.data.data;
    },
  });

  return (
    <section className="home-section">
      <div className="home-section__header">
        <h2 className="home-section__title">{t('pages.home.favorites')}</h2>
        {!!data?.length && (
          <Link to={`${ROUTES.RECORDS}?tab=favorites`} className="home-section__link">
            {t('actions.viewAll')}
          </Link>
        )}
      </div>
      {isLoading ? (
        <Skeleton count={1} height={100} />
      ) : !data?.length ? (
        <EmptyState
          compact
          icon="heart"
          title={t('pages.home.favoritesEmpty')}
          action={
            <Link to={ROUTES.MACHINES} className="btn btn--secondary">
              {t('emptyState.browseMachines')}
            </Link>
          }
        />
      ) : (
        <div className="home-scroll-row">
          {data.slice(0, 8).map((item) => (
            <MachineMiniCard
              key={item.id}
              machineCode={item.machineCode}
              machineName={item.machineName}
              recommendationId={item.recommendationId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
