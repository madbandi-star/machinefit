import type { FortuneDataAnalysis, FortunePersonalizationTier } from '@machinefit/shared';
import { getPool } from '../../config/database.js';
import { seoulDateKey } from '../../utils/mypage-workout-metrics.js';

export interface FortuneLogRow {
  logDate: string;
  machineCode: string;
  machineType: string | null;
  muscleGroup: string | null;
  targetMuscleGroup: string | null;
  setCount: number;
  maxWeight: number;
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ta = Date.UTC(ay, am - 1, ad);
  const tb = Date.UTC(by, bm - 1, bd);
  return Math.round((tb - ta) / 86_400_000);
}

function classifyEquipment(code: string, machineType: string | null): string {
  if (code === 'FW_DUMBBELL') return 'dumbbell';
  if (code === 'FW_BARBELL') return 'barbell';
  if (code === 'FW_CABLE' || machineType === 'cable') return 'cable';
  if (code.startsWith('BW_') || machineType === 'bodyweight') return 'bodyweight';
  if (code.startsWith('FW_') || machineType === 'free_weight' || machineType === 'smith') {
    return 'free_weight_other';
  }
  return 'machine';
}

function resolveMuscle(log: FortuneLogRow): string | null {
  const t = log.targetMuscleGroup?.trim();
  if (t) return t;
  return log.muscleGroup?.trim() || null;
}

function personalizationTier(logCount: number): FortunePersonalizationTier {
  if (logCount <= 0) return 'none';
  if (logCount < 7) return 'basic';
  if (logCount < 30) return 'pattern';
  return 'advanced';
}

export async function loadFortuneLogs(
  userId: string,
  fromDate: string,
  options?: { gymId?: string; memberId?: string }
): Promise<FortuneLogRow[]> {
  const pool = getPool();
  if (!pool) return [];

  const params: unknown[] = [userId, fromDate];
  let filters = '';
  if (options?.gymId && options?.memberId) {
    params.push(options.gymId, options.memberId);
    filters = ` AND wl.gym_id = $3 AND wl.member_id = $4`;
  }

  const result = await pool.query<{
    log_date: string;
    machine_code: string;
    machine_type: string | null;
    muscle_group: string | null;
    target_muscle_group: string | null;
    set_count: number;
    max_weight: string | number | null;
  }>(
    `SELECT wl.log_date::text,
            m.code AS machine_code,
            m.machine_type,
            m.muscle_group,
            NULLIF(wl.target_muscle_group, '') AS target_muscle_group,
            wl.set_count,
            (
              SELECT MAX(w::numeric)
              FROM jsonb_array_elements_text(COALESCE(wl.set_weights_kg, '[]'::jsonb)) AS t(w)
            ) AS max_weight
     FROM workout_logs wl
     JOIN machines m ON m.id = wl.machine_id
     WHERE wl.user_id = $1 AND wl.log_date >= $2::date${filters}
     ORDER BY wl.log_date ASC, wl.created_at ASC
     LIMIT 800`,
    params
  );

  return result.rows.map((row) => ({
    logDate: String(row.log_date).slice(0, 10),
    machineCode: row.machine_code,
    machineType: row.machine_type,
    muscleGroup: row.muscle_group,
    targetMuscleGroup: row.target_muscle_group,
    setCount: row.set_count,
    maxWeight: row.max_weight != null ? Number(row.max_weight) : 0,
  }));
}

