import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, ChevronDown, Heart } from 'lucide-react';
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
import { ActiveSettingsSourceBanner } from '@/components/recommendation/ActiveSettingsSourceBanner/ActiveSettingsSourceBanner';
import { RecommendationWarnings } from '@/components/recommendation/RecommendationWarnings/RecommendationWarnings';
import { recommendationApi } from '@/api';
import { useMachineFitFeedback } from '@/hooks/useMachineFitFeedback';
import { useWorkoutLogSaved } from '@/hooks/useWorkoutLogSaved';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useUserUnits } from '@/hooks/useUserUnits';
import { ROUTES } from '@/constants/routes';
import { getLocalDateKey, normalizeDateKey } from '@/utils/historyDate';
import { formatFreeWeightRecordLabel, formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import { isFreeWeightMachineCode, resolveWorkoutLogSeedWeightKg } from '@machinefit/shared';
import { getWorkoutLogQueryTargetMuscle } from '@/utils/workoutLogCache';
import '@/styles/components.css';
import '@/styles/recommendation.css';
import '@/styles/history-premium.css';
import '@/styles/records.css';
import '@/styles/android-ui.css';

function ResultLoadingSkeleton() {
  return (
    <div className="recommendation-result-page recommendation-result-page--inline-actions">
      <header className="recommendation-result-page__header" aria-hidden="true">
        <div className="recommendation-result-page__title-skeleton skeleton" />
      </header>
      <div className="recommendation-result-page__content history-page-premium">
        <div
          className="history-record-card history-record-card--premium history-record-card--unlogged recommendation-result-page__body-card"
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
      </div>
    </div>
  );
}

function getBookmarkAriaLabel(
  control: WorkoutLogPanelControl | null,
  isLogSaved: boolean,
  t: (key: string) => string
): string {
  if (!control) return t('machines:history.bookmarkSave');
  if (!isLogSaved) return t('machines:history.bookmarkSave');
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
  const locale = useSettingsStore((s) => s.locale);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [logControl, setLogControl] = useState<WorkoutLogPanelControl | null>(null);
  const [workoutLogSavedOverride, setWorkoutLogSavedOverride] = useState<boolean | null>(null);
  const [bodyExpanded, setBodyExpanded] = useState(true);

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
  const resultLogDate = normalizeDateKey(logDateParam ?? getLocalDateKey(result?.createdAt ?? ''));
  const resultTargetMuscle = getWorkoutLogQueryTargetMuscle(
    result?.machineCode ?? '',
    result?.targetMuscleGroup
  );
  const cachedWorkoutLogSaved = useWorkoutLogSaved({
    machineCode: result?.machineCode ?? '',
    logDate: resultLogDate,
    targetMuscleGroup: resultTargetMuscle,
    isAuthenticated: isAuthenticated && !!result,
  });
  const isWorkoutLogSaved = workoutLogSavedOverride ?? cachedWorkoutLogSaved;

  useEffect(() => {
    setWorkoutLogSavedOverride(null);
  }, [result?.id, resultLogDate, resultTargetMuscle]);

  const { isFavorited, toggleFavorite, isPending: isFavoritePending, canFavorite } = useFavoriteToggle({
    machineCode: result?.machineCode ?? '',
    recommendationId: result?.id,
    isAuthenticated: isAuthenticated && !!result,
  });

  const fitFeedback = useMachineFitFeedback({
    recommendationId: result?.id ?? '',
    machineCode: result?.machineCode ?? '',
    recommendedSettings: result?.aiRecommendedSettings ?? result?.settings,
    initialActiveSource: result?.activeSource,
    enabled: isAuthenticated && !!result?.id,
  });
  const { formatWeight } = useUserUnits();

  const handleToggleFavorite = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: location } });
      return;
    }
    toggleFavorite();
  };

  const bookmarkActive = isWorkoutLogSaved;
  const bookmarkDirty = Boolean(logControl?.isDirty);
  const bookmarkPending = Boolean(logControl?.isActionPending);

  const bookmarkDisabled =
    bookmarkPending || !logControl || logControl.isLoading || logControl.isActionPending;

  const handleBookmarkClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    if (!logControl || logControl.isActionPending || logControl.isLoading) return;

    if (!isWorkoutLogSaved) {
      setWorkoutLogSavedOverride(true);
      logControl.save();
      return;
    }

    if (logControl.isDirty) {
      logControl.save();
      return;
    }

    setWorkoutLogSavedOverride(false);
    logControl.remove();
  };

  const titleHeaderActions =
    isAuthenticated ? (
      <div className="recommendation-result-page__header-actions">
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
          disabled={isFavoritePending || (isAuthenticated && !canFavorite)}
        >
          <Heart
            key={isFavorited ? 'favorited' : 'unfavorited'}
            size={17}
            strokeWidth={2.25}
            fill={isFavorited ? 'currentColor' : 'none'}
          />
        </button>
        <button
          type="button"
          className={`history-record-card__bookmark recommendation-result-page__log-save${
            bookmarkActive ? ' history-record-card__bookmark--active' : ''
          }${bookmarkDirty ? ' history-record-card__bookmark--dirty' : ''}`}
          aria-label={getBookmarkAriaLabel(logControl, isWorkoutLogSaved, t)}
          onClick={handleBookmarkClick}
          disabled={bookmarkDisabled}
        >
          <Bookmark
            key={bookmarkActive ? 'saved' : 'unsaved'}
            size={17}
            strokeWidth={2.25}
            fill={bookmarkActive ? 'currentColor' : 'none'}
          />
        </button>
      </div>
    ) : null;

  if (recommendationId && isLoading && !result) {
    return <ResultLoadingSkeleton />;
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
    : formatBrandedMachineLabel(
        result.machineName ?? t('recommendation.title'),
        result.brandName,
        result.machineCode
      );

  return (
    <div className="recommendation-result-page recommendation-result-page--inline-actions">
      <header className="recommendation-result-page__header">
        <h1 className="recommendation-result-page__title">{machineTitle}</h1>
        {titleHeaderActions}
      </header>

      <div className="recommendation-result-page__content history-page-premium">
        <RecommendationWarnings warnings={result.warnings} />
        <article
          className={`history-record-card history-record-card--premium history-record-card--unlogged recommendation-result-page__body-card${
            bodyExpanded ? '' : ' history-record-card--collapsed'
          }`}
        >
          {bodyExpanded ? (
            <>
              <div className="history-record-card__section">
                {isAuthenticated ? (
                  <ActiveSettingsSourceBanner
                    activeSource={fitFeedback.activeSource}
                    aiSettings={result.aiRecommendedSettings ?? result.settings}
                    adjustedSettings={
                      fitFeedback.hasSavedPreferences
                        ? fitFeedback.customSettings
                        : result.adjustedSettings
                    }
                    formatWeight={formatWeight}
                    onUseRecommended={fitFeedback.useRecommended}
                    onUseAdjusted={fitFeedback.useAdjusted}
                    onClearAdjusted={
                      fitFeedback.hasSavedPreferences ? fitFeedback.clearAdjusted : undefined
                    }
                    isPending={
                      fitFeedback.isFeedbackPending || fitFeedback.isPreferencesPending
                    }
                  />
                ) : null}
                <RecommendationSettingsPanel
                  settings={result.aiRecommendedSettings ?? result.settings}
                  weightBasis={result.weightBasis}
                  variant="history"
                  showAdjustment={fitFeedback.showAdjustment}
                  customSettings={fitFeedback.customSettings}
                  onCustomChange={fitFeedback.handleCustomChange}
                  onSavePreferences={fitFeedback.savePreferences}
                  isPreferencesPending={fitFeedback.isPreferencesPending}
                />
              </div>
              {isAuthenticated ? (
                <FitFeedbackPanel
                  savedRating={fitFeedback.savedRating}
                  onRating={fitFeedback.handleRating}
                  isPending={fitFeedback.isFeedbackPending}
                />
              ) : null}
            </>
          ) : null}

          {/* Keep mounted while collapsed so header 기록 (bookmark) stays enabled. */}
          <WorkoutLogPanel
            machineCode={result.machineCode}
            machineName={result.machineName}
            recommendationId={result.id}
            suggestedWeightKg={resolveWorkoutLogSeedWeightKg({
              fitRating: fitFeedback.savedRating,
              adjustedWeight: fitFeedback.customSettings.recommendedWeightKg,
              recommendedWeight: (result.aiRecommendedSettings ?? result.settings)
                .recommendedWeightKg,
            })}
            isAuthenticated={isAuthenticated}
            variant="history"
            logDate={resultLogDate}
            idPrefix={`result-workout-${result.id}`}
            targetMuscleGroup={resultTargetMuscle}
            lockTargetMuscle={Boolean(resultTargetMuscle && isFreeWeightMachineCode(result.machineCode))}
            tips={result.tips}
            warnings={result.warnings}
            onControlReady={setLogControl}
            onSavedChange={setWorkoutLogSavedOverride}
          />

          {bodyExpanded ? (
            <>
              <RecommendationTips tips={result.tips} />
              <button
                type="button"
                className="history-record-card__body-toggle"
                aria-expanded={true}
                onClick={() => setBodyExpanded(false)}
              >
                <span className="history-record-card__body-toggle-label">
                  {t('common:collapseCardDetails')}
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.25}
                  className="history-record-card__collapse-icon history-record-card__collapse-icon--open"
                  aria-hidden
                />
              </button>
            </>
          ) : (
            <button
              type="button"
              className="history-record-card__body-toggle"
              aria-expanded={false}
              onClick={() => setBodyExpanded(true)}
            >
              <span className="history-record-card__body-toggle-label">
                {t('common:expandCardDetails')}
              </span>
              <ChevronDown
                size={16}
                strokeWidth={2.25}
                className="history-record-card__collapse-icon"
                aria-hidden
              />
            </button>
          )}
        </article>
      </div>
    </div>
  );
}
