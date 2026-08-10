import type { WorkoutCardVoicePrefs } from '@machinefit/shared';
import { useSettingsStore } from '@/store/settings.store';
import {
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachPrepCount,
  clampVoiceCoachRepGapMs,
  clampVoiceCoachTargetReps,
  clampVoiceCountMode,
  normalizeVoiceCoachPack,
} from '@/utils/voiceCoach';
import { clampVoiceHoldDurationSec, clampVoiceHoldFlowMode } from '@/utils/voiceHold';
import { normalizeDateKey } from '@/utils/historyDate';

export type VoicePickerSnapshot = {
  targetReps: number;
  repGapMs: number;
  oneMoreCount: number;
  holdDurationSec: number;
};

/** Card-scoped session fields (settings-store shape at capture/restore time). */
export type CardVoiceSessionSnapshot = {
  voiceEnabled: boolean;
  voicePack: string;
  countMode: string;
  prepCount: number;
  flowMode: string;
  oneMoreEnabled: boolean;
  autoAfterRest: boolean;
  restTipsEnabled: boolean;
};

export function buildCardVoicePrefsKey(
  machineCode: string,
  logDate: string,
  targetMuscleGroup?: string | null
): string {
  return `${machineCode}:${normalizeDateKey(logDate)}:${targetMuscleGroup ?? ''}`;
}

export function readSettingsVoiceSession(): CardVoiceSessionSnapshot {
  const settings = useSettingsStore.getState();
  return {
    voiceEnabled: settings.voiceCoachEnabled,
    voicePack: settings.voiceCoachPack,
    countMode: settings.voiceCountMode,
    prepCount: settings.voiceCoachPrepCount,
    flowMode: settings.voiceCoachFlowMode,
    oneMoreEnabled: settings.voiceCoachOneMore,
    autoAfterRest: settings.voiceCoachAutoAfterRest,
    restTipsEnabled: settings.voiceRestTipsEnabled,
  };
}

export function readSettingsVoicePickers(seedTargetReps?: number): VoicePickerSnapshot {
  const settings = useSettingsStore.getState();
  const targetReps =
    seedTargetReps != null && seedTargetReps > 0
      ? clampVoiceCoachTargetReps(seedTargetReps)
      : clampVoiceCoachTargetReps(settings.voiceCoachTargetReps);
  return {
    targetReps,
    repGapMs: clampVoiceCoachRepGapMs(settings.voiceCoachRepGapMs),
    oneMoreCount: clampVoiceCoachOneMoreCount(settings.voiceCoachOneMoreCount),
    holdDurationSec: clampVoiceHoldDurationSec(settings.voiceHoldDurationSec),
  };
}

export function normalizeWorkoutCardVoicePrefs(
  prefs: WorkoutCardVoicePrefs
): WorkoutCardVoicePrefs {
  const next: WorkoutCardVoicePrefs = {};
  if (prefs.targetReps != null) {
    next.targetReps = clampVoiceCoachTargetReps(prefs.targetReps);
  }
  if (prefs.repGapMs != null) {
    next.repGapMs = clampVoiceCoachRepGapMs(prefs.repGapMs);
  }
  if (prefs.oneMoreCount != null) {
    next.oneMoreCount = clampVoiceCoachOneMoreCount(prefs.oneMoreCount);
  }
  if (prefs.holdDurationSec != null) {
    next.holdDurationSec = clampVoiceHoldDurationSec(prefs.holdDurationSec);
  }
  if (prefs.voiceEnabled != null) next.voiceEnabled = prefs.voiceEnabled;
  if (prefs.voicePack != null) next.voicePack = normalizeVoiceCoachPack(prefs.voicePack);
  if (prefs.countMode != null) next.countMode = clampVoiceCountMode(prefs.countMode);
  if (prefs.prepCount != null) next.prepCount = clampVoiceCoachPrepCount(prefs.prepCount);
  if (prefs.flowMode != null) next.flowMode = clampVoiceHoldFlowMode(prefs.flowMode);
  if (prefs.oneMoreEnabled != null) next.oneMoreEnabled = prefs.oneMoreEnabled;
  if (prefs.autoAfterRest != null) next.autoAfterRest = prefs.autoAfterRest;
  if (prefs.restTipsEnabled != null) next.restTipsEnabled = prefs.restTipsEnabled;
  return next;
}

