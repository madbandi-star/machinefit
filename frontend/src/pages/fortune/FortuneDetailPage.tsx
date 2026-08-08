import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isAllGymsId } from '@machinefit/shared';
import { fortuneApi } from '@/api/fortune.api';
import { FortuneDashboard } from '@/components/fortune/FortuneDashboard';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { getTodayDateKey } from '@/utils/historyDate';
import '@/styles/fortune.css';

export function FortuneDetailPage() {
  const { t, i18n } = useTranslation(['fortune', 'common']);
  const { activeGymId } = useActiveGym();
  const { activeMemberId } = useActiveMember();
  const today = getTodayDateKey();
  const gymId =
    activeGymId && !isAllGymsId(activeGymId) ? activeGymId : undefined;
  const memberId = gymId && activeMemberId ? activeMemberId : undefined;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.fortuneToday(today, gymId, memberId),
    queryFn: async () => {
      const res = await fortuneApi.getToday({
        gymId,
        memberId,
        date: today,
        locale: i18n.language?.slice(0, 2),
      });
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <PageShell title={t('fortune:title')}>
        <div className="fortune-dashboard fortune-dashboard--loading">
          <Skeleton count={1} height={220} />
          <Skeleton count={3} height={96} />
        </div>
      </PageShell>
    );
  }

  if (isError) {
    return (
      <PageShell title={t('fortune:title')}>
        <p>{t('fortune:loadError')}</p>
        <button type="button" className="btn btn--secondary" onClick={() => void refetch()}>
          {t('common:actions.retry')}
        </button>
      </PageShell>
    );
  }

  if (!data || data.status === 'needs_birth_profile') {
    return (
      <PageShell title={t('fortune:title')}>
        <div className="fortune-gate">
          <p className="fortune-gate__emoji" aria-hidden>
            🔮
          </p>
          <p>{t('fortune:needsBirth')}</p>
          <Link to={`${ROUTES.SETTINGS}#birth-profile`} className="btn btn--primary btn--block">
            {t('fortune:enterBirth')}
          </Link>
        </div>
      </PageShell>
    );
  }

  const { fortune, scores, recommendation, dataAnalysis, mode } = data;
  if (!fortune || !scores || !recommendation) {
    return (
      <PageShell title={t('fortune:title')}>
        <p>{t('fortune:loadError')}</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <FortuneDashboard
        date={data.date}
        mode={mode}
        fortune={fortune}
        scores={scores}
        recommendation={recommendation}
        dataAnalysis={dataAnalysis}
      />
    </PageShell>
  );
}
