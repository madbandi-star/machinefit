import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkoutCompleteReportModal } from '@/components/home/WorkoutCompleteReport/WorkoutCompleteReportModal';
import { WorkoutEndConfirmSheet } from '@/components/home/WorkoutCompleteReport/WorkoutEndConfirmSheet';
import { emitWorkoutCompleted } from '@/events/workoutEvents';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { fetchWorkoutCompleteReport } from '@/services/workoutCompleteReport.service';
import { useUIStore } from '@/store/ui.store';
import {
  getWorkoutSessionElapsedMs,
  useWorkoutSessionTimerStore,
} from '@/store/workoutSessionTimer.store';
import { useWorkoutCompleteStore } from '@/store/workoutComplete.store';
import { getTodayDateKey } from '@/utils/historyDate';

/**
 * Confirm + TODAY'S WORKOUT report host for home session end.
 * Concurrent confirms are ignored via in-flight guard (no duplicate POWER display thrash).
 */
export function WorkoutCompleteHost() {
  const { t, i18n } = useTranslation('common');
  const showToast = useUIStore((s) => s.showToast);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, isRealGym } = useActiveMember();

  const confirmOpen = useWorkoutCompleteStore((s) => s.confirmOpen);
  const reportOpen = useWorkoutCompleteStore((s) => s.reportOpen);
  const report = useWorkoutCompleteStore((s) => s.report);
  const completing = useWorkoutCompleteStore((s) => s.completing);
  const closeConfirm = useWorkoutCompleteStore((s) => s.closeConfirm);
  const setCompleting = useWorkoutCompleteStore((s) => s.setCompleting);
  const beginReport = useWorkoutCompleteStore((s) => s.beginReport);
  const openReport = useWorkoutCompleteStore((s) => s.openReport);
  const closeReport = useWorkoutCompleteStore((s) => s.closeReport);

  const endTimer = useWorkoutSessionTimerStore((s) => s.end);
  const [reportLoading, setReportLoading] = useState(false);
  const inFlightRef = useRef(false);

  const handleConfirmEnd = useCallback(async () => {
    if (inFlightRef.current || completing) return;
    inFlightRef.current = true;
    setCompleting(true);
    closeConfirm();

    const timerState = useWorkoutSessionTimerStore.getState();
    const endedAtMs = Date.now();
    const durationMs =
      timerState.status === 'idle'
        ? (timerState.lastEndedElapsedMs ?? 0)
        : getWorkoutSessionElapsedMs(timerState, endedAtMs);

    endTimer();
    void import('@/utils/timerHistoryPersist').then(({ persistEndedTimerSession }) => {
      persistEndedTimerSession({
        durationMs,
        endedAtMs,
        gymId: activeGymId,
        memberId: activeMemberId,
        sessionStartedAtMs: timerState.sessionStartedAtMs,
        clientSessionId: timerState.clientSessionId,
        laps: timerState.laps,
        machineMarks: timerState.machineMarks,
      });
    });
    void import('@/utils/usageTelemetry').then(({ trackUsage }) => trackUsage('timer_end'));

    const dateKey = getTodayDateKey();
    beginReport();
    setReportLoading(true);

    try {
      if (!activeGymId) {
        showToast(t('workoutComplete.needGym'), 'error');
        closeReport();
        return;
      }

      const preferenceScope =
        isRealGym && activeGymId && activeMemberId
          ? { gymId: activeGymId, memberId: activeMemberId }
          : undefined;

      const { report: built, todayLogs, repsByMachine } = await fetchWorkoutCompleteReport({
        gymId: activeGymId,
        memberId: activeMemberId,
        dateKey,
        durationMs,
        locale: i18n.language,
        preferenceScope,
      });

      if (built.summary.durationMs <= 0 && durationMs > 0) {
        built.summary.durationMs = durationMs;
      }

      const reportLaps = (
        await import('@/utils/timerHistoryPersist')
      ).buildReportLapsFromTimerSession({
        clientSessionId: timerState.clientSessionId,
        sessionStartedAtMs: timerState.sessionStartedAtMs,
        endedAtMs,
        durationMs,
        laps: timerState.laps,
        machineMarks: timerState.machineMarks,
        todayLogs,
      });
      if (reportLaps.length > 0) {
        built.laps = reportLaps;
      }

      openReport(built, { todayLogs, repsByMachine });
      emitWorkoutCompleted({ report: built });
      // After result is shown — never before. Server flags usually deny until enabled.
      void import('@/ads/adEventBus').then(({ adEventBus }) => {
        adEventBus.emit({ placement: 'WORKOUT_COMPLETE', event: 'WORKOUT_COMPLETE' });
      });
    } catch {
      showToast(t('errors.loadFailed'), 'error');
      closeReport();
    } finally {
      setReportLoading(false);
      setCompleting(false);
      inFlightRef.current = false;
    }
  }, [
    activeGymId,
    activeMemberId,
    beginReport,
    closeConfirm,
    closeReport,
    completing,
    endTimer,
    i18n.language,
    isRealGym,
    openReport,
    setCompleting,
    showToast,
    t,
  ]);

  return (
    <>
      <WorkoutEndConfirmSheet
        open={confirmOpen}
        confirming={completing}
        onClose={closeConfirm}
        onConfirm={() => void handleConfirmEnd()}
      />
      <WorkoutCompleteReportModal
        open={reportOpen}
        report={reportLoading ? null : report}
        loading={reportLoading}
        onClose={closeReport}
      />
    </>
  );
}
