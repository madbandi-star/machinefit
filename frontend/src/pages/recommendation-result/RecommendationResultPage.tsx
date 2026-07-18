import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RecommendationResult } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { RecommendationTips } from '@/components/recommendation/RecommendationTips/RecommendationTips';
import { WorkoutLogPanel } from '@/components/recommendation/WorkoutLogPanel/WorkoutLogPanel';
import { FitFeedbackPanel } from '@/components/recommendation/FitFeedbackPanel/FitFeedbackPanel';
import { RecommendationWarnings } from '@/components/recommendation/RecommendationWarnings/RecommendationWarnings';
import { RecommendationActionBar } from '@/components/recommendation/RecommendationActionBar/RecommendationActionBar';
import { favoriteApi, recommendationApi } from '@/api';
import { useMachineFitFeedback } from '@/hooks/useMachineFitFeedback';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useSettingsStore } from '@/store/settings.store';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { getLocalDateKey, normalizeDateKey } from '@/utils/historyDate';
import { formatFreeWeightRecordLabel } from '@/utils/freeWeightDisplay';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import '@/styles/components.css';
import '@/styles/recommendation.css';

function ResultLoadingSkeleton() {
  return (
    <div className="recommendation-settings-panel recommendation-settings-panel--result" aria-hidden="true">
      <div className="recommendation-settings-panel__grid recommendation-settings-panel__grid--dense">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="setting-value-card-skeleton skeleton" />
        ))}
      </div>
    </div>
  );
}

export function RecommendationResultPage() {
  const [searchParams] = useSearchParams();
  const recommendationId = searchParams.get('id');
  const logDateParam = searchParams.get('logDate');
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(['machines', 'common']);
  const stateResult = location.state?.result as RecommendationResult | undefined;
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const locale = useSettingsStore((s) => s.locale);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: fetchedResult, isLoading, isError } = useQuery({
    queryKey: ['recommendation', recommendationId, locale],
    queryFn: async () => {
      const res = await recommendationApi.getById(recommendationId!);
      return res.data.data;
    },
    enabled: !!recommendationId,
    placeholderData: stateResult,
  });

  const result = fetchedResult ?? stateResult;

  const fitFeedback = useMachineFitFeedback({
    recommendationId: result?.id ?? '',
    machineCode: result?.machineCode ?? '',
    recommendedSettings: result?.settings,
    enabled: isAuthenticated && !!result?.id,
  });

  const { data: favoriteCheck } = useQuery({
    queryKey: QUERY_KEYS.favoriteCheck(result?.machineCode ?? ''),
    queryFn: async () => {
      const res = await favoriteApi.check(result!.machineCode);
      return res.data.data;
    },
    enabled: isAuthenticated && !!result?.machineCode,
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (!result) throw new Error('missing_result');

      if (favoriteCheck?.favorited && favoriteCheck.favoriteId) {
        await favoriteApi.remove(favoriteCheck.favoriteId);
        return { favorited: false as const };
      }

      const res = await favoriteApi.add(result.machineCode, result.id);
      return {
        favorited: true as const,
        favoriteId: res.data.data.id,
      };
    },
    onSuccess: async (data) => {
      if (!result) return;
      queryClient.setQueryData(QUERY_KEYS.favoriteCheck(result.machineCode), data);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites });
      showToast(
        data.favorited
          ? t('common:actions.save')
          : t('machines:recommendation.removedFavorite'),
        'success'
      );
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  if (recommendationId && isLoading && !result) {
    return (
      <PageShell title={t('recommendation.title')}>
        <ResultLoadingSkeleton />
      </PageShell>
    );
  }

  if (recommendationId && isError && !result) {
    return (
      <PageShell title={t('common:errors.notFound')}>
        <QueryErrorMessage />
      </PageShell>
    );
  }

  if (!result) {
    return (
      <PageShell title={t('common:errors.notFound')} subtitle={t('common:errors.loadFailed')}>
        <Link to={ROUTES.MACHINES} className="btn btn--secondary btn--block">
          {t('common:nav.machines')}
        </Link>
      </PageShell>
    );
  }

  const machineTitle = result.targetMuscleGroup && isFreeWeightMachineCode(result.machineCode)
    ? formatFreeWeightRecordLabel(
        result.machineName ?? t('recommendation.title'),
        result.targetMuscleGroup,
        (group) => t(`muscleGroups.${group}`, { defaultValue: group })
      )
    : (result.machineName ?? t('recommendation.title'));

  return (
    <div className="recommendation-result-page">
      <header className="recommendation-result-page__header">
        <h1 className="recommendation-result-page__title">{machineTitle}</h1>
      </header>

      <div className="recommendation-result-page__content">
        <RecommendationWarnings warnings={result.warnings} />
        <RecommendationSettingsPanel
          settings={result.settings}
          weightBasis={result.weightBasis}
          variant="result"
          showAdjustment={fitFeedback.showAdjustment}
          customSettings={fitFeedback.customSettings}
          onCustomChange={fitFeedback.handleCustomChange}
          onSavePreferences={fitFeedback.savePreferences}
          isPreferencesPending={fitFeedback.isPreferencesPending}
        />
        {isAuthenticated ? (
          <FitFeedbackPanel
            savedRating={fitFeedback.savedRating}
            onRating={fitFeedback.handleRating}
            isPending={fitFeedback.isFeedbackPending}
          />
        ) : null}
        <RecommendationTips tips={result.tips} />
        <WorkoutLogPanel
          machineCode={result.machineCode}
          machineName={result.machineName}
          recommendationId={result.id}
          suggestedWeightKg={result.settings.recommendedWeightKg}
          isAuthenticated={isAuthenticated}
          variant="compact"
          diaryDefaultOpen
          logDate={normalizeDateKey(logDateParam ?? getLocalDateKey(result.createdAt))}
          targetMuscleGroup={result.targetMuscleGroup}
          lockTargetMuscle={Boolean(result.targetMuscleGroup && isFreeWeightMachineCode(result.machineCode))}
        />
      </div>

      <RecommendationActionBar
        machineCode={result.machineCode}
        isFavorited={favoriteCheck?.favorited ?? false}
        onToggleFavorite={handleToggleFavorite}
        isFavoritePending={toggleFavoriteMutation.isPending}
        fixed
      />
    </div>
  );
}
