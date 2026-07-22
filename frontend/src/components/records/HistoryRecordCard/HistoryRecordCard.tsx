import { Link } from 'react-router-dom';
import { useState, useEffect, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, ChevronDown, Clock3, Heart, Target, X } from 'lucide-react';
import type {
  RecommendationSettings,
  SettingsActiveSource,
  TargetMuscleGroup,
} from '@machinefit/shared';
import type { FitRating } from '@/api';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { FitFeedbackPanel } from '@/components/recommendation/FitFeedbackPanel/FitFeedbackPanel';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import {
  WorkoutLogPanel,
  type WorkoutLogPanelControl,
} from '@/components/recommendation/WorkoutLogPanel/WorkoutLogPanel';
import { useMachineFitFeedback } from '@/hooks/useMachineFitFeedback';
import { formatHistoryTime, normalizeDateKey } from '@/utils/historyDate';
import type { HistoryRecordCard as HistoryRecordCardData } from '@/utils/historyRecordsDisplay';
import { useWorkoutLogSaved } from '@/hooks/useWorkoutLogSaved';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { getWorkoutLogQueryTargetMuscle } from '@/utils/workoutLogCache';
import '@/styles/history-premium.css';
import '@/styles/recommendation.css';

interface HistoryRecordCardProps {
  card: HistoryRecordCardData;
  resultUrl: string;
  displayName: string;
  muscleGroup?: string;
  /** Batch-loaded fit rating (keeps 셋팅값 조정 필요 pressed before per-card fetch). */
  initialFitRating?: FitRating | null;
  initialCustomSettings?: Partial<RecommendationSettings>;
  initialActiveSource?: SettingsActiveSource;
  isAuthenticated: boolean;
  lockTargetMuscle: boolean;
  isFocused?: boolean;
  onDelete: () => void;
  deleteDisabled?: boolean;
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

export function HistoryRecordCard({
  card,
  resultUrl,
  displayName,
  muscleGroup,
  initialFitRating = null,
  initialCustomSettings,
  initialActiveSource,
  isAuthenticated,
  lockTargetMuscle,
  isFocused = false,
  onDelete,
  deleteDisabled = false,
}: HistoryRecordCardProps) {
  const { t, i18n } = useTranslation(['machines', 'common']);
  const [expanded, setExpanded] = useState(isFocused);
  const [logControl, setLogControl] = useState<WorkoutLogPanelControl | null>(null);
  const [workoutLogSavedOverride, setWorkoutLogSavedOverride] = useState<boolean | null>(null);
  const logDate = normalizeDateKey(card.logDate);
  const cardTargetMuscle = getWorkoutLogQueryTargetMuscle(
    card.machineCode,
    card.targetMuscleGroup as TargetMuscleGroup | undefined
  );
  const cachedWorkoutLogSaved = useWorkoutLogSaved({
    machineCode: card.machineCode,
    logDate,
    targetMuscleGroup: cardTargetMuscle,
    isAuthenticated,
  });
  const isWorkoutLogSaved = workoutLogSavedOverride ?? cachedWorkoutLogSaved;

  const canUseFitFeedback = isAuthenticated && Boolean(card.recommendationId);
  const fitFeedback = useMachineFitFeedback({
    recommendationId: card.recommendationId ?? '',
    machineCode: card.machineCode,
    recommendedSettings: card.settings,
    initialActiveSource: initialActiveSource,
    enabled: canUseFitFeedback && expanded,
  });
  const savedRating = fitFeedback.savedRating ?? initialFitRating;
  const showAdjustment = fitFeedback.showAdjustment || savedRating === 'bad';
  /** Prefer editing after tapping 셋팅값 조정 필요; after 선호값 저장 show read-only compare. */
  const [isEditingAdjustments, setIsEditingAdjustments] = useState(false);
  const [prefsSavedLocally, setPrefsSavedLocally] = useState(false);
  const hasSavedPreferences =
    prefsSavedLocally ||
    fitFeedback.hasSavedPreferences ||
    Boolean(initialCustomSettings && Object.keys(initialCustomSettings).length > 0);
  const adjustmentReadOnly = showAdjustment && hasSavedPreferences && !isEditingAdjustments;
  const customSettings =
    Object.keys(fitFeedback.customSettings).length > 0
      ? fitFeedback.customSettings
      : (initialCustomSettings ?? {});

  useEffect(() => {
    setWorkoutLogSavedOverride(null);
    setIsEditingAdjustments(false);
    setPrefsSavedLocally(false);
  }, [card.cardId]);

  useEffect(() => {
    if (savedRating !== 'bad') {
      setIsEditingAdjustments(false);
    }
  }, [savedRating]);

  useEffect(() => {
    if (isFocused) setExpanded(true);
  }, [isFocused]);
  const { isFavorited, toggleFavorite, isPending: isFavoritePending, canFavorite } = useFavoriteToggle({
    machineCode: card.machineCode,
    recommendationId: card.recommendationId,
    isAuthenticated,
  });

  const bookmarkActive = isWorkoutLogSaved;
  const bookmarkDirty = Boolean(logControl?.isDirty);
  const bookmarkPending = Boolean(logControl?.isActionPending);
  const muscleLabel = muscleGroup
    ? t(`muscleGroups.${muscleGroup}`, { defaultValue: muscleGroup })
    : null;

  const bookmarkDisabled =
    !isAuthenticated || bookmarkPending || !logControl || logControl.isLoading || logControl.isActionPending;

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

  const handleFavoriteClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    toggleFavorite();
  };

