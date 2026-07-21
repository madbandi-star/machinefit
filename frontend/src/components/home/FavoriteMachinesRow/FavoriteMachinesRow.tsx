import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { HomeSectionEmptyPrompt } from '@/components/home/HomeSectionEmptyPrompt/HomeSectionEmptyPrompt';
import { MachineMiniCard } from '@/components/home/MachineMiniCard/MachineMiniCard';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { favoriteApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { shouldShowDefaultMachineMuscle } from '@/utils/freeWeightDisplay';
import '@/styles/home.css';

export function FavoriteMachinesRow() {
  const { t } = useTranslation();
  const { activeGymId } = useActiveGym();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.favorites(activeGymId ?? ''),
    queryFn: async () => {
      const res = await favoriteApi.list(activeGymId!);
      return res.data.data;
    },
    enabled: Boolean(activeGymId),
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
        <Skeleton count={1} height={76} />
      ) : !data?.length ? (
        <HomeSectionEmptyPrompt
          icon="heart"
          title={t('pages.home.favoritesEmptyAction')}
          description={t('pages.home.favoritesEmptyHint')}
          to={ROUTES.MACHINES}
        />
      ) : (
        <div className="home-scroll-row">
          {data.slice(0, 8).map((item) => (
            <MachineMiniCard
              key={item.id}
              machineCode={item.machineCode}
              machineName={item.machineName}
              brandName={item.brandName}
              muscleGroup={
                shouldShowDefaultMachineMuscle(item.machineCode) ? item.muscleGroup : undefined
              }
              recommendationId={item.recommendationId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
