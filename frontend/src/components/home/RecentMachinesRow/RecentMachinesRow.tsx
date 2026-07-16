import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { MachineMiniCard } from '@/components/home/MachineMiniCard/MachineMiniCard';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { historyApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';

export function RecentMachinesRow() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.history,
    queryFn: async () => {
      const res = await historyApi.list({ limit: 8 });
      return res.data.data;
    },
  });

  const unique = data?.filter(
    (item, index, arr) => arr.findIndex((x) => x.machineCode === item.machineCode) === index
  );

  return (
    <section className="home-section">
      <div className="home-section__header">
        <h2 className="home-section__title">{t('pages.home.recentMachines')}</h2>
        {!!unique?.length && (
          <Link to={`${ROUTES.RECORDS}?tab=history`} className="home-section__link">
            {t('actions.viewAll')}
          </Link>
        )}
      </div>
      {isLoading ? (
        <Skeleton count={1} height={100} />
      ) : !unique?.length ? (
        <p className="home-empty-hint">{t('pages.home.recentEmpty')}</p>
      ) : (
        <div className="home-scroll-row">
          {unique.map((item) => (
            <MachineMiniCard
              key={item.machineCode}
              machineCode={item.machineCode}
              machineName={item.machineName}
            />
          ))}
        </div>
      )}
    </section>
  );
}