  const handleCollapseClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur();
    event.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const settingsPanel = (
    <RecommendationSettingsPanel
      settings={card.settings}
      variant="history"
      showAdjustment={showAdjustment}
      adjustmentReadOnly={adjustmentReadOnly}
      customSettings={showAdjustment ? customSettings : undefined}
      onCustomChange={
        showAdjustment && !adjustmentReadOnly ? fitFeedback.handleCustomChange : undefined
      }
      onSavePreferences={
        showAdjustment && !adjustmentReadOnly
          ? () =>
              fitFeedback.savePreferences(() => {
                setPrefsSavedLocally(true);
                setIsEditingAdjustments(false);
              })
          : undefined
      }
      isPreferencesPending={fitFeedback.isPreferencesPending}
    />
  );

  return (
    <article
      id={`history-item-${card.cardId}`}
      className={`history-record-card history-record-card--premium${
        isWorkoutLogSaved ? ' history-record-card--logged' : ' history-record-card--unlogged'
      }${isFocused ? ' history-record-card--focused' : ''}${
        expanded ? '' : ' history-record-card--collapsed'
      }`}
    >
      <header className="history-record-card__header">
        <div className="history-record-card__hero">
          <Link to={resultUrl} className="history-record-card__thumb-link" aria-label={displayName}>
            <div className="history-record-card__thumb">
              {muscleGroup ? (
                <MuscleGroupIcon group={muscleGroup as MuscleGroup} size={36} />
              ) : (
                <div className="history-record-card__thumb-fallback" />
              )}
            </div>
          </Link>
          <div className="history-record-card__hero-body">
            <div className="history-record-card__title-row">
              <Link to={resultUrl} className="history-record-card__title-link">
                <h2 className="history-record-card__machine-name">{displayName}</h2>
              </Link>
              <div className="history-record-card__header-actions">
                <button
                  type="button"
                  className="history-record-card__collapse"
                  aria-expanded={expanded}
                  aria-label={expanded ? t('common:collapse') : t('common:expand')}
                  onClick={handleCollapseClick}
                >
                  <ChevronDown
                    size={17}
                    strokeWidth={2.25}
                    className={`history-record-card__collapse-icon${
                      expanded ? ' history-record-card__collapse-icon--open' : ''
                    }`}
                  />
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
                  onClick={handleFavoriteClick}
                  disabled={isFavoritePending || !canFavorite}
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
                  className={`history-record-card__bookmark${
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
                <button
                  type="button"
                  className="history-record-card__remove"
                  aria-label={t('machines:history.remove')}
                  onClick={onDelete}
                  disabled={deleteDisabled}
                >
                  <X size={17} strokeWidth={2.25} />
                </button>
              </div>
            </div>
            <Link to={resultUrl} className="history-record-card__meta-link">
              <div className="history-record-card__meta">
                {muscleLabel ? (
                  <>
                    <span className="history-record-card__meta-item history-record-card__muscle">
                      <Target size={12} strokeWidth={2.25} aria-hidden />
                      {muscleLabel}
                    </span>
                    <span className="history-record-card__meta-divider" aria-hidden>
                      |
                    </span>
                  </>
                ) : null}
                <span className="history-record-card__meta-item history-record-card__time">
                  <Clock3 size={12} strokeWidth={2.25} aria-hidden />
                  {formatHistoryTime(card.viewedAt, i18n.language)}
                </span>
                <span className="history-record-card__meta-divider" aria-hidden>
                  |
                </span>
                <span
                  className={`history-record-card__status${
                    isWorkoutLogSaved ? ' history-record-card__status--saved' : ''
                  }`}
                >
                  {isWorkoutLogSaved
                    ? t('machines:history.workoutSavedBadge')
                    : t('machines:history.workoutUnsavedBadge')}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {expanded ? (
        <>
          <div className="history-record-card__section">
            {showAdjustment ? (
              settingsPanel
            ) : (
              <Link
                to={resultUrl}
                className="history-record-card__settings-link"
                aria-label={t('machines:detail.viewLastResult')}
              >
                {settingsPanel}
              </Link>
            )}
          </div>
          {canUseFitFeedback ? (
            <FitFeedbackPanel
              savedRating={savedRating}
              onRating={(rating) => {
                if (rating === 'bad') setIsEditingAdjustments(true);
                else setIsEditingAdjustments(false);
                fitFeedback.handleRating(rating);
              }}
              isPending={fitFeedback.isFeedbackPending}
            />
          ) : null}
        </>
      ) : null}

      {/* Keep mounted while collapsed so header 기록 (bookmark) stays enabled. */}
      <WorkoutLogPanel
        key={card.cardId}
        machineCode={card.machineCode}
        machineName={card.machineName}
        recommendationId={card.recommendationId}
        suggestedWeightKg={card.settings.recommendedWeightKg}
        isAuthenticated={isAuthenticated}
        variant="history"
        logDate={logDate}
        idPrefix={`history-workout-${card.cardId}`}
        targetMuscleGroup={cardTargetMuscle}
        lockTargetMuscle={lockTargetMuscle}
        showVoiceCoach={expanded}
        onControlReady={setLogControl}
        onSavedChange={setWorkoutLogSavedOverride}
      />

      {!expanded ? (
        <button
          type="button"
          className="history-record-card__body-toggle"
          aria-expanded={false}
          onClick={() => setExpanded(true)}
        >
          <span className="history-record-card__body-toggle-label">
            {t('common:expandCardDetails')}
          </span>
          <ChevronDown size={16} strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
    </article>
  );
}
