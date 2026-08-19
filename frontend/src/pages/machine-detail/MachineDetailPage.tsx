import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Role,
  hasMinRole,
  isAllGymsId,
  isFreeWeightMachineCode,
  type TargetMuscleGroup,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { MachineHero } from '@/components/machines/MachineHero/MachineHero';
import { LastRecommendationSnippet } from '@/components/machines/LastRecommendationSnippet/LastRecommendationSnippet';
import { RecommendCTA } from '@/components/machines/RecommendCTA/RecommendCTA';
import { BannerSlot } from '@/components/banners/BannerSlot/BannerSlot';
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
import {
  findCachedMachine,
  isMachineNotFoundError,
} from '@/utils/machineDetailCache';
import { getWorkoutLogQueryTargetMuscle } from '@/utils/workoutLogCache';
import { Seo } from '@/seo/Seo';
import { MachineShowcaseLinks } from '@/components/machine-showcase/MachineShowcaseLinks';
import { breadcrumbJsonLd, webPageJsonLd } from '@/seo/jsonLd';
import { resolveRecordMachineImageUrl } from '@/utils/catalogAssets';
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

  const {
    data: machine,
    isLoading,
    isError,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.machine(machineCode!, muscleParam ?? undefined),
    queryFn: async () => {
      const res = await machineApi.getByCode(
        machineCode!,
        muscleParam ? { muscle: muscleParam } : undefined
      );
      return res.data.data;
    },
    enabled: !!machineCode,
    staleTime: 5 * 60_000,
    // Keep hero visible while switching FW muscle covers (`?muscle=`).
    placeholderData: keepPreviousData,
    initialData: () =>
      machineCode
        ? findCachedMachine(queryClient, machineCode, muscleParam)
        : undefined,
    initialDataUpdatedAt: () =>
      machineCode
        ? queryClient.getQueryState(
            QUERY_KEYS.machine(machineCode, muscleParam ?? undefined)
          )?.dataUpdatedAt
        : undefined,
    retry: (failureCount, err) => {
      if (isMachineNotFoundError(err)) return false;
      return failureCount < 3;
    },
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
  });

  // Transient failures: keep UI usable (cached/list seed) and retry quietly.
  useEffect(() => {
    if (!machineCode || !isError || isFetching) return;
    if (isMachineNotFoundError(error)) return;
    const timer = window.setTimeout(() => {
      void refetch();
    }, 2_000);
    return () => window.clearTimeout(timer);
  }, [machineCode, isError, isFetching, error, refetch]);

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
      // Match WorkoutLogPanel default (search → recommend → log), not a single-set stub.
      const defaultSetCount = 3;
      const seedKg = result.settings.recommendedWeightKg ?? 0;
      const res = await workoutCardApi.create({
        gymId: activeGymId,
        memberId: activeMemberId,
        machineCode,
        scheduledDate: planDate,
        status: 'PLANNED',
        setCount: defaultSetCount,
        setWeightsKg: Array.from({ length: defaultSetCount }, () => seedKg),
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
    onError: (err) => {
      if (getApiErrorCode(err) === 'DUPLICATE_CARD') {
        showToast(t('machines:history.planDuplicateMachine'), 'info');
        return;
      }
      // Profile / recommend errors already toasted by useRecommendMachine.
      if (err instanceof Error && err.message.startsWith('missing_')) return;
      if (getApiErrorCode(err)) return;
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  if ((isLoading || (isError && !isMachineNotFoundError(error))) && !machine) {
    return <Skeleton count={3} height={100} />;
  }
  if (isError && !machine && isMachineNotFoundError(error)) {
    return (
      <PageShell title={t('machines:notFound', { defaultValue: 'Not Found' })}>
        <Link to={ROUTES.MACHINES} className="btn btn--secondary btn--block">
          {t('common:nav.machines')}
        </Link>
      </PageShell>
    );
  }
  if (!machine) {
    return (
      <PageShell title={t('machines:notFound', { defaultValue: 'Not Found' })}>
        <Link to={ROUTES.MACHINES} className="btn btn--secondary btn--block">
          {t('common:nav.machines')}
        </Link>
      </PageShell>
    );
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

  const machineName = getLocalizedName(machine.name, i18n.language, machine.code);
  const brandName = machine.brandName
    ? getLocalizedName(machine.brandName, i18n.language, machine.brandCode || '')
    : '';
  const descText = machine.description
    ? getLocalizedName(machine.description, i18n.language, '')
    : '';
  const seoTitle = brandName ? `${brandName} ${machineName} 사용법` : `${machineName} 사용법`;
  const seoDescription =
    descText ||
    `${brandName ? `${brandName} ` : ''}${machineName}의 운동 부위와 머신 사용 팁을 머신핏에서 확인하고 운동을 기록하세요.`;
  const seoPath = `/machines/${encodeURIComponent(machine.code)}`;
  const seoImage =
    resolveRecordMachineImageUrl(machine.code, {
      primaryImageUrl: machine.primaryImageUrl,
      targetMuscleGroup: muscleParam,
      preferMuscleCover: Boolean(isFreeWeight && muscleParam),
    }) || undefined;
  const hasQuery = Boolean(muscleParam || logDateParam || planDateParam);

  return (
    <div className="machine-detail-page">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={seoPath}
        robots={hasQuery ? 'noindex,follow' : 'index,follow'}
        image={seoImage}
        type="article"
        jsonLd={[
          webPageJsonLd({
            name: seoTitle,
            description: seoDescription,
            path: seoPath,
          }),
          breadcrumbJsonLd([
            { name: '홈', path: '/' },
            { name: '머신', path: '/machines' },
            ...(machine.brandCode
              ? [
                  {
                    name: brandName || machine.brandCode,
                    path: `/brands/${encodeURIComponent(machine.brandCode)}`,
                  },
                ]
              : []),
            { name: machineName, path: seoPath },
          ]),
        ]}
      />
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
          sticky={false}
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
      {!isPlanAddMode && machineCode && isAuthenticated ? (
        <MachineShowcaseLinks machineCode={machineCode} />
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
      {!isPlanAddMode ? (
        <BannerSlot slot="MACHINE_BOTTOM" className="machine-detail-page__banner" />
      ) : null}
    </div>
  );
}
