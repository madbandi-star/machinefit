import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isFreeWeightMachineCode, type TargetMuscleGroup } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { MachineHero } from '@/components/machines/MachineHero/MachineHero';
import { LastRecommendationSnippet } from '@/components/machines/LastRecommendationSnippet/LastRecommendationSnippet';
import { RecommendCTA } from '@/components/machines/RecommendCTA/RecommendCTA';
import { WorkoutLogPanel } from '@/components/recommendation/WorkoutLogPanel/WorkoutLogPanel';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { machineApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { normalizeDateKey } from '@/utils/historyDate';
import { getLocalizedName } from '@/utils/localizedName';
import { getWorkoutLogQueryTargetMuscle } from '@/utils/workoutLogCache';
import '@/styles/components.css';
import '@/styles/machines.css';
import '@/styles/records.css';
import '@/styles/recommendation.css';
import '@/styles/trade.css';

export function MachineDetailPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const [searchParams] = useSearchParams();
  const muscleParam = searchParams.get('muscle') as TargetMuscleGroup | null;
  const logDateParam = searchParams.get('logDate');
  const { t, i18n } = useTranslation('machines');
  const { t: tt } = useTranslation('trade');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: machine, isLoading, isError, refetch } = useQuery({
    queryKey: QUERY_KEYS.machine(machineCode!, muscleParam ?? undefined),
    queryFn: async () => {
      const res = await machineApi.getByCode(
        machineCode!,
        muscleParam ? { muscle: muscleParam } : undefined
      );
      return res.data.data;
    },
    enabled: !!machineCode,
    // Keep hero visible while switching FW muscle covers (`?muscle=`).
    placeholderData: (prev) => prev,
  });

  if (isLoading && !machine) return <Skeleton count={3} height={100} />;
  if (isError && !machine) {
    return (
      <PageShell title={t('error', { defaultValue: 'Error' })}>
        <QueryErrorMessage onRetry={() => void refetch()} />
      </PageShell>
    );
  }
  if (!machine) {
    return <PageShell title={t('notFound', { defaultValue: 'Not Found' })} />;
  }

  const isFreeWeight = isFreeWeightMachineCode(machine.code);
  const useCompactMachineDetail = !isFreeWeight && isAuthenticated;
  const logDate = logDateParam ? normalizeDateKey(logDateParam) : null;
  const logTargetMuscle = machineCode
    ? getWorkoutLogQueryTargetMuscle(machineCode, muscleParam ?? undefined)
    : undefined;

  return (
    <div className={`machine-detail-page${useCompactMachineDetail ? ' machine-detail-page--compact' : ''}`}>
      <MachineHero machine={machine} compact={useCompactMachineDetail} selectedMuscle={muscleParam} />
      {!isFreeWeight && machineCode && isAuthenticated ? (
        <LastRecommendationSnippet machineCode={machineCode} />
      ) : null}
      {logDate && machineCode && isAuthenticated ? (
        <WorkoutLogPanel
          machineCode={machineCode}
          machineName={getLocalizedName(machine.name, i18n.language, machine.code)}
          isAuthenticated={isAuthenticated}
          variant="compact"
          logDate={logDate}
          idPrefix={`detail-workout-${machineCode}`}
          targetMuscleGroup={logTargetMuscle}
          lockTargetMuscle={Boolean(isFreeWeight && logTargetMuscle)}
          showSaveButton
        />
      ) : null}
      {machineCode ? (
        <div className="machine-detail-trade-links">
          <Link
            to={`${ROUTES.TRADE_LIST_SELL}?machineCode=${encodeURIComponent(machineCode)}`}
            className="btn btn--secondary"
          >
            {tt('viewSellListings')}
          </Link>
          <Link
            to={`${ROUTES.TRADE_LIST_BUY}?machineCode=${encodeURIComponent(machineCode)}`}
            className="btn btn--secondary"
          >
            {tt('viewBuyListings')}
          </Link>
        </div>
      ) : null}
      {machineCode ? (
        <RecommendCTA
          machineCode={machineCode}
          fixed={useCompactMachineDetail}
          initialMuscle={muscleParam}
          syncMuscleToUrl={isFreeWeight}
        />
      ) : null}
    </div>
  );
}
