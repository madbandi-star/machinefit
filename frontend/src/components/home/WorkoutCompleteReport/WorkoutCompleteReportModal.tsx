import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatVolumeKg,
  formatWorkoutDateDots,
  formatWorkoutDurationCompact,
  type WorkoutCompleteReport,
} from '@machinefit/shared';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { useUIStore } from '@/store/ui.store';
import {
  buildWorkoutShareCaption,
  shareWorkoutCompleteCard,
} from '@/utils/shareWorkoutCompleteCard';
import '@/styles/workout-complete.css';

interface WorkoutCompleteReportModalProps {
  open: boolean;
  report: WorkoutCompleteReport | null;
  loading?: boolean;
  onClose: () => void;
}

export function WorkoutCompleteReportModal({
  open,
  report,
  loading,
  onClose,
}: WorkoutCompleteReportModalProps) {
  const { t } = useTranslation('common');
  const showToast = useUIStore((s) => s.showToast);
  const [sharing, setSharing] = useState(false);
  const dialogRef = useModalAccessibility({ open, onClose });

  if (!open) return null;

  const handleShare = async () => {
    if (!report || sharing) return;
    setSharing(true);
    try {
      await shareWorkoutCompleteCard({
        report,
        labels: {
          title: t('workoutComplete.todaysWorkout'),
          exercises: t('workoutComplete.statExercises'),
          sets: t('workoutComplete.statSets'),
          volume: t('workoutComplete.statVolume'),
          power: t('workoutComplete.powerLabel'),
          newRecord: t('workoutComplete.newRecordTitle'),
          keepGoing: t('workoutComplete.keepGoing'),
          shareHashtags: t('workoutComplete.shareHashtags'),
        },
        shareText: buildWorkoutShareCaption(report, t),
        showToast,
        shareSavedMessage: t('workoutComplete.shareSaved'),
        errorMessage: t('errors.submitFailed'),
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="dialog-overlay wcr-overlay" role="presentation">
      <div
        ref={dialogRef}
        className="wcr-sheet card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wcr-title"
        onClick={(e) => e.stopPropagation()}
      >
        {loading || !report ? (
          <div className="wcr-loading" aria-busy="true">
            <p>{t('workoutComplete.loading')}</p>
          </div>
        ) : (
          <>
            <header className="wcr-hero">
              <p className="wcr-eyebrow">{t('workoutComplete.brand')}</p>
              <h2 id="wcr-title" className="wcr-title">
                {t('workoutComplete.todaysWorkout')}
              </h2>
              <p className="wcr-date">{formatWorkoutDateDots(report.dateKey)}</p>
            </header>

            <section className="wcr-stats" aria-label={t('workoutComplete.summaryAria')}>
              <div className="wcr-stat wcr-stat--primary">
                <strong className="wcr-stat__value">
                  {formatWorkoutDurationCompact(report.summary.durationMs)}
                </strong>
                <span className="wcr-stat__label">{t('workoutComplete.statDuration')}</span>
              </div>
              <div className="wcr-stat">
                <strong className="wcr-stat__value">{report.summary.exerciseCount}</strong>
                <span className="wcr-stat__label">{t('workoutComplete.statExercises')}</span>
              </div>
              <div className="wcr-stat">
                <strong className="wcr-stat__value">{report.summary.setCount}</strong>
                <span className="wcr-stat__label">{t('workoutComplete.statSets')}</span>
              </div>
              <div className="wcr-stat">
                <strong className="wcr-stat__value">
                  {formatVolumeKg(report.summary.totalVolumeKg)} kg
                </strong>
                <span className="wcr-stat__label">{t('workoutComplete.statVolume')}</span>
              </div>
            </section>

            {report.power ? (
              <section className="wcr-block wcr-power" aria-label={t('workoutComplete.powerTitle')}>
                <p className="wcr-block__eyebrow">🔥 {t('workoutComplete.powerTitle')}</p>
                <p className="wcr-power__balance">{report.power.balance}</p>
                {report.power.earnedToday > 0 ? (
                  <p className="wcr-power__earned">
                    {t('workoutComplete.powerEarned', { points: report.power.earnedToday })}
                  </p>
                ) : (
                  <p className="wcr-power__hint">{t('workoutComplete.powerHint')}</p>
                )}
                <p className="wcr-block__sub">{t('workoutComplete.powerDone')}</p>
              </section>
            ) : null}

            {report.mvp ? (
              <section className="wcr-block wcr-mvp" aria-label={t('workoutComplete.mvpTitle')}>
                <p className="wcr-block__eyebrow">🏆 {t('workoutComplete.mvpTitle')}</p>
                <h3 className="wcr-mvp__name">{report.mvp.machineName}</h3>
                <p className="wcr-mvp__value">{report.mvp.valueLabel}</p>
                <p className="wcr-block__sub">
                  {t(`workoutComplete.mvpReason.${report.mvp.reasonKey}`)}
                </p>
              </section>
            ) : null}

            {report.newRecord ? (
              <section className="wcr-block wcr-record" aria-label={t('workoutComplete.newRecordTitle')}>
                <p className="wcr-block__eyebrow">🔥 {t('workoutComplete.newRecordTitle')}</p>
                <h3 className="wcr-mvp__name">{report.newRecord.machineName}</h3>
                <div className="wcr-record__rows">
                  <div>
                    <span>{t('workoutComplete.recordToday')}</span>
                    <strong>
                      {formatVolumeKg(report.newRecord.todayVolumeKg)} kg
                    </strong>
                  </div>
                  <div>
                    <span>{t('workoutComplete.recordPrev')}</span>
                    <strong>
                      {formatVolumeKg(report.newRecord.previousBestKg)} kg
                    </strong>
                  </div>
                </div>
                <p className="wcr-record__delta">
                  +{formatVolumeKg(report.newRecord.deltaKg)} kg
                </p>
              </section>
            ) : report.progress?.vsAvgPercent != null && report.progress.vsAvgPercent !== 0 ? (
              <section className="wcr-block wcr-progress" aria-label={t('workoutComplete.progressTitle')}>
                <p className="wcr-block__eyebrow">{t('workoutComplete.progressTitle')}</p>
                <p className="wcr-progress__value">
                  {report.progress.vsAvgPercent > 0 ? '+' : ''}
                  {report.progress.vsAvgPercent}%
                </p>
                <p className="wcr-block__sub">
                  {t('workoutComplete.progressBody', {
                    percent: Math.abs(report.progress.vsAvgPercent),
                    direction:
                      report.progress.vsAvgPercent > 0
                        ? t('workoutComplete.progressMore')
                        : t('workoutComplete.progressLess'),
                  })}
                </p>
              </section>
            ) : null}

            <section className="wcr-block wcr-line" aria-label={t('workoutComplete.oneLinerTitle')}>
              <p className="wcr-block__eyebrow">{t('workoutComplete.oneLinerTitle')}</p>
              <p className="wcr-line__text">
                “{t(`workoutComplete.oneLiner.${report.oneLinerKey}`)}”
              </p>
            </section>

            <div className="wcr-actions">
              <button
                type="button"
                className="btn btn--primary wcr-actions__share"
                onClick={() => void handleShare()}
                disabled={sharing}
              >
                {t('workoutComplete.share')}
              </button>
              <button type="button" className="btn btn--secondary" onClick={onClose}>
                {t('workoutComplete.done')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
