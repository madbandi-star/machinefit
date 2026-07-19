import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bookmark, Clock3, Heart, SlidersHorizontal, Target, X } from 'lucide-react';
import type { RecommendationSettings, TargetMuscleGroup } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import {
  WorkoutLogPanel,
  type WorkoutLogPanelControl,
} from '@/components/recommendation/WorkoutLogPanel/WorkoutLogPanel';
import { HistorySectionHeader } from '@/components/records/history-ui/HistorySectionHeader';
import { formatHistoryTime } from '@/utils/historyDate';
import type { HistoryRecordCard as HistoryRecordCardData } from '@/utils/historyRecordsDisplay';
import { useWorkoutLogSaved } from '@/hooks/useWorkoutLogSaved';
import { useFavoriteToggle } from '@/hooks/useFavoriteToggle';
import { getWorkoutLogQueryTargetMuscle } from '@/utils/workoutLogCache';
import '@/styles/history-premium.css';

interface HistoryRecordCardProps {
  card: HistoryRecordCardData;
  resultUrl: string;
  displayName: string;
  muscleGroup?: string;
  showSettingsCompare: boolean;
  customSettings?: Partial<RecommendationSettings>;
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
  showSettingsCompare,
  customSettings,
  isAuthenticated,
  lockTargetMuscle,
  isFocused = false,
  onDelete,
  deleteDisabled = false,
}: HistoryRecordCardProps) {
  const { t, i18n } = useTranslation(['machines', 'common']);
  const [logControl, setLogControl] = useState<WorkoutLogPanelControl | null>(null);
  const cardTargetMuscle = getWorkoutLogQueryTargetMuscle(
    card.machineCode,
    card.targetMuscleGroup as TargetMuscleGroup | undefined
  );
  const isWorkoutLogSaved = useWorkoutLogSaved({
    machineCode: card.machineCode,
    logDate: card.logDate,
    targetMuscleGroup: cardTargetMuscle,
    isAuthenticated,
  });
  const { isFavorited, toggleFavorite, isPending: isFavoritePending } = useFavoriteToggle({
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

  const handleBookmarkClick = () => {
    if (!logControl || logControl.isActionPending || logControl.isLoading) return;

    if (!isWorkoutLogSaved) {
      logControl.save();
      return;
    }

    if (logControl.isDirty) {
      logControl.save();
      return;
    }

    logControl.remove();
  };

  return (
    <article
      id={`history-item-${card.cardId}`}
      className={`history-record-card history-record-card--premium${
        isWorkoutLogSaved ? ' history-record-card--logged' : ' history-record-card--unlogged'
      }${isFocused ? ' history-record-card--focused' : ''}`}
    >
      <header className="history-record-card__header">
        <Link to={resultUrl} className="history-record-card__hero-link">
          <div className="history-record-card__hero">
            <div className="history-record-card__thumb" aria-hidden>
              {muscleGroup ? (
                <MuscleGroupIcon group={muscleGroup as MuscleGroup} size={36} />
              ) : (
                <div className="history-record-card__thumb-fallback" />
              )}
            </div>
            <div className="history-record-card__hero-body">
              <div className="history-record-card__title-row">
                <h2 className="history-record-card__machine-name">{displayName}</h2>
              </div>
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
            </div>
          </div>
        </Link>

        <div className="history-record-card__header-actions">
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
            onClick={toggleFavorite}
            disabled={isFavoritePending}
          >
            <Heart
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
      </header>

      <div className="history-record-card__section">
        <HistorySectionHeader
          title={t('machines:history.settingsSectionTitle')}
          icon={<SlidersHorizontal size={14} strokeWidth={2.25} aria-hidden />}
        />
        <Link
          to={resultUrl}
          className="history-record-card__settings-link"
          aria-label={t('machines:detail.viewLastResult')}
        >
          <RecommendationSettingsPanel
            settings={card.settings}
            variant="history"
            showAdjustment={showSettingsCompare}
            adjustmentReadOnly
            customSettings={showSettingsCompare ? customSettings : undefined}
            historyTotalWeightKg={logControl?.totalWeightKg}
          />
        </Link>
      </div>

      <WorkoutLogPanel
        key={card.cardId}
        machineCode={card.machineCode}
        machineName={card.machineName}
        recommendationId={card.recommendationId}
        suggestedWeightKg={card.settings.recommendedWeightKg}
        isAuthenticated={isAuthenticated}
        variant="history"
        logDate={card.logDate}
        idPrefix={`history-workout-${card.cardId}`}
        targetMuscleGroup={card.targetMuscleGroup as TargetMuscleGroup | undefined}
        lockTargetMuscle={lockTargetMuscle}
        onControlReady={setLogControl}
      />
    </article>
  );
}