/** Merge card-local pickers + session (or settings store) into a prefs payload. */
export function captureWorkoutCardVoicePrefs(options?: {
  pickers?: Partial<VoicePickerSnapshot> | null;
  session?: Partial<CardVoiceSessionSnapshot> | null;
  seedTargetReps?: number;
}): WorkoutCardVoicePrefs {
  const pickers = {
    ...readSettingsVoicePickers(options?.seedTargetReps),
    ...(options?.pickers ?? {}),
  };
  const session = {
    ...readSettingsVoiceSession(),
    ...(options?.session ?? {}),
  };
  return normalizeWorkoutCardVoicePrefs({
    targetReps: pickers.targetReps,
    repGapMs: pickers.repGapMs,
    oneMoreCount: pickers.oneMoreCount,
    holdDurationSec: pickers.holdDurationSec,
    voiceEnabled: session.voiceEnabled,
    voicePack: session.voicePack,
    countMode: session.countMode,
    prepCount: session.prepCount,
    flowMode: session.flowMode,
    oneMoreEnabled: session.oneMoreEnabled,
    autoAfterRest: session.autoAfterRest,
    restTipsEnabled: session.restTipsEnabled,
  });
}

export function pickersFromVoicePrefs(
  prefs?: WorkoutCardVoicePrefs | null,
  seedTargetReps?: number
): VoicePickerSnapshot {
  const fallback = readSettingsVoicePickers(seedTargetReps);
  if (!prefs) return fallback;
  return {
    targetReps:
      prefs.targetReps != null
        ? clampVoiceCoachTargetReps(prefs.targetReps)
        : fallback.targetReps,
    repGapMs:
      prefs.repGapMs != null ? clampVoiceCoachRepGapMs(prefs.repGapMs) : fallback.repGapMs,
    oneMoreCount:
      prefs.oneMoreCount != null
        ? clampVoiceCoachOneMoreCount(prefs.oneMoreCount)
        : fallback.oneMoreCount,
    holdDurationSec:
      prefs.holdDurationSec != null
        ? clampVoiceHoldDurationSec(prefs.holdDurationSec)
        : fallback.holdDurationSec,
  };
}

export function sessionFromVoicePrefs(
  prefs?: WorkoutCardVoicePrefs | null
): CardVoiceSessionSnapshot {
  const fallback = readSettingsVoiceSession();
  if (!prefs) return fallback;
  return {
    voiceEnabled: prefs.voiceEnabled ?? fallback.voiceEnabled,
    voicePack: prefs.voicePack
      ? normalizeVoiceCoachPack(prefs.voicePack)
      : fallback.voicePack,
    countMode: prefs.countMode
      ? clampVoiceCountMode(prefs.countMode)
      : fallback.countMode,
    prepCount:
      prefs.prepCount != null
        ? clampVoiceCoachPrepCount(prefs.prepCount)
        : fallback.prepCount,
    flowMode: prefs.flowMode
      ? clampVoiceHoldFlowMode(prefs.flowMode)
      : fallback.flowMode,
    oneMoreEnabled: prefs.oneMoreEnabled ?? fallback.oneMoreEnabled,
    autoAfterRest: prefs.autoAfterRest ?? fallback.autoAfterRest,
    restTipsEnabled: prefs.restTipsEnabled ?? fallback.restTipsEnabled,
  };
}

/** Resolve prefs for template items: live → card → settings snapshot. */
export function resolveVoicePrefsForTemplate(options: {
  machineCode: string;
  logDate: string;
  targetMuscleGroup?: string | null;
  cardVoicePrefs?: WorkoutCardVoicePrefs | null;
  liveByKey?: Record<string, WorkoutCardVoicePrefs>;
}): WorkoutCardVoicePrefs {
  const key = buildCardVoicePrefsKey(
    options.machineCode,
    options.logDate,
    options.targetMuscleGroup
  );
  const live = options.liveByKey?.[key];
  if (live) return normalizeWorkoutCardVoicePrefs(live);
  if (options.cardVoicePrefs) {
    return normalizeWorkoutCardVoicePrefs(options.cardVoicePrefs);
  }
  return captureWorkoutCardVoicePrefs();
}
