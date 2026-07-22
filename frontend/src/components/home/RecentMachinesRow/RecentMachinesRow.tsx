import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { HomeSectionEmptyPrompt } from '@/components/home/HomeSectionEmptyPrompt/HomeSectionEmptyPrompt';
import { MachineMiniCard } from '@/components/home/MachineMiniCard/MachineMiniCard';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { historyApi, type HistoryItem } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import '@/styles/home.css';

function recentItemKey(item: HistoryItem): string {
  if (isFreeWeightMachineCode(item.machineCode) && item.targetMuscleGroup) {
    return `${item.machineCode}:${item.targetMuscleGroup}`;
  }
  return item.machineCode;
}

export function RecentMachinesRow() {
  const { t } = useTranslation();
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const memberKey = activeMemberId ?? '';

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.historyList(activeGymId ?? '', memberKey, { limit: 40 }),
    queryFn: async () => {
      const res = await historyApi.list(activeGymId!, {
        limit: 40,
        memberId: activeMemberId ?? undefined,
      });
      return res.data.data;
    },
    enabled: Boolean(activeGymId) && memberScopeReady,
    staleTime: 60_000,
    select: (items) => items.slice(0, 8),
  });

  const unique = useMemo(() => {
    if (!data?.length) return [];
    const seen = new Set<string>();
    const items: HistoryItem[] = [];
    for (const item of data) {
      const key = recentItemKey(item);
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(item);
    }
    return items;
  }, [data]);

  return (
    <section className="home-section">
      <div className="home-section__header">
        <h2 className="home-section__title">{t('pages.home.recentMachines')}</h2>
        {!!unique.length && (
          <Link to={`${ROUTES.RECORDS}?tab=history`} className="home-section__link">
            {t('actions.viewAll')}
          </Link>
        )}
      </div>
      {isLoading || !memberScopeReady ? (
        <Skeleton count={1} height={76} />
      ) : !unique.length ? (
        <HomeSectionEmptyPrompt
          icon="history"
          title={t('pages.home.recentEmptyAction')}
          description={t('pages.home.recentEmptyHint')}
          to={ROUTES.MACHINES}
        />
      ) : (
        <div className="home-scroll-row">
          {unique.map((item) => (
            <MachineMiniCard
              key={recentItemKey(item)}
              machineCode={item.machineCode}
              machineName={item.machineName}
              brandName={item.brandName}
              muscleGroup={item.muscleGroup}
              targetMuscleGroup={item.targetMuscleGroup}
              recommendationId={item.recommendationId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
