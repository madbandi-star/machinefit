export interface TimerHistoryLapSource {
  index: number;
  splitMs: number;
  totalElapsedMs: number;
  recordedAtMs: number;
}

export interface TimerHistoryBuiltLap {
  lapNumber: number;
  startedAtMs: number;
  endedAtMs: number;
  durationSeconds: number;
}

export interface TimerHistoryMachineMark {
  machineCode: string;
  machineName?: string;
  workoutLogId?: string;
  recordedAtMs: number;
}

export function msToDurationSeconds(ms: number): number {
  return Math.min(86400, Math.max(0, Math.round(Math.max(0, ms) / 1000)));
}

/**
 * Map stopwatch laps (newest-first or any order) into chronological persist rows.
 * A trailing split after the last lap press is stored as the next lap when ≥ 0.5s.
 */
export function buildTimerHistoryLaps(input: {
  sessionStartedAtMs: number;
  endedAtMs: number;
  durationMs: number;
  laps: TimerHistoryLapSource[];
}): TimerHistoryBuiltLap[] {
  const startedAtMs = input.sessionStartedAtMs;
  const endedAtMs = Math.max(input.endedAtMs, startedAtMs);
  const durationSeconds = msToDurationSeconds(input.durationMs);
  const ordered = [...input.laps]
    .filter((lap) => Number.isFinite(lap.index) && lap.index >= 1)
    .sort((a, b) => a.index - b.index || a.recordedAtMs - b.recordedAtMs);

  const rows: TimerHistoryBuiltLap[] = [];
  let prevWall = startedAtMs;
  let lastTotalMs = 0;

  for (const lap of ordered) {
    const endedWall = Math.max(prevWall, lap.recordedAtMs);
    rows.push({
      lapNumber: rows.length + 1,
      startedAtMs: prevWall,
      endedAtMs: endedWall,
      durationSeconds: msToDurationSeconds(lap.splitMs),
    });
    prevWall = endedWall;
    lastTotalMs = Math.max(lastTotalMs, lap.totalElapsedMs);
  }

  const remainingMs = Math.max(0, input.durationMs - lastTotalMs);
  if (remainingMs >= 500 || rows.length === 0) {
    rows.push({
      lapNumber: rows.length + 1,
      startedAtMs: prevWall,
      endedAtMs,
      durationSeconds:
        rows.length === 0 ? durationSeconds : msToDurationSeconds(remainingMs),
    });
  }

  return rows;
}

export function assignMarksToLaps<T extends { recordedAtMs: number }>(
  laps: TimerHistoryBuiltLap[],
  marks: T[]
): Map<number, T[]> {
  const byLap = new Map<number, T[]>();
  for (const lap of laps) byLap.set(lap.lapNumber, []);
  if (laps.length === 0) return byLap;

  const sortedMarks = [...marks].sort((a, b) => a.recordedAtMs - b.recordedAtMs);
  for (const mark of sortedMarks) {
    let assigned = laps.find(
      (lap) => mark.recordedAtMs >= lap.startedAtMs && mark.recordedAtMs <= lap.endedAtMs
    );
    if (!assigned) {
      assigned =
        mark.recordedAtMs < laps[0].startedAtMs
          ? laps[0]
          : laps[laps.length - 1];
    }
    byLap.get(assigned.lapNumber)?.push(mark);
  }
  return byLap;
}
