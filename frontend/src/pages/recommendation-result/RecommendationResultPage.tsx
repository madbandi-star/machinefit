import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, Bookmark, Heart } from 'lucide-react';
import type { RecommendationResult } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { RecommendationTips } from '@/components/recommendation/RecommendationTips/RecommendationTips';
import {
  WorkoutLogPanel,
  type WorkoutLogPanelControl,
} from '@/components/recommendation/WorkoutLogPanel/WorkoutLogPanel';
import { FitFeedbackPanel } from '@/components/recommendation/FitFeedbackPanel/FitFeedbackPanel';
import { RecommendationWarnings } from '@/components/recommendation/RecommendationWarnings/RecommendationWarnings';
import { HistorySectionHeader } from '@/components/records/history-ui/HistorySectionHeader';
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
import '@/styles/history-premium.css';
import '@/styles/records.css';

function ResultLoadingSkeleton() {
  return (
    <div
      className="history-record-card history-record-card--premium history-record-card--unlogged recommendation-result-page__body-card"
      aria-hidden="true"
    >
      <div className="history-record-card__section">
        <div className="recommendation-settings-panel recommendation-settings-panel--history">
          <div className="recommendation-settings-panel__grid recommendation-settings-panel__grid--history">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="history-mini-setting-wrap">
                <div className="setting-value-card-skeleton skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getBookmarkAriaLabel(
  control: WorkoutLogPanelControl | null,
  t: (key: string) => string
): string {
  if (!control) return t('machines:history.bookmarkSave');
  if (!control.isLogSaved) return t('machines:history.bookmarkSave');
  if (control.isDirty) return t('machines:history.bookmarkUpdate');
  return t('machines:history.bookmarkRemove');
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
  const [logControl, setLogControl] = useState<WorkoutLogPanelControl | null>(null);

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

  const bookmarkActive = Boolean(logControl?.isLogSaved);
  const bookmarkDirty = Boolean(logControl?.isDirty);
  const bookmarkPending = Boolean(logControl?.isActionPending);
  const isFavorited = favoriteCheck?.favorited ?? false;

  const handleBookmarkClick = () => {
    if (!logControl || logControl.isActionPending || logControl.isLoading) return;

    if (!logControl.isLogSaved) {
      logControl.save();
      return;
    }

    if (logControl.isDirty) {
      logControl.save();
      return;
    }

    logControl.remove();
  };

  const settingsHeaderActions =
    isAuthenticated ? (
      <div className="recommendation-result-page__header-actions">
        <button
          type="button"
          className={`history-record-card__bookmark${
            bookmarkActive ? ' history-record-card__bookmark--active' : ''
          }${bookmarkDirty ? ' history-record-card__bookmark--dirty' : ''}`}
          aria-label={getBookmarkAriaLabel(logControl, t)}
          onClick={handleBookmarkClick}
          disabled={bookmarkPending || !logControl}
        >
          <Bookmark size={17} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          className={`history-record-card__bookmark recommendation-result-page__favorite${
            isFavorited ? ' history-record-card__bookmark--active recommendation-result-page__favorite--active' : ''
          }`}
          aria-label={
            isFavorited
              ? t('machines:recommendation.removeFavorite')
              : t('machines:recommendation.saveFavorite')
          }
          aria-pressed={isFavorited}
          onClick={handleToggleFavorite}
          disabled={toggleFavoriteMutation.isPending}
        >
          <Heart
            size={17}
            strokeWidth={2.25}
            fill={isFavorited ? 'currentColor' : 'none'}
          />
        </button>
      </div>
    ) : null;

  if (recommendationId && isLoading && !result) {
    return (
      <PageShell title={t('recommendation.title')}>
        <div className="history-page-premium">
          <ResultLoadingSkeleton />
        </div>
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
    <div className="recommendation-result-page recommendation-result-page--inline-actions">
      <header className="recommendation-result-page__header">
        <h1 className="recommendation-result-page__title">{machineTitle}</h1>
      </header>

      <div className="recommendation-result-page__content history-page-premium">
        <RecommendationWarnings warnings={result.warnings} />
        <article className="history-record-card history-record-card--premium history-record-card--unlogged recommendation-result-page__body-card">
          <div className="history-record-card__section">
            <HistorySectionHeader
              title={t('history.settingsSectionTitle')}
              icon={<SlidersHorizontal size={14} strokeWidth={2.25} aria-hidden />}
              action={settingsHeaderActions}
            />
            <RecommendationSettingsPanel
              settings={result.settings}
              weightBasis={result.weightBasis}
              variant="history"
              showAdjustment={fitFeedback.showAdjustment}
              customSettings={fitFeedback.customSettings}
              onCustomChange={fitFeedback.handleCustomChange}
              onSavePreferences={fitFeedback.savePreferences}
              isPreferencesPending={fitFeedback.isPreferencesPending}
              historyTotalWeightKg={logControl?.totalWeightKg}
            />
          </div>
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
            variant="history"
            logDate={normalizeDateKey(logDateParam ?? getLocalDateKey(result.createdAt))}
            idPrefix={`result-workout-${result.id}`}
            targetMuscleGroup={result.targetMuscleGroup}
            lockTargetMuscle={Boolean(result.targetMuscleGroup && isFreeWeightMachineCode(result.machineCode))}
            onControlReady={setLogControl}
          />
        </article>
      </div>
    </div>
  );
}
