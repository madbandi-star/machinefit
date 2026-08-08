import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Role,
  hasMinRole,
  isAllGymsId,
  isFreeWeightMachineCode,
  type TargetMuscleGroup,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { MachineHero } from '@/components/machines/MachineHero/MachineHero';
import { LastRecommendationSnippet } from '@/components/machines/LastRecommendationSnippet/LastRecommendationSnippet';
import { RecommendCTA } from '@/components/machines/RecommendCTA/RecommendCTA';
import { WorkoutLogPanel } from '@/components/recommendation/WorkoutLogPanel/WorkoutLogPanel';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { machineApi, workoutCardApi } from '@/api';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useRecommendMachine } from '@/hooks/useRecommendMachine';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { getTodayDateKey, normalizeDateKey } from '@/utils/historyDate';
import { getLocalizedName } from '@/utils/localizedName';
import { getApiErrorCode } from '@/utils/motivationAudio';
import { getWorkoutLogQueryTargetMuscle } from '@/utils/workoutLogCache';
import '@/styles/components.css';
import '@/styles/machines.css';
import '@/styles/records.css';
import '@/styles/recommendation.css';
import '@/styles/trade.css';

export function MachineDetailPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const muscleParam = searchParams.get('muscle') as TargetMuscleGroup | null;
  const logDateParam = searchParams.get('logDate');
  const planDateParam = searchParams.get('planDate');
  const { t, i18n } = useTranslation(['machines', 'common']);
  const { t: tt } = useTranslation('trade');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const canTrade = isAuthenticated && hasMinRole(user?.roleCode, Role.OWNER);
  const { activeGymId } = useActiveGym();
  const { activeMemberId } = useActiveMember();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const setRecordsNavNudge = useUIStore((s) => s.setRecordsNavNudge);
  const { createRecommendationAsync, isPending: isRecommendPending } =
    useRecommendMachine(machineCode);

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

  const planDate = planDateParam ? normalizeDateKey(planDateParam) : null;
  const todayDateKey = getTodayDateKey();
  /**
   * Plan-add shell (from machines?planDate=…, today or future): hide log/voice/recommend chrome.
   * History clicks use logDate only — keep the same full UI as today cards.
   */
  const isPlanAddMode = Boolean(planDate);

  const createPlanMutation = useMutation({
    mutationFn: async () => {
      if (!activeGymId || !activeMemberId || !machineCode || !planDate) {
        throw new Error('missing_scope');
      }
      if (isAllGymsId(activeGymId)) throw new Error('all_gyms');
      // Create a recommendation (no today-history write) so the plan card gets
      // the same fit/settings UI and result-page destination as today's cards.
      const { result } = await createRecommendationAsync({
        targetMuscleGroup: muscleParam ?? undefined,
        planDate,
        skipNavigate: true,
        skipHistory: true,
      });
      const res = await workoutCardApi.create({
        gymId: activeGymId,
        memberId: activeMemberId,
        machineCode,
        scheduledDate: planDate,
        status: 'PLANNED',
        setCount: 1,
        setWeightsKg: [result.settings.recommendedWeightKg ?? 0],
        recommendationId: result.id,
        ...(muscleParam ? { targetMuscleGroup: muscleParam } : {}),
      });
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCards });
      // Same bottom-nav Records green-dot nudge as after saving a workout / fresh recommend.
      setRecordsNavNudge(true, { tip: true });
      showToast(t('machines:history.planCreatedContinue'), 'success');
      // Return to machine search with the same planDate so more exercises can be added.
      if (planDate) {
        navigate(`${ROUTES.MACHINES}?planDate=${encodeURIComponent(planDate)}`);
      }
    },
    onError: (error) => {
      if (getApiErrorCode(error) === 'DUPLICATE_CARD') {
        showToast(t('machines:history.planDuplicateMachine'), 'info');
        return;
      }
      // Profile / recommend errors already toasted by useRecommendMachine.
      if (error instanceof Error && error.message.startsWith('missing_')) return;
      if (getApiErrorCode(error)) return;
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  if (isLoading && !machine) return <Skeleton count={3} height={100} />;
  if (isError && !machine) {
    return (
      <PageShell title={t('machines:error', { defaultValue: 'Error' })}>
        <QueryErrorMessage onRetry={() => void refetch()} />
      </PageShell>
    );
  }
  if (!machine) {
    return <PageShell title={t('machines:notFound', { defaultValue: 'Not Found' })} />;
  }

  const isFreeWeight = isFreeWeightMachineCode(machine.code);
  const logDate = logDateParam
    ? normalizeDateKey(logDateParam)
    : planDate
      ? planDate
      : null;
  const logTargetMuscle = machineCode
    ? getWorkoutLogQueryTargetMuscle(machineCode, muscleParam ?? undefined)
    : undefined;
  const canCreatePlan =
    isAuthenticated &&
    Boolean(planDate) &&
    Boolean(activeGymId) &&
    Boolean(activeMemberId) &&
    !isAllGymsId(activeGymId ?? '');

  return (
    <div className="machine-detail-page">
      {/* Cover image at top for every brand (same layout as free-weight). */}
      <MachineHero machine={machine} selectedMuscle={muscleParam} />
      {!isPlanAddMode && !isFreeWeight && machineCode && isAuthenticated ? (
        <LastRecommendationSnippet machineCode={machineCode} />
      ) : null}
      {isPlanAddMode && isFreeWeight && machineCode ? (
        <RecommendCTA
          machineCode={machineCode}
          initialMuscle={muscleParam}
          syncMuscleToUrl
          planDate={planDate}
          showRecommendButton={false}
          showTradeActions={false}
        />
      ) : null}
      {canCreatePlan ? (
        <div className="machine-detail-plan-actions">
          <p className="machine-detail-plan-actions__label">
            {t('machines:history.planAddMachineHint', { date: planDate })}
          </p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={
              createPlanMutation.isPending ||
              isRecommendPending ||
              (isFreeWeight && !muscleParam)
            }
            onClick={() => {
              if (isFreeWeight && !muscleParam) {
                showToast(t('machines:targetMuscleRequired'), 'error');
                return;
              }
              createPlanMutation.mutate();
            }}
          >
            {t('machines:history.planAddMachine')}
          </button>
          {isPlanAddMode && planDate ? (
            <div className="machine-detail-plan-actions__secondary">
              <Link
                to={`${ROUTES.RECORDS}?tab=history&date=${encodeURIComponent(planDate)}`}
                className="btn btn--secondary btn--block"
              >
                {t('machines:history.planViewPlan')}
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
      {!isPlanAddMode && logDate && machineCode && isAuthenticated ? (
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
      {!isPlanAddMode && machineCode && canTrade ? (
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
      {!isPlanAddMode && machineCode ? (
        <RecommendCTA
          machineCode={machineCode}
          initialMuscle={muscleParam}
          syncMuscleToUrl={isFreeWeight}
          planDate={
            planDate ??
            (logDate && logDate > todayDateKey ? logDate : null)
          }
        />
      ) : null}
    </div>
  );
}