export function computeWorkoutAnalytics(
  logs: FortuneLogRow[],
  todayKey: string = seoulDateKey()
): FortuneDataAnalysis {
  const from7 = shiftDateKey(todayKey, -6);
  const from14 = shiftDateKey(todayKey, -13);
  const from30 = shiftDateKey(todayKey, -29);

  const uniqueDays = (from: string) =>
    new Set(logs.filter((l) => l.logDate >= from && l.logDate <= todayKey).map((l) => l.logDate))
      .size;

  const logs30 = logs.filter((l) => l.logDate >= from30 && l.logDate <= todayKey);
  const workoutCount7d = uniqueDays(from7);
  const workoutCount14d = uniqueDays(from14);
  const workoutCount30d = uniqueDays(from30);

  const daySet = [...new Set(logs30.map((l) => l.logDate))].sort();
  let consecutiveDays = 0;
  let cursor = todayKey;
  const dayLookup = new Set(daySet);
  while (dayLookup.has(cursor)) {
    consecutiveDays += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  const lastWorkout = daySet.length ? daySet[daySet.length - 1] : null;
  const daysSinceLastWorkout =
    lastWorkout != null ? daysBetween(lastWorkout, todayKey) : null;

  // PR: first time a machine's max weight exceeds all prior max for that machine.
  const bestByMachine = new Map<string, number>();
  let lastPrDate: string | null = null;
  for (const log of logs) {
    const prev = bestByMachine.get(log.machineCode) ?? 0;
    if (log.maxWeight > prev + 0.05) {
      if (prev > 0) lastPrDate = log.logDate;
      bestByMachine.set(log.machineCode, log.maxWeight);
    } else if (log.maxWeight > prev) {
      bestByMachine.set(log.machineCode, log.maxWeight);
    }
  }
  const daysSincePr = lastPrDate != null ? daysBetween(lastPrDate, todayKey) : null;

  const eqCounts: Record<string, number> = {
    barbell: 0,
    dumbbell: 0,
    machine: 0,
    cable: 0,
    bodyweight: 0,
    free_weight_other: 0,
  };
  const muscleCounts = new Map<string, number>();
  for (const log of logs30) {
    const eq = classifyEquipment(log.machineCode, log.machineType);
    eqCounts[eq] = (eqCounts[eq] ?? 0) + 1;
    const muscle = resolveMuscle(log);
    if (muscle) muscleCounts.set(muscle, (muscleCounts.get(muscle) ?? 0) + 1);
  }
  const totalEq = Object.values(eqCounts).reduce((a, b) => a + b, 0) || 1;
  const pct = (n: number) => Math.round((n / totalEq) * 100);
  const freeWeightRatio30d = pct(
    eqCounts.barbell + eqCounts.dumbbell + eqCounts.free_weight_other
  );

  let topMuscleGroup: string | null = null;
  let lowMuscleGroup: string | null = null;
  if (muscleCounts.size > 0) {
    const sorted = [...muscleCounts.entries()].sort((a, b) => b[1] - a[1]);
    topMuscleGroup = sorted[0][0];
    lowMuscleGroup = sorted[sorted.length - 1][0];
  }

  const tier = personalizationTier(logs30.length);
  const bullets: string[] = [];
  if (tier === 'none') {
    bullets.push('아직 운동 데이터가 많지 않아요. 기록이 쌓이면 더 개인화된 분석을 볼 수 있어요.');
  } else {
    bullets.push(`최근 7일 동안 ${workoutCount7d}회 운동했어요.`);
    if (workoutCount30d > 0) {
      bullets.push(`최근 30일 동안 ${workoutCount30d}일 운동했어요.`);
    }
    if (consecutiveDays >= 3) {
      bullets.push(`최근 ${consecutiveDays}일 연속 운동 기록이 있어요.`);
    }
    if (daysSincePr != null) {
      bullets.push(`최근 PR 기록은 ${daysSincePr}일 전이에요.`);
    } else if (tier !== 'basic') {
      bullets.push('최근 30일 기준 새로운 PR 기록이 뚜렷하지 않아요.');
    }
    const barbellPct = pct(eqCounts.barbell);
    const dumbbellPct = pct(eqCounts.dumbbell);
    if (barbellPct >= 40) {
      bullets.push(`최근 30일 바벨 운동 비중이 ${barbellPct}%로 높은 편이에요.`);
    }
    if (dumbbellPct <= 15 && logs30.length >= 7) {
      bullets.push(`최근 30일 덤벨 비중은 ${dumbbellPct}%로 낮은 편이에요.`);
    }
    if (pct(eqCounts.machine) >= 50) {
      bullets.push(`최근 30일 머신 비중이 ${pct(eqCounts.machine)}%로 높은 편이에요.`);
    }
    if (lowMuscleGroup && topMuscleGroup && lowMuscleGroup !== topMuscleGroup) {
      bullets.push(`부위별로는 「${lowMuscleGroup}」 빈도가 상대적으로 낮아요.`);
    }
  }

  return {
    personalizationTier: tier,
    workoutCount7d,
    workoutCount14d,
    workoutCount30d,
    logCount30d: logs30.length,
    consecutiveDays,
    daysSinceLastWorkout,
    daysSincePr,
    barbellRatio30d: pct(eqCounts.barbell),
    dumbbellRatio30d: pct(eqCounts.dumbbell),
    machineRatio30d: pct(eqCounts.machine),
    cableRatio30d: pct(eqCounts.cable),
    bodyweightRatio30d: pct(eqCounts.bodyweight),
    freeWeightRatio30d,
    topMuscleGroup,
    lowMuscleGroup,
    personalizedBullets: bullets,
  };
}
