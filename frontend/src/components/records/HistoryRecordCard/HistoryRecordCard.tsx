import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { RecommendationSettings, TargetMuscleGroup } from '@machinefit/shared';
import { Icon } from '@/components/icons/Icon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import {
  WorkoutLogPanel,
  type WorkoutLogPanelControl,
} from '@/components/recommendation/WorkoutLogPanel/WorkoutLogPanel';
import { formatHistoryTime } from '@/utils/historyDate';
import type { HistoryRecordCard as HistoryRecordCardData } from '@/utils/historyRecordsDisplay';

interface HistoryRecordCardProps {
  card: HistoryRecordCardData;
  resultUrl: string;
  displayName: string;
  muscleGroup?: string;
  hasWorkoutLog: boolean;
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
  t: (key: string) => string
): string {
  if (!control) return t('machines:history.bookmarkSave');
  if (!control.isLogSaved) return t('machines:history.bookmarkSave');
  if (control.isDirty) return t('machines:history.bookmarkUpdate');
  return t('machines:history.bookmarkRemove');
}

export function HistoryRecordCard({
  card,
  resultUrl,
  displayName,
  muscleGroup,
  hasWorkoutLog,
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

  const bookmarkActive = Boolean(logControl?.isLogSaved);
  const bookmarkDirty = Boolean(logControl?.isDirty);
  const bookmarkPending = Boolean(logControl?.isActionPending);

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

  return (
    <article
      id={`history-item-${card.cardId}`}
      className={`history-record-card${hasWorkoutLog ? ' history-record-card--logged' : ' history-record-card--unlogged'}${isFocused ? ' history-record-card--focused' : ''}`}
    >
      <header className="history-record-card__header">
        <Link to={resultUrl} className="history-record-card__title-link">
          <MachineNameWithMuscle
            muscleGroup={muscleGroup}
            name={displayName}
            iconSize={22}
            labelClassName="history-record-card__machine-name"
          />
          <div className="history-record-card__meta">
            <span className="history-record-card__time">
              {formatHistoryTime(card.viewedAt, i18n.language)}
            </span>
            <span
              className={`history-record-card__status${
                hasWorkoutLog ? ' history-record-card__status--saved' : ''
              }`}
            >
              {hasWorkoutLog
                ? t('machines:history.workoutSavedBadge')
                : t('machines:history.workoutUnsavedBadge')}
            </span>
          </div>
        </Link>

        <div className="history-record-card__header-actions">
          <button
            type="button"
            className={`history-record-card__bookmark${
              bookmarkActive ? ' history-record-card__bookmark--active' : ''
            }${bookmarkDirty ? ' history-record-card__bookmark--dirty' : ''}`}
            aria-label={getBookmarkAriaLabel(logControl, t)}
            onClick={handleBookmarkClick}
            disabled={!isAuthenticated || bookmarkPending || !logControl}
          >
            <Icon name="bookmark" size={18} />
          </button>
          <button
            type="button"
            className="history-record-card__remove"
            aria-label={t('machines:history.remove')}
            onClick={onDelete}
            disabled={deleteDisabled}
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      </header>

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
          customSettings={customSettings}
          historyTotalWeightKg={logControl?.totalWeightKg}
        />
      </Link>

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
