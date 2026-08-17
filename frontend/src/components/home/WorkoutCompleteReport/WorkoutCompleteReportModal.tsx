import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Dumbbell,
  Flame,
  Heart,
  Layers,
  Weight,
} from 'lucide-react';
import {
  formatVolumeKg,
  formatWorkoutDurationCompact,
  type WorkoutCompleteReport,
} from '@machinefit/shared';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { useUIStore } from '@/store/ui.store';
import { useWorkoutCompleteStore } from '@/store/workoutComplete.store';
import { buildShareHashtags } from '@/utils/shareHashtags';
import '@/styles/workout-complete.css';

interface WorkoutCompleteReportModalProps {
  open: boolean;
  report: WorkoutCompleteReport | null;
  loading?: boolean;
  onClose: () => void;
}

const GAUGE_R = 54;
const GAUGE_C = 2 * Math.PI * GAUGE_R;
/** 90 minutes maps to a full ring — decorative progress, not a hard goal. */
const GAUGE_FULL_MS = 90 * 60 * 1000;

function formatReportDate(dateKey: string, locale: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  if (!y || !m || !d) return dateKey;
  const dt = new Date(y, m - 1, d);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(dt);
  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}.${mm}.${dd} (${weekday})`;
}

function DurationGauge({ durationMs, label }: { durationMs: number; label: string }) {
  const progress = Math.min(1, Math.max(0.08, durationMs / GAUGE_FULL_MS));
  const dash = GAUGE_C * progress;
  const value = formatWorkoutDurationCompact(durationMs);

  return (
    <div className="wcr-gauge">
      <svg className="wcr-gauge__svg" viewBox="0 0 140 140" aria-hidden="true">
        <circle className="wcr-gauge__track" cx="70" cy="70" r={GAUGE_R} />
        <circle
          className="wcr-gauge__arc"
          cx="70"
          cy="70"
          r={GAUGE_R}
          strokeDasharray={`${dash} ${GAUGE_C}`}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="wcr-gauge__center">
        <strong className="wcr-gauge__value">{value}</strong>
        <span className="wcr-gauge__label">{label}</span>
      </div>
    </div>
  );
}

function PulseSvg() {
  return (
    <svg className="wcr-ekg" viewBox="0 0 220 56" fill="none" aria-hidden="true">
      <path
        className="wcr-ekg__path"
        d="M2 32 H38 L48 32 L56 12 L68 48 L78 28 L90 32 H118 L128 32 L136 8 L148 50 L158 26 L168 32 H218"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WorkoutCompleteReportModal({
  open,
  report,
  loading,
  onClose,
}: WorkoutCompleteReportModalProps) {
  const { t, i18n } = useTranslation(['common', 'machines']);
  const showToast = useUIStore((s) => s.showToast);
  const posterSource = useWorkoutCompleteStore((s) => s.posterSource);
  const [capturing, setCapturing] = useState(false);
  const sheetRef = useModalAccessibility({ open, onClose });

  const dateLabel = useMemo(
    () => (report ? formatReportDate(report.dateKey, i18n.language || 'ko') : ''),
    [report, i18n.language]
  );

  if (!open) return null;

  const handleScreenshot = async () => {
    if (capturing || !report) return;
    setCapturing(true);
    try {
      const { buildWorkoutScreenshotPoster } = await import('@/utils/workoutScreenshotPoster');
      const { isShareAbortError, savePngBlobToPhotos } = await import('@/utils/saveImageToPhotos');
      const { buildWorkoutPosterExercises } = await import('@/utils/workoutPosterExerciseDetails');
      const { resolveRecordMachineImageUrl } = await import('@/utils/catalogAssets');

      const hashtags = buildShareHashtags([], t('workoutComplete.shareHashtags'));
      const locale = i18n.language?.startsWith('ko') ? 'ko' : 'en';

      const imageByMachine: Record<string, string | null> = {};
      for (const ex of report.summary.exercises) {
        imageByMachine[ex.machineCode] =
          resolveRecordMachineImageUrl(ex.machineCode, {
            targetMuscleGroup: ex.targetMuscleGroup,
          }) ?? null;
      }

      const exercises = buildWorkoutPosterExercises({
        exercises: report.summary.exercises,
        logs: posterSource?.todayLogs ?? [],
        repsByMachine: posterSource?.repsByMachine,
        imageByMachine,
        muscleLabel: (group) => {
          if (!group) return null;
          const key = `muscleGroups.${group}`;
          const label = t(key, { ns: 'machines', defaultValue: '' });
          return label && label !== key ? label : group;
        },
      });

      const blob = await buildWorkoutScreenshotPoster({
        report,
        exercises,
        locale,
        labels: {
          brand: t('workoutComplete.brand'),
          titleLead: "TODAY'S",
          titleAccent: 'WORKOUT',
          tagline: t('workoutComplete.tagline'),
          duration: t('workoutComplete.statDuration'),
          exercisesLabel: t('workoutComplete.statExercisesSub'),
          setsLabel: t('workoutComplete.statSetsSub'),
          volumeLabel: t('workoutComplete.statVolumeSub'),
          powerTitle: t('workoutComplete.powerTitle'),
          mvpTitle: t('workoutComplete.mvpTitle'),
          newRecordTitle: t('workoutComplete.newRecordTitle'),
          exerciseListTitle: t('workoutComplete.exerciseListTitle'),
          setsMeta: t('workoutComplete.exerciseSetsCol'),
          setCol: t('workoutComplete.posterSetCol'),
          repsCol: t('workoutComplete.posterRepsCol'),
          loadCol: t('workoutComplete.posterLoadCol'),
          moreExercises: t('workoutComplete.moreExercises'),
          oneLinerTitle: t('workoutComplete.oneLinerTitle'),
          oneLiner: t(`workoutComplete.oneLiner.${report.oneLinerKey}`),
          keepGoing: t('workoutComplete.keepGoing'),
          hashtags,
          bodyweight: t('brandBodyweightShort', { ns: 'machines', defaultValue: 'BW' }),
        },
      });

      try {
        const result = await savePngBlobToPhotos({
          blob,
          filename: `machinefit-todays-workout-${report.dateKey}.png`,
          title: t('workoutComplete.todaysWorkout'),
          longPressHint: t('workoutComplete.screenshotLongPress'),
          closeLabel: t('actions.close'),
        });
        if (result === 'downloaded') {
          showToast(t('workoutComplete.screenshotSaved'), 'success');
        }
      } catch (shareError) {
        if (isShareAbortError(shareError)) return;
        throw shareError;
      }
    } catch {
      showToast(t('workoutComplete.screenshotFailed'), 'error');
    } finally {
      setCapturing(false);
    }
  };

  const bgUrl = `${String(import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/')}assets/share/workout/cinematic-gym.jpg`;

  return (
    <div className="dialog-overlay wcr-overlay" role="presentation">
      <div
        ref={sheetRef}
        className="wcr-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wcr-title"
        onClick={(e) => e.stopPropagation()}
        style={{ ['--wcr-bg' as string]: `url(${bgUrl})` }}
      >
        <div className="wcr-sheet__glow" aria-hidden="true" />

        {loading || !report ? (
          <div className="wcr-loading" aria-busy="true">
            <p>{t('workoutComplete.loading')}</p>
          </div>
        ) : (
          <>
            <header className="wcr-hero">
              <p className="wcr-brand">{t('workoutComplete.brand')}</p>
              <div className="wcr-title-row">
                <h2 id="wcr-title" className="wcr-title">
                  <span className="wcr-title__lead">TODAY&apos;S</span>{' '}
                  <span className="wcr-title__accent">WORKOUT</span>
                </h2>
                <p className="wcr-tagline">{t('workoutComplete.tagline')}</p>
              </div>
              <p className="wcr-date">
                <CalendarDays size={15} strokeWidth={2.2} aria-hidden="true" />
                <span>{dateLabel}</span>
              </p>
            </header>

            <section className="wcr-pulse" aria-label={t('workoutComplete.statDuration')}>
              <DurationGauge
                durationMs={report.summary.durationMs}
                label={t('workoutComplete.statDuration')}
              />
              <div className="wcr-pulse__side">
                <PulseSvg />
                <p className="wcr-pulse__cheer">{t('workoutComplete.cheerSupport')}</p>
              </div>
            </section>

            <section className="wcr-stats" aria-label={t('workoutComplete.summaryAria')}>
              <article className="wcr-stat">
                <Dumbbell className="wcr-stat__icon" size={22} strokeWidth={2.1} aria-hidden="true" />
                <strong className="wcr-stat__value">{report.summary.exerciseCount}</strong>
                <span className="wcr-stat__en">{t('workoutComplete.statExercises')}</span>
                <span className="wcr-stat__ko">{t('workoutComplete.statExercisesSub')}</span>
              </article>
              <article className="wcr-stat">
                <Layers className="wcr-stat__icon" size={22} strokeWidth={2.1} aria-hidden="true" />
                <strong className="wcr-stat__value">{report.summary.setCount}</strong>
                <span className="wcr-stat__en">{t('workoutComplete.statSets')}</span>
                <span className="wcr-stat__ko">{t('workoutComplete.statSetsSub')}</span>
              </article>
              <article className="wcr-stat">
                <Weight className="wcr-stat__icon" size={22} strokeWidth={2.1} aria-hidden="true" />
                <strong className="wcr-stat__value">
                  {formatVolumeKg(report.summary.totalVolumeKg)}
                  <span className="wcr-stat__unit"> kg</span>
                </strong>
                <span className="wcr-stat__en">{t('workoutComplete.statVolume')}</span>
                <span className="wcr-stat__ko">{t('workoutComplete.statVolumeSub')}</span>
              </article>
            </section>

            {report.power ? (
              <section className="wcr-power" aria-label={t('workoutComplete.powerTitle')}>
                <div className="wcr-power__ring" aria-hidden="true">
                  <div className="wcr-power__ring-core">
                    <Flame size={18} strokeWidth={2.4} />
                    <p className="wcr-power__ring-label">
                      {t('workoutComplete.powerTitle')}
                      <strong>{report.power.balance}</strong>
                    </p>
                  </div>
                </div>
                <div className="wcr-power__copy">
                  {report.power.earnedToday > 0 ? (
                    <p className="wcr-power__earned">
                      {t('workoutComplete.powerEarned', { points: report.power.earnedToday })}
                    </p>
                  ) : (
                    <p className="wcr-power__hint">{t('workoutComplete.powerHint')}</p>
                  )}
                  <div className="wcr-power__flow" aria-hidden="true">
                    <span className="wcr-power__flow-icon">
                      <Dumbbell size={14} />
                    </span>
                    <ArrowRight size={12} />
                    <span className="wcr-power__flow-icon">
                      <Heart size={14} />
                    </span>
                    <ArrowRight size={12} />
                    <span className="wcr-power__flow-icon wcr-power__flow-icon--hot">
                      <Flame size={14} />
                    </span>
                  </div>
                </div>
              </section>
            ) : null}

            {report.mvp ? (
              <section className="wcr-block" aria-label={t('workoutComplete.mvpTitle')}>
                <p className="wcr-block__eyebrow">{t('workoutComplete.mvpTitle')}</p>
                <h3 className="wcr-block__title">{report.mvp.machineName}</h3>
                <p className="wcr-block__value">{report.mvp.valueLabel}</p>
                <p className="wcr-block__sub">
                  {t(`workoutComplete.mvpReason.${report.mvp.reasonKey}`)}
                </p>
              </section>
            ) : null}

            {report.newRecord ? (
              <section className="wcr-block" aria-label={t('workoutComplete.newRecordTitle')}>
                <p className="wcr-block__eyebrow">{t('workoutComplete.newRecordTitle')}</p>
                <h3 className="wcr-block__title">{report.newRecord.machineName}</h3>
                <div className="wcr-record__rows">
                  <div>
                    <span>{t('workoutComplete.recordToday')}</span>
                    <strong>{formatVolumeKg(report.newRecord.todayVolumeKg)} kg</strong>
                  </div>
                  <div>
                    <span>{t('workoutComplete.recordPrev')}</span>
                    <strong>{formatVolumeKg(report.newRecord.previousBestKg)} kg</strong>
                  </div>
                </div>
                <p className="wcr-record__delta">
                  +{formatVolumeKg(report.newRecord.deltaKg)} kg
                </p>
              </section>
            ) : report.progress?.vsAvgPercent != null && report.progress.vsAvgPercent !== 0 ? (
              <section className="wcr-block" aria-label={t('workoutComplete.progressTitle')}>
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

            <section className="wcr-quote" aria-label={t('workoutComplete.oneLinerTitle')}>
              <span className="wcr-quote__mark" aria-hidden="true">
                “
              </span>
              <p className="wcr-quote__eyebrow">{t('workoutComplete.oneLinerTitle')}</p>
              <p className="wcr-quote__text">
                {t(`workoutComplete.oneLiner.${report.oneLinerKey}`)}
              </p>
            </section>

            <div className="wcr-actions">
              <button
                type="button"
                className="wcr-btn wcr-btn--share"
                onClick={() => void handleScreenshot()}
                disabled={capturing}
              >
                <Camera size={18} strokeWidth={2.4} aria-hidden="true" />
                <span className="wcr-btn__stack">
                  <span className="wcr-btn__primary">{t('workoutComplete.screenshot')}</span>
                  {t('workoutComplete.screenshotEn') !== t('workoutComplete.screenshot') ? (
                    <span className="wcr-btn__secondary">{t('workoutComplete.screenshotEn')}</span>
                  ) : null}
                </span>
              </button>
              <button type="button" className="wcr-btn wcr-btn--done" onClick={onClose}>
                <span className="wcr-btn__stack">
                  <span className="wcr-btn__primary">{t('workoutComplete.done')}</span>
                  {t('workoutComplete.doneEn') !== t('workoutComplete.done') ? (
                    <span className="wcr-btn__secondary">{t('workoutComplete.doneEn')}</span>
                  ) : null}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
