import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, ChevronDown, Heart, X } from 'lucide-react';
import type { RecommendationResult } from '@machinefit/shared';
import { isAllGymsId, isFreeWeightMachineCode, resolveWorkoutLogSeedWeightKg, resolveWorkoutLogSeedReps } from '@machinefit/shared';
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
import { MachineCardDisclaimerNotices } from '@/components/compliance/MachineCardDisclaimerNotices';
import { AdSlot } from '@/ads/AdSlot';
import { recommendationApi, workoutCardApi } from '@/api';
import { useMachineFitFeedback } from '@/hooks/useMachineFitFeedback';
import { useWorkoutLogSaved } from '@/hooks/useWorkoutLogSaved';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useDoubleTapAction } from '@/hooks/useDoubleTapAction';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
import { useUIStore } from '@/store/ui.store';
import { useUserUnits } from '@/hooks/useUserUnits';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { getLocalDateKey, getTodayDateKey, normalizeDateKey } from '@/utils/historyDate';
import { formatFreeWeightRecordLabel, formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import { getWorkoutLogQueryTargetMuscle } from '@/utils/workoutLogCache';
import { buildRecordsDateUrl } from '@/utils/recommendationDuplicate';
import { dismissForToday, isDismissedToday } from '@/utils/dismissToday';

const RECORDS_NUDGE_DISMISS_KEY = 'machinefit-result-records-nudge';
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
  const planDateParam = searchParams.get('planDate');
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(['machines', 'common']);
  const stateResult = location.state?.result as RecommendationResult | undefined;
  const locale = useSettingsStore((s) => s.locale);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeGymId } = useActiveGym();
  const { activeMemberId } = useActiveMember();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const setRecordsNavNudge = useUIStore((s) => s.setRecordsNavNudge);
  const [logControl, setLogControl] = useState<WorkoutLogPanelControl | null>(null);
  const [workoutLogSavedOverride, setWorkoutLogSavedOverride] = useState<boolean | null>(null);
  const [bodyExpanded, setBodyExpanded] = useState(true);
  const [planLinked, setPlanLinked] = useState(false);
  const [isEditingAdjustments, setIsEditingAdjustments] = useState(false);
  const [prefsSavedLocally, setPrefsSavedLocally] = useState(false);
  const [recordsNudgeVisible, setRecordsNudgeVisible] = useState(false);

  const planDate = planDateParam ? normalizeDateKey(planDateParam) : null;
  const today = getTodayDateKey();

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
  const shouldCreatePlanOnSave =
    Boolean(planDate) &&
    planDate! >= today &&
    isAuthenticated &&
    Boolean(activeGymId) &&
    Boolean(activeMemberId) &&
    !isAllGymsId(activeGymId ?? '');

  const createPlanMutation = useMutation({
    mutationFn: async (item: RecommendationResult) => {
      // Match WorkoutLogPanel default (search → recommend → log), not a single-set stub.
      const defaultSetCount = 3;
      const seedKg = item.settings.recommendedWeightKg ?? 0;
      const res = await workoutCardApi.create({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        machineCode: item.machineCode,
        scheduledDate: planDate!,
        status: 'PLANNED',
        setCount: defaultSetCount,
        setWeightsKg: Array.from({ length: defaultSetCount }, () => seedKg),
        recommendationId: item.id,
        ...(item.targetMuscleGroup
          ? { targetMuscleGroup: item.targetMuscleGroup }
          : {}),
      });
      return res.data.data;
    },
    onSuccess: async () => {
      setPlanLinked(true);
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCards });
      setRecordsNavNudge(true, { tip: true });
      showToast(t('machines:history.planCreated'), 'success');
    },
  });

  const handleWorkoutSavedChange = (saved: boolean) => {
    setWorkoutLogSavedOverride(saved);
    if (
      saved &&
      shouldCreatePlanOnSave &&
      !planLinked &&
      !createPlanMutation.isPending &&
      result
    ) {
      createPlanMutation.mutate(result);
    }
  };

  const resultLogDate = normalizeDateKey(logDateParam ?? planDate ?? getLocalDateKey(result?.createdAt ?? ''));
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

  useEffect(() => {
    if (!result?.id) return;
    void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
      trackFeature('recommend_view', { machineCode: result.machineCode })
    );
  }, [result?.id, result?.machineCode]);

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

  useEffect(() => {
    setIsEditingAdjustments(false);
    setPrefsSavedLocally(false);
  }, [result?.id]);

  useEffect(() => {
    if (fitFeedback.savedRating !== 'bad') {
      setIsEditingAdjustments(false);
    }
  }, [fitFeedback.savedRating]);

  const hasSavedPreferences =
    prefsSavedLocally ||
    fitFeedback.hasSavedPreferences ||
    Boolean(
      result?.adjustedSettings && Object.keys(result.adjustedSettings).length > 0
    );
  const showAdjustment = fitFeedback.showAdjustment;
  const adjustmentReadOnly = showAdjustment && hasSavedPreferences && !isEditingAdjustments;
  const canSavePreferences = showAdjustment && !adjustmentReadOnly;
  const badButtonSaveMode = fitFeedback.savedRating === 'bad' && canSavePreferences;

  const handleSettingsSave = useCallback(() => {
    if (!canSavePreferences || fitFeedback.isPreferencesPending) return;
    void fitFeedback.savePreferencesAsync(() => {
      setPrefsSavedLocally(true);
      setIsEditingAdjustments(false);
    });
  }, [canSavePreferences, fitFeedback]);

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

  // Only from Records (logDate in URL). Fresh recommend has no logDate — double-tap
  // must not navigate(-1) back to machine search.
  const recordsReturnDate = logDateParam ? normalizeDateKey(logDateParam) : '';
  const isFreshRecommend = isAuthenticated && !logDateParam;

  useEffect(() => {
    if (!isAuthenticated || !result?.id) {
      setRecordsNudgeVisible(false);
      return;
    }
    // Fresh recommend: banner + tip. From Records detail (logDate): green-dot only.
    if (isFreshRecommend && !isDismissedToday(RECORDS_NUDGE_DISMISS_KEY)) {
      setRecordsNudgeVisible(true);
    } else {
      setRecordsNudgeVisible(false);
    }
    // Do not clear nudge on unmount — keep until Records is opened.
    setRecordsNavNudge(true, { tip: isFreshRecommend });
  }, [isAuthenticated, isFreshRecommend, setRecordsNavNudge, result?.id]);

  const dismissRecordsNudge = useCallback(() => {
    dismissForToday(RECORDS_NUDGE_DISMISS_KEY);
    setRecordsNudgeVisible(false);
    setRecordsNavNudge(false);
  }, [setRecordsNavNudge]);

  const returnToRecords = useCallback(() => {
    if (!recordsReturnDate) return;
    navigate(`${ROUTES.RECORDS}?date=${encodeURIComponent(recordsReturnDate)}`);
  }, [recordsReturnDate, navigate]);

  const doubleTapBack = useDoubleTapAction(returnToRecords, {
    enabled: Boolean(recordsReturnDate),
  });

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
    <div
      className="recommendation-result-page recommendation-result-page--inline-actions"
      onPointerUp={doubleTapBack.onPointerUp}
      onDoubleClick={doubleTapBack.onDoubleClick}
    >
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
                {recordsNudgeVisible ? (
                  <div className="recommendation-result-page__records-nudge" role="status">
                    <div className="recommendation-result-page__records-nudge-text">
                      <p className="recommendation-result-page__records-nudge-title">
                        {t('machines:recommendation.recordsNudgeTitle')}
                      </p>
                      <p className="recommendation-result-page__records-nudge-body">
                        {t('machines:recommendation.recordsNudgeBody')}
                      </p>
                    </div>
                    <div className="recommendation-result-page__records-nudge-actions">
                      <Link
                        to={buildRecordsDateUrl(resultLogDate || today)}
                        className="btn btn--secondary recommendation-result-page__records-nudge-cta"
                        onClick={() => setRecordsNavNudge(false)}
                      >
                        {t('machines:recommendation.recordsNudgeCta')}
                      </Link>
                      <button
                        type="button"
                        className="recommendation-result-page__records-nudge-close"
                        aria-label={t('machines:recommendation.recordsNudgeClose')}
                        onClick={dismissRecordsNudge}
                      >
                        <X size={16} strokeWidth={2.25} aria-hidden />
                      </button>
                    </div>
                  </div>
                ) : null}
                {isAuthenticated ? (
                  <FitFeedbackPanel
                    savedRating={fitFeedback.savedRating}
                    showIntroText={false}
                    badButtonSaveMode={badButtonSaveMode}
                    onBadSave={handleSettingsSave}
                    preferencesDirty={fitFeedback.settingsDirty}
                    onRating={(rating) => {
                      if (rating === 'bad') setIsEditingAdjustments(true);
                      else setIsEditingAdjustments(false);
                      fitFeedback.handleRating(rating);
                    }}
                    isPending={
                      fitFeedback.isFeedbackPending || fitFeedback.isPreferencesPending
                    }
                  />
                ) : null}
                {isAuthenticated ? (
                  <ActiveSettingsSourceBanner
                    activeSource={fitFeedback.activeSource}
                    aiSettings={result.aiRecommendedSettings ?? result.settings}
                    adjustedSettings={
                      showAdjustment
                        ? (fitFeedback.displayAdjustedSettings ?? result.adjustedSettings)
                        : null
                    }
                    formatWeight={formatWeight}
                    showAdjustedCompare={showAdjustment}
                    pendingAdjustment={
                      showAdjustment && fitFeedback.customSettings.recommendedWeightKg == null
                    }
                  />
                ) : null}
                <RecommendationSettingsPanel
                  settings={result.aiRecommendedSettings ?? result.settings}
                  weightBasis={result.weightBasis}
                  variant="history"
                  showAdjustment={showAdjustment}
                  adjustmentReadOnly={adjustmentReadOnly}
                  customSettings={showAdjustment ? fitFeedback.customSettings : undefined}
                  onCustomChange={
                    showAdjustment && !adjustmentReadOnly
                      ? fitFeedback.handleCustomChange
                      : undefined
                  }
                />
              </div>
            </>
          ) : null}

          {/* Keep mounted while collapsed so header 기록 (bookmark) stays enabled. */}
          <WorkoutLogPanel
            machineCode={result.machineCode}
            machineName={result.machineName}
            recommendationId={result.id}
            suggestedWeightKg={resolveWorkoutLogSeedWeightKg({
              fitRating: fitFeedback.savedRating,
              // Live on-screen 조정중량 (not only last saved prefs row).
              adjustedWeight:
                fitFeedback.displayAdjustedSettings?.recommendedWeightKg ??
                fitFeedback.customSettings.recommendedWeightKg,
              // On-screen 추천중량 (AI recommendation shown when “잘 맞음”).
              recommendedWeight: (result.aiRecommendedSettings ?? result.settings)
                .recommendedWeightKg,
            })}
            volumeReps={resolveWorkoutLogSeedReps({
              fitRating: fitFeedback.savedRating,
              adjustedReps:
                fitFeedback.displayAdjustedSettings?.recommendedRepsMin ??
                fitFeedback.displayAdjustedSettings?.recommendedRepsMax ??
                fitFeedback.customSettings.recommendedRepsMin ??
                fitFeedback.customSettings.recommendedRepsMax,
              // Prefer AI block, then base settings (AI object may omit reps).
              recommendedReps:
                result.aiRecommendedSettings?.recommendedRepsMin ??
                result.aiRecommendedSettings?.recommendedRepsMax ??
                result.settings.recommendedRepsMin ??
                result.settings.recommendedRepsMax,
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
            onSavedChange={handleWorkoutSavedChange}
            onVolumeRepsChange={
              fitFeedback.showAdjustment
                ? (reps) =>
                    fitFeedback.handleCustomChange(
                      'recommendedRepsMin',
                      String(reps),
                      'number'
                    )
                : undefined
            }
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
        <MachineCardDisclaimerNotices />
        <AdSlot placement="RECOMMENDATION_BOTTOM" event="RECOMMENDATION_RESULT" />
      </div>
    </div>
  );
}
