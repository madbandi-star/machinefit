import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  getUtf8ByteLength,
  clampRestDurationSeconds,
  truncateUtf8,
  WORKOUT_DIARY_MAX_BYTES,
  MACHINE_PERSONAL_TIP_MAX_BYTES,
  isFreeWeightMachineCode,
  isBodyweightMachineCode,
  freeWeightLoadSemanticsKey,
  formatWeight,
  isAllGymsId,
  computePerformedTotalWeightKg,
  type TargetMuscleGroup,
  type WorkoutCardVoicePrefs,
  type WorkoutLog,
  type RecommendationSettings,
  type SettingsActiveSource,
} from '@machinefit/shared';
import { workoutCardApi, workoutLogApi, machinePreferenceApi, recommendationApi } from '@/api';
import { draftKey, getWorkoutDraft, putWorkoutDraft } from '@/offline/workoutOfflineDb';
import { enqueueWorkoutLogUpsert } from '@/offline/workoutSyncQueue';
import { VoiceCoachPanel } from '@/components/recommendation/VoiceCoachPanel/VoiceCoachPanel';
import { useVoiceCoachSession } from '@/hooks/useVoiceCoachSession';
import { usePersistHydration } from '@/hooks/usePersistHydration';
import {
  registerRestTimerCallbacks,
  useRestTimerStore,
} from '@/store/restTimer.store';
import {
  clampVoiceCoachOneMoreCount,
  clampVoiceCoachPrepCount,
  clampVoiceCoachRepGapMs,
  clampVoiceCoachTargetReps,
  clampVoiceCountMode,
  normalizeVoiceCoachPack,
  unlockVoiceCoachAudio,
  speakRestTipsAndWarnings,
  stopVoiceCoach,
  type VoiceCoachPack,
  type VoiceCoachPrepCount,
  type VoiceCountMode,
} from '@/utils/voiceCoach';
import {
  clampVoiceHoldDurationSec,
  clampVoiceHoldFlowMode,
  type VoiceHoldFlowMode,
} from '@/utils/voiceHold';
import { Check, CheckCheck, ListRestart, PenLine } from 'lucide-react';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { formatHistoryDateHeader, getTodayDateKey, normalizeDateKey } from '@/utils/historyDate';
import { useSettingsStore } from '@/store/settings.store';
import { useCardVoicePrefsStore } from '@/store/cardVoicePrefs.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { WORKOUT_DIARY_TAGS, formatDiaryTag } from '@/constants/workout-diary-tags';
import { NumericStepper } from '@/components/form/NumericStepper/NumericStepper';
import { WeightStepper } from '@/components/form/WeightStepper/WeightStepper';
import { getWeightStepKg } from '@/utils/weightStep';
import { getWorkoutLogQueryTargetMuscle, removeWorkoutLogFromCache, removeWorkoutLogInListQueryData, upsertWorkoutLogInCache, upsertWorkoutLogInListQueryData } from '@/utils/workoutLogCache';
import { buildWorkoutLogSavedQueryKey } from '@/hooks/useWorkoutLogSaved';
import {
  buildCardVoicePrefsKey,
  captureWorkoutCardVoicePrefs,
  pickersFromVoicePrefs,
  sessionFromVoicePrefs,
  type CardVoiceSessionSnapshot,
  type VoicePickerSnapshot,
} from '@/utils/workoutCardVoicePrefs';
import { resolveApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/recommendation.css';

const DEFAULT_SET_COUNT = 3;
const MIN_SET_COUNT = 1;
const MAX_SET_COUNT = 20;

interface SaveWorkoutLogVariables {
  setCompleted?: boolean[];
  /** Override steppers when saving immediately after a state update (avoids stale closure). */
  setWeightsKg?: number[];
  setCount?: number;
  /** Skip success toast (e.g. autosave on set complete / seed sync). */
  silent?: boolean;
  /** 「계획 저장」 — persist sets/weights without complete UI; custom toast. */
  asPlan?: boolean;
}

export interface WorkoutLogPanelControl {
  isLogSaved: boolean;
  isDirty: boolean;
  isActionPending: boolean;
  isLoading: boolean;
  canSave: boolean;
  totalWeightKg: number;
  setCount: number;
  save: () => void;
  remove: () => void;
}

interface WorkoutLogPanelProps {
  machineCode: string;
  machineName?: string;
  recommendationId?: string;
  suggestedWeightKg?: number;
  /**
   * Live fit-driven reps (추천/조정). When set, voice-coach 목표 횟수 follows this value.
   * Falls back to settings default when omitted.
   */
  volumeReps?: number;
  /** Adjustment mode: voice-coach 목표 횟수 edits push 조정횟수. */
  onVolumeRepsChange?: (reps: number) => void;
  isAuthenticated: boolean;
  variant?: 'default' | 'compact' | 'history';
  logDate?: string;
  idPrefix?: string;
  targetMuscleGroup?: TargetMuscleGroup;
  lockTargetMuscle?: boolean;
  diaryDefaultOpen?: boolean;
  showSaveButton?: boolean;
  showPersonalTipMemo?: boolean;
  /** Spoken during rest (warnings first, then tips). */
  tips?: string[];
  warnings?: string[];
  /** When false, hide VoiceCoachPanel (avoids duplicate panels in history list). */
  showVoiceCoach?: boolean;
  onControlReady?: (control: WorkoutLogPanelControl | null) => void;
  onSavedChange?: (saved: boolean) => void;
  /** e.g. history card 조정값 — runs before workout log upsert on save. */
  onCompanionSave?: () => Promise<void>;
  companionSavePending?: boolean;
  /**
   * Plan/template seed used when no workout_log exists yet
   * (applied template / plan-only card with setCount·weights on workout_cards).
   */
  planSeed?: {
    setCount: number;
    setWeightsKg: number[];
    setCompleted?: boolean[];
    diary?: string;
  };
  /** Linked workout_cards id — used to persist voicePrefs on plan save / picker edits. */
  workoutCardId?: string;
  /**
   * Restored voice pickers + session snapshot (template / plan card).
   * Applied as card-scoped overrides — does not write global settings.
   */
  voicePrefsSeed?: WorkoutCardVoicePrefs;
}

function buildDefaultWeights(count: number, fallback?: number): number[] {
  const base = fallback && fallback > 0 ? fallback : 0;
  return Array.from({ length: count }, () => base);
}

function resizeWeights(current: number[], nextCount: number, fallback?: number): number[] {
  if (nextCount <= current.length) {
    return current.slice(0, nextCount);
  }

  const last = current[current.length - 1] ?? fallback ?? 0;
  return [
    ...current,
    ...Array.from({ length: nextCount - current.length }, () => last),
  ];
}

function buildDefaultCompleted(count: number): boolean[] {
  return Array.from({ length: count }, () => false);
}

/** Whether to start rest after marking a set complete (honors "after all sets" setting). */
function shouldShowRestAfterSetComplete(
  nextCompleted: boolean[],
  showAfterAllSetsComplete: boolean
): boolean {
  if (!showAfterAllSetsComplete && nextCompleted.length > 0 && nextCompleted.every(Boolean)) {
    return false;
  }
  return true;
}

function resizeCompleted(current: boolean[], nextCount: number): boolean[] {
  if (nextCount <= current.length) {
    return current.slice(0, nextCount);
  }
  return [...current, ...Array.from({ length: nextCount - current.length }, () => false)];
}

function booleansEqual(a: boolean[], b: boolean[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

function weightsEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

interface WorkoutFormSnapshot {
  setCount: number;
  weights: number[];
  setCompleted: boolean[];
  diary: string;
}

function cloneWorkoutFormSnapshot(source: WorkoutFormSnapshot): WorkoutFormSnapshot {
  return {
    setCount: source.setCount,
    weights: [...source.weights],
    setCompleted: [...source.setCompleted],
    diary: source.diary,
  };
}

function buildSnapshotFromLog(log: {
  setCount: number;
  setWeightsKg: number[];
  setCompleted?: boolean[];
  diary?: string;
}): WorkoutFormSnapshot {
  return {
    setCount: log.setCount,
    weights: [...log.setWeightsKg],
    setCompleted: [...(log.setCompleted ?? buildDefaultCompleted(log.setCount))],
    diary: log.diary ?? '',
  };
}

function buildDefaultSnapshot(suggestedWeightKg?: number): WorkoutFormSnapshot {
  return {
    setCount: DEFAULT_SET_COUNT,
    weights: buildDefaultWeights(DEFAULT_SET_COUNT, suggestedWeightKg),
    setCompleted: buildDefaultCompleted(DEFAULT_SET_COUNT),
    diary: '',
  };
}

function buildSnapshotFromPlanSeed(planSeed: {
  setCount: number;
  setWeightsKg: number[];
  setCompleted?: boolean[];
  diary?: string;
}): WorkoutFormSnapshot {
  const setCount = Math.max(MIN_SET_COUNT, Math.min(MAX_SET_COUNT, planSeed.setCount || DEFAULT_SET_COUNT));
  const weights = resizeWeights(
    Array.isArray(planSeed.setWeightsKg) ? planSeed.setWeightsKg : [],
    setCount,
    planSeed.setWeightsKg?.[0]
  );
  return {
    setCount,
    weights,
    setCompleted: resizeCompleted(planSeed.setCompleted ?? [], setCount),
    diary: planSeed.diary ?? '',
  };
}

/** Incomplete + unplanned sets follow live fit seed; completed/planned keep kg. */
function applySeedToIncompleteWeights(
  weights: number[],
  completed: boolean[],
  seedKg: number,
  planProtected?: boolean[]
): number[] {
  return weights.map((weight, index) =>
    completed[index] === true || planProtected?.[index] === true ? weight : seedKg
  );
}

function isSetPlanSaved(
  index: number,
  weight: number,
  savedWeights: number[] | undefined,
  savedSetCount: number | undefined
): boolean {
  if (savedWeights == null || savedSetCount == null) return false;
  if (index >= savedSetCount || index >= savedWeights.length) return false;
  return savedWeights[index] === weight;
}

function applyWorkoutFormSnapshot(
  snapshot: WorkoutFormSnapshot,
  setters: {
    setSetCount: (value: number) => void;
    setWeights: (value: number[]) => void;
    setSetCompleted: (value: boolean[]) => void;
    setDiary: (value: string) => void;
  }
) {
  setters.setSetCount(snapshot.setCount);
  setters.setWeights([...snapshot.weights]);
  setters.setSetCompleted([...snapshot.setCompleted]);
  setters.setDiary(snapshot.diary);
}

export function WorkoutLogPanel({
  machineCode,
  machineName: _machineName,
  recommendationId,
  suggestedWeightKg,
  volumeReps,
  onVolumeRepsChange,
  isAuthenticated,
  variant = 'default',
  logDate: logDateProp,
  idPrefix = 'workout',
  targetMuscleGroup,
  lockTargetMuscle = false,
  diaryDefaultOpen = false,
  showSaveButton = false,
  showPersonalTipMemo,
  tips: tipsProp,
  warnings: warningsProp,
  showVoiceCoach = true,
  onControlReady,
  onSavedChange,
  onCompanionSave,
  companionSavePending = false,
  planSeed,
  workoutCardId,
  voicePrefsSeed,
}: WorkoutLogPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const locale = useSettingsStore((s) => s.locale);
  const unitWeight = useSettingsStore((s) => s.unitWeight);
  const voiceCoachEnabled = useSettingsStore((s) => s.voiceCoachEnabled);
  const voiceCoachTargetReps = useSettingsStore((s) => s.voiceCoachTargetReps);
  const voiceCoachOneMore = useSettingsStore((s) => s.voiceCoachOneMore);
  const voiceCoachOneMoreCount = useSettingsStore((s) => s.voiceCoachOneMoreCount);
  const voiceCoachAutoAfterRest = useSettingsStore((s) => s.voiceCoachAutoAfterRest);
  const voiceRestTipsEnabled = useSettingsStore((s) => s.voiceRestTipsEnabled);
  const voiceCoachRepGapMs = useSettingsStore((s) => s.voiceCoachRepGapMs);
  const voiceCoachPrepCount = useSettingsStore((s) => s.voiceCoachPrepCount);
  const voiceCoachPack = useSettingsStore((s) => s.voiceCoachPack);
  const voiceCountMode = useSettingsStore((s) => s.voiceCountMode);
  const voiceCoachFlowMode = useSettingsStore((s) => s.voiceCoachFlowMode);
  const voiceHoldDurationSec = useSettingsStore((s) => s.voiceHoldDurationSec);
  const restDurationSeconds = useSettingsStore((s) => s.restDurationSeconds);
  const restTimerAfterAllSetsComplete = useSettingsStore(
    (s) => s.restTimerAfterAllSetsComplete
  );
  const setVoiceCoachEnabled = useSettingsStore((s) => s.setVoiceCoachEnabled);
  const setVoiceCoachOneMore = useSettingsStore((s) => s.setVoiceCoachOneMore);
  const setVoiceCoachAutoAfterRest = useSettingsStore((s) => s.setVoiceCoachAutoAfterRest);
  const setVoiceRestTipsEnabled = useSettingsStore((s) => s.setVoiceRestTipsEnabled);
  const setVoiceCoachPrepCount = useSettingsStore((s) => s.setVoiceCoachPrepCount);
  const setVoiceCoachPack = useSettingsStore((s) => s.setVoiceCoachPack);
  const setVoiceCountMode = useSettingsStore((s) => s.setVoiceCountMode);
  const setVoiceCoachFlowMode = useSettingsStore((s) => s.setVoiceCoachFlowMode);
  const location = useLocation();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const setLiveCardVoicePrefs = useCardVoicePrefsStore((s) => s.setPrefs);
  const { activeGymId } = useActiveGym();
  const { activeMemberId } = useActiveMember();
  const isAllGyms = isAllGymsId(activeGymId);
  const isHistory = variant === 'history';
  const compact = variant === 'compact' || isHistory;
  const showPersonalTip = showPersonalTipMemo ?? isHistory;
  const logDate = normalizeDateKey(logDateProp ?? getTodayDateKey());
  const isTodayLog = logDate === getTodayDateKey();
  const cardVoicePrefsKey = buildCardVoicePrefsKey(
    machineCode,
    logDate,
    targetMuscleGroup
  );

  // Voice-count pickers seed gap/one-more/hold from Settings (or template voicePrefsSeed).
  const voicePrefsSeedKey = voicePrefsSeed ? JSON.stringify(voicePrefsSeed) : '';
  const voiceTargetSeedContext = `${machineCode}|${logDate}|${recommendationId ?? ''}|${voicePrefsSeedKey}`;
  const settingsHydrated = usePersistHydration(useSettingsStore.persist);
  const [voicePickers, setVoicePickers] = useState<VoicePickerSnapshot | null>(null);
  const [voicePickersPinned, setVoicePickersPinned] = useState(true);
  const [cardVoiceSession, setCardVoiceSession] = useState<CardVoiceSessionSnapshot | null>(
    null
  );

  const lastPatchedVoicePrefsRef = useRef<string>('');

  useEffect(() => {
    if (!settingsHydrated) return;
    setVoicePickersPinned(true);
    const nextPickers = pickersFromVoicePrefs(voicePrefsSeed, volumeReps);
    setVoicePickers(nextPickers);
    // History (and any seeded card) keeps session fields card-scoped so template
    // restore does not mutate / depend on live global settings defaults.
    if (isHistory || voicePrefsSeed) {
      const nextSession = sessionFromVoicePrefs(voicePrefsSeed);
      setCardVoiceSession(nextSession);
      lastPatchedVoicePrefsRef.current = JSON.stringify(
        captureWorkoutCardVoicePrefs({
          pickers: nextPickers,
          session: nextSession,
        })
      );
    } else {
      setCardVoiceSession(null);
      lastPatchedVoicePrefsRef.current = '';
    }
    // volumeReps: seed-time only (same as prior readVoicePickerSnapshot behavior).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remount/context via voiceTargetSeedContext
  }, [voiceTargetSeedContext, settingsHydrated, isHistory, voicePrefsSeed]);

  // 조정횟수 → 목표횟수 sync (세부 피커 고정과 무관 — 고정 OFF일 때와 동일).
  useEffect(() => {
    if (volumeReps == null || volumeReps <= 0) return;
    // Template/card seed already set targetReps — don't clobber with fit seed.
    if (voicePrefsSeed?.targetReps != null) return;
    const next = clampVoiceCoachTargetReps(volumeReps);
    setVoicePickers((prev) => {
      if (!prev || prev.targetReps === next) return prev;
      return { ...prev, targetReps: next };
    });
  }, [volumeReps, voicePrefsSeed?.targetReps]);

  const handleVoiceTargetRepsChange = useCallback(
    (reps: number) => {
      // 목표횟수는 「세부 피커 고정」이어도 수정 가능 (간격/하나더/버텨는 고정 유지).
      const next = clampVoiceCoachTargetReps(reps);
      setVoicePickers((prev) => (prev ? { ...prev, targetReps: next } : prev));
      onVolumeRepsChange?.(next);
    },
    [onVolumeRepsChange]
  );

  const handleVoiceRepGapMsChange = useCallback(
    (ms: number) => {
      if (voicePickersPinned) return;
      const next = clampVoiceCoachRepGapMs(ms);
      setVoicePickers((prev) => (prev ? { ...prev, repGapMs: next } : prev));
    },
    [voicePickersPinned]
  );

  const handleVoiceOneMoreCountChange = useCallback(
    (count: number) => {
      if (voicePickersPinned) return;
      const next = clampVoiceCoachOneMoreCount(count);
      setVoicePickers((prev) => (prev ? { ...prev, oneMoreCount: next } : prev));
    },
    [voicePickersPinned]
  );

  const handleVoiceHoldDurationChange = useCallback(
    (sec: number) => {
      if (voicePickersPinned) return;
      const next = clampVoiceHoldDurationSec(sec);
      setVoicePickers((prev) => (prev ? { ...prev, holdDurationSec: next } : prev));
    },
    [voicePickersPinned]
  );

  const patchCardVoiceSession = useCallback(
    (patch: Partial<CardVoiceSessionSnapshot>) => {
      setCardVoiceSession((prev) => {
        const base = prev ?? sessionFromVoicePrefs(voicePrefsSeed);
        return { ...base, ...patch };
      });
    },
    [voicePrefsSeed]
  );

  const handleCardVoiceEnabledChange = useCallback(
    (enabled: boolean) => {
      if (isHistory || voicePrefsSeed) {
        patchCardVoiceSession({ voiceEnabled: enabled });
        return;
      }
      setVoiceCoachEnabled(enabled);
    },
    [isHistory, patchCardVoiceSession, setVoiceCoachEnabled, voicePrefsSeed]
  );

  const handleCardOneMoreEnabledChange = useCallback(
    (enabled: boolean) => {
      if (isHistory || voicePrefsSeed) {
        patchCardVoiceSession({ oneMoreEnabled: enabled });
        return;
      }
      setVoiceCoachOneMore(enabled);
    },
    [isHistory, patchCardVoiceSession, setVoiceCoachOneMore, voicePrefsSeed]
  );

  const handleCardAutoAfterRestChange = useCallback(
    (enabled: boolean) => {
      if (isHistory || voicePrefsSeed) {
        patchCardVoiceSession({ autoAfterRest: enabled });
        return;
      }
      setVoiceCoachAutoAfterRest(enabled);
    },
    [isHistory, patchCardVoiceSession, setVoiceCoachAutoAfterRest, voicePrefsSeed]
  );

  const handleCardRestTipsEnabledChange = useCallback(
    (enabled: boolean) => {
      if (isHistory || voicePrefsSeed) {
        patchCardVoiceSession({ restTipsEnabled: enabled });
        return;
      }
      setVoiceRestTipsEnabled(enabled);
    },
    [isHistory, patchCardVoiceSession, setVoiceRestTipsEnabled, voicePrefsSeed]
  );

  const handleCardPrepCountChange = useCallback(
    (count: VoiceCoachPrepCount) => {
      if (isHistory || voicePrefsSeed) {
        patchCardVoiceSession({ prepCount: clampVoiceCoachPrepCount(count) });
        return;
      }
      setVoiceCoachPrepCount(count);
    },
    [isHistory, patchCardVoiceSession, setVoiceCoachPrepCount, voicePrefsSeed]
  );

  const handleCardVoicePackChange = useCallback(
    (pack: VoiceCoachPack) => {
      if (isHistory || voicePrefsSeed) {
        patchCardVoiceSession({ voicePack: normalizeVoiceCoachPack(pack) });
        return;
      }
      setVoiceCoachPack(pack);
    },
    [isHistory, patchCardVoiceSession, setVoiceCoachPack, voicePrefsSeed]
  );

  const handleCardCountModeChange = useCallback(
    (mode: VoiceCountMode) => {
      if (isHistory || voicePrefsSeed) {
        patchCardVoiceSession({ countMode: clampVoiceCountMode(mode) });
        return;
      }
      setVoiceCountMode(mode);
    },
    [isHistory, patchCardVoiceSession, setVoiceCountMode, voicePrefsSeed]
  );

  const handleCardFlowModeChange = useCallback(
    (mode: VoiceHoldFlowMode) => {
      if (isHistory || voicePrefsSeed) {
        patchCardVoiceSession({ flowMode: clampVoiceHoldFlowMode(mode) });
        return;
      }
      setVoiceCoachFlowMode(mode);
    },
    [isHistory, patchCardVoiceSession, setVoiceCoachFlowMode, voicePrefsSeed]
  );

  const effectiveVoiceSession = cardVoiceSession;
  const voiceSessionTargetReps = voicePickers?.targetReps ?? voiceCoachTargetReps;
  const voiceSessionRepGapMs = voicePickers?.repGapMs ?? voiceCoachRepGapMs;
  const voiceSessionOneMoreCount = voicePickers?.oneMoreCount ?? voiceCoachOneMoreCount;
  const voiceSessionHoldDurationSec = voicePickers?.holdDurationSec ?? voiceHoldDurationSec;
  const sessionVoiceEnabled = effectiveVoiceSession?.voiceEnabled ?? voiceCoachEnabled;
  const sessionOneMoreEnabled = effectiveVoiceSession?.oneMoreEnabled ?? voiceCoachOneMore;
  const sessionAutoAfterRest =
    effectiveVoiceSession?.autoAfterRest ?? voiceCoachAutoAfterRest;
  const sessionRestTipsEnabled =
    effectiveVoiceSession?.restTipsEnabled ?? voiceRestTipsEnabled;
  const sessionPrepCount = (effectiveVoiceSession?.prepCount ??
    voiceCoachPrepCount) as VoiceCoachPrepCount;
  const sessionVoicePack = (effectiveVoiceSession?.voicePack ??
    voiceCoachPack) as VoiceCoachPack;
  const sessionCountMode = (effectiveVoiceSession?.countMode ??
    voiceCountMode) as VoiceCountMode;
  const sessionFlowMode = (effectiveVoiceSession?.flowMode ??
    voiceCoachFlowMode) as VoiceHoldFlowMode;

  const captureCurrentVoicePrefs = useCallback((): WorkoutCardVoicePrefs | null => {
    if (!voicePickers) return null;
    return captureWorkoutCardVoicePrefs({
      pickers: voicePickers,
      session: effectiveVoiceSession,
    });
  }, [effectiveVoiceSession, voicePickers]);

  // Keep ephemeral map warm for template save (even before plan save / PATCH).
  useEffect(() => {
    const prefs = captureCurrentVoicePrefs();
    if (!prefs) return;
    setLiveCardVoicePrefs(cardVoicePrefsKey, prefs);
  }, [captureCurrentVoicePrefs, cardVoicePrefsKey, setLiveCardVoicePrefs]);

  // Persist onto workout_cards so reload / template fromDate restore works.
  useEffect(() => {
    if (!workoutCardId || !settingsHydrated) return;
    const prefs = captureCurrentVoicePrefs();
    if (!prefs) return;
    const serialized = JSON.stringify(prefs);
    if (serialized === lastPatchedVoicePrefsRef.current) return;
    const timer = window.setTimeout(() => {
      lastPatchedVoicePrefsRef.current = serialized;
      void workoutCardApi.update(workoutCardId, { voicePrefs: prefs }).catch(() => {
        lastPatchedVoicePrefsRef.current = '';
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [captureCurrentVoicePrefs, settingsHydrated, workoutCardId]);

  const voiceCoach = useVoiceCoachSession({
    targetReps: voiceSessionTargetReps,
    oneMoreEnabled: sessionOneMoreEnabled,
    oneMoreCount: voiceSessionOneMoreCount,
    repGapMs: voiceSessionRepGapMs,
    prepCount: sessionPrepCount,
    voicePack: sessionVoicePack,
    countMode: sessionCountMode,
    flowMode: sessionFlowMode,
    holdDurationSec: voiceSessionHoldDurationSec,
    locale,
    enabled: sessionVoiceEnabled,
  });
  const voiceCoachStartRef = useRef(voiceCoach.start);
  voiceCoachStartRef.current = voiceCoach.start;
  const voiceCoachRunningRef = useRef(voiceCoach.isRunning);
  voiceCoachRunningRef.current = voiceCoach.isRunning;
  /** Set synchronously on manual Start so rest-end auto-start cannot kill it. */
  const manualCountStartRef = useRef(false);
  const restSpeechAbortRef = useRef<AbortController | null>(null);

  const handleRestReadyForNextSet = useCallback(() => {
    restSpeechAbortRef.current?.abort();
    restSpeechAbortRef.current = null;
    useRestTimerStore.getState().stop();
    // Manual Start during rest (or an already-running count) wins — do not restart/kill.
    if (manualCountStartRef.current || voiceCoachRunningRef.current) return;
    // Soft-stop only — set-complete already unlocked audio in a user gesture;
    // ending the session here would mute auto-start (no fresh tap).
    stopVoiceCoach({ keepAudioSession: true });
    if (!sessionVoiceEnabled || !sessionAutoAfterRest) return;
    voiceCoachStartRef.current();
  }, [sessionAutoAfterRest, sessionVoiceEnabled]);
  const startVoiceCoach = useCallback(() => {
    // Count Start must work anytime: before set-complete, mid-rest, during rest tips.
    // Do NOT unlock here then call start() — start() soft-stops (cancel) first, which
    // killed the gesture TTS/audio unlock and made the first tap silent. Unlock runs
    // inside useVoiceCoachSession.start() after that soft-stop.
    manualCountStartRef.current = true;
    voiceCoachRunningRef.current = true;
    restSpeechAbortRef.current?.abort();
    restSpeechAbortRef.current = null;
    // Clear rest UI without going through Skip→onReady (that raced and killed count).
    useRestTimerStore.getState().stop();
    void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
      trackFeature('voice_count')
    );
    void import('@/utils/usageTelemetry').then(({ trackUsage }) => trackUsage('voice_count'));
    voiceCoachStartRef.current();
  }, []);
  const voiceCoachStopRef = useRef(voiceCoach.stop);
  voiceCoachStopRef.current = voiceCoach.stop;
  const stopVoiceCoachSession = useCallback(() => {
    const wasRunning = voiceCoachRunningRef.current;
    manualCountStartRef.current = false;
    voiceCoachStopRef.current();
    if (wasRunning) {
      void import('@/utils/usageTelemetry').then(({ trackUsage }) =>
        trackUsage('voice_count_complete')
      );
    }
  }, []);

  useEffect(() => {
    // Allow rest auto-start again after a manual/auto count session ends.
    if (!voiceCoach.isRunning) {
      manualCountStartRef.current = false;
    }
  }, [voiceCoach.isRunning]);
  const setCountInputId = `${idPrefix}-set-count`;
  const weightStepKg = getWeightStepKg(machineCode);
  const isFreeWeight = isFreeWeightMachineCode(machineCode);
  const isBodyweight = isBodyweightMachineCode(machineCode);
  const [selectedMuscle, setSelectedMuscle] = useState<TargetMuscleGroup | null>(
    targetMuscleGroup ?? null
  );
  const activeTargetMuscle = selectedMuscle ?? targetMuscleGroup ?? null;
  const queryTargetMuscle = getWorkoutLogQueryTargetMuscle(machineCode, activeTargetMuscle);
  const { queryKey: workoutLogQueryKey } = buildWorkoutLogSavedQueryKey(
    activeGymId ?? '',
    activeMemberId ?? '',
    machineCode,
    logDate,
    queryTargetMuscle
  );

  const [setCount, setSetCount] = useState(DEFAULT_SET_COUNT);
  const [weights, setWeights] = useState<number[]>(() =>
    buildDefaultWeights(DEFAULT_SET_COUNT, suggestedWeightKg)
  );
  const [setCompleted, setSetCompleted] = useState<boolean[]>(() =>
    buildDefaultCompleted(DEFAULT_SET_COUNT)
  );
  /** Sets locked against live fit-seed overwrite after 「계획 저장」 / existing log. */
  const [planProtected, setPlanProtected] = useState<boolean[]>(() =>
    buildDefaultCompleted(DEFAULT_SET_COUNT)
  );
  const [diary, setDiary] = useState('');
  const [personalTipMemo, setPersonalTipMemo] = useState('');
  const [diaryExpanded, setDiaryExpanded] = useState(diaryDefaultOpen);
  const [baseline, setBaseline] = useState<WorkoutFormSnapshot | null>(null);
  const lastHydrateKeyRef = useRef('');
  const lastAppliedSeedKeyRef = useRef('');
  const setCompletedRef = useRef(setCompleted);
  setCompletedRef.current = setCompleted;
  const planProtectedRef = useRef(planProtected);
  planProtectedRef.current = planProtected;
  const weightsRef = useRef(weights);
  weightsRef.current = weights;
  const setCountRef = useRef(setCount);
  setCountRef.current = setCount;
  const restSession = useRestTimerStore((s) => s.session);
  const startRestTimer = useRestTimerStore((s) => s.start);
  const stopRestTimer = useRestTimerStore((s) => s.stop);
  const diaryBytes = getUtf8ByteLength(diary);
  const canLog = isAuthenticated && Boolean(activeGymId) && !isAllGyms && Boolean(activeMemberId);
  const queryEnabled = canLog && (!isFreeWeight || !!queryTargetMuscle);

  const needsFetchedCoaching =
    sessionVoiceEnabled &&
    sessionRestTipsEnabled &&
    Boolean(recommendationId) &&
    tipsProp == null &&
    warningsProp == null;

  const { data: fetchedCoaching } = useQuery({
    queryKey: ['recommendation-coaching', recommendationId, locale],
    queryFn: async () => {
      const res = await recommendationApi.getById(recommendationId!);
      return {
        tips: res.data.data.tips ?? [],
        warnings: res.data.data.warnings ?? [],
      };
    },
    enabled: needsFetchedCoaching,
    staleTime: 60_000,
  });

  const coachingTips = tipsProp ?? fetchedCoaching?.tips ?? [];
  const coachingWarnings = warningsProp ?? fetchedCoaching?.warnings ?? [];
  const coachingTipsRef = useRef(coachingTips);
  coachingTipsRef.current = coachingTips;
  const coachingWarningsRef = useRef(coachingWarnings);
  coachingWarningsRef.current = coachingWarnings;
  const hasRestCoaching =
    coachingTips.length > 0 || coachingWarnings.length > 0;
  /** Fingerprint so late-fetched history tips still start speech during an active rest. */
  const restCoachingFingerprint = hasRestCoaching
    ? `${coachingWarnings.join('\u0001')}\u0002${coachingTips.join('\u0001')}`
    : '';

  useEffect(() => {
    registerRestTimerCallbacks({
      onReadyForNextSet: handleRestReadyForNextSet,
      onStartCount: sessionVoiceEnabled ? startVoiceCoach : null,
    });
    return () => {
      registerRestTimerCallbacks({
        onReadyForNextSet: null,
        onStartCount: null,
      });
    };
  }, [handleRestReadyForNextSet, startVoiceCoach, sessionVoiceEnabled]);

  useEffect(() => {
    if (!restSession) return;
    if (!sessionVoiceEnabled) return;
    // Never restart rest speech over an active set-count session.
    if (voiceCoachRunningRef.current) return;

    const includeTips = sessionRestTipsEnabled && hasRestCoaching;
    const controller = new AbortController();
    restSpeechAbortRef.current = controller;
    void speakRestTipsAndWarnings({
      warnings: includeTips ? coachingWarningsRef.current : [],
      tips: includeTips ? coachingTipsRef.current : [],
      voicePack: sessionVoicePack,
      locale,
      signal: controller.signal,
      // Always announce rest in pack language (휴식 시작 / Rest).
      announceRestStart: true,
    });

    return () => {
      controller.abort();
      if (restSpeechAbortRef.current === controller) {
        restSpeechAbortRef.current = null;
      }
      // Abort rest tips only — do not stopVoiceCoach() here.
      // Clearing restTimer / late tip fetch would otherwise cancel auto-started set counting.
    };
  }, [
    restSession?.sessionId,
    restSession?.setNumber,
    sessionVoiceEnabled,
    sessionRestTipsEnabled,
    hasRestCoaching,
    restCoachingFingerprint,
    locale,
    sessionVoicePack,
  ]);


  const { data: machinePreferences, isFetched: isPreferencesFetched } = useQuery({
    queryKey: QUERY_KEYS.machinePreferences(machineCode, activeGymId, activeMemberId),
    queryFn: () =>
      machinePreferenceApi.get(machineCode, {
        gymId: activeGymId!,
        memberId: activeMemberId!,
      }),
    enabled: isAuthenticated && showPersonalTip && Boolean(activeGymId) && Boolean(activeMemberId),
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: existingLogs, isLoading, isFetched } = useQuery({
    queryKey: workoutLogQueryKey,
    queryFn: async () => {
      const res = await workoutLogApi.list({
        gymId: activeGymId!,
        memberId: activeMemberId ?? undefined,
        machineCode,
        logDate,
        ...(queryTargetMuscle ? { targetMuscleGroup: queryTargetMuscle } : {}),
      });
      return res.data.data;
    },
    enabled: queryEnabled,
    staleTime: Infinity,
    // Allow remount refetch after invalidate (e.g. easy-mode save → Records).
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const existingLog = existingLogs?.[0];
  const isLogSaved = Boolean(existingLog);
  const effectiveVolumeReps =
    volumeReps != null && volumeReps > 0 ? volumeReps : voiceCoachTargetReps;
  const totalWeightKg = useMemo(
    () =>
      computePerformedTotalWeightKg({
        setWeightsKg: weights,
        setCompleted,
        sets: setCount,
        machineCode,
        // Prefer live 조정/추천 횟수 from parent; never stick on stale voice-coach default.
        recommendedReps: effectiveVolumeReps,
      }),
    [weights, setCompleted, setCount, effectiveVolumeReps, machineCode]
  );
  const loadSemanticsKey = freeWeightLoadSemanticsKey(machineCode);
  const hasPlanSeed =
    Boolean(planSeed) &&
    Math.max(1, planSeed?.setCount ?? 0) >= MIN_SET_COUNT &&
    Array.isArray(planSeed?.setWeightsKg);
  const planSeedKey = hasPlanSeed
    ? `${planSeed!.setCount}|${planSeed!.setWeightsKg.join(',')}|${planSeed!.diary ?? ''}`
    : '';
  const hydrateKey = `${machineCode}|${logDate}|${activeTargetMuscle ?? ''}|${existingLog?.id ?? 'new'}|${existingLog?.updatedAt ?? ''}|${planSeedKey}`;

  const isPersonalTipDirty =
    showPersonalTip &&
    isPreferencesFetched &&
    personalTipMemo.trim() !== (machinePreferences?.personalTipMemo ?? '').trim();

  const isDirty =
    (isLogSaved &&
      baseline !== null &&
      (setCount !== baseline.setCount ||
        !weightsEqual(weights, baseline.weights) ||
        !booleansEqual(setCompleted, baseline.setCompleted) ||
        diary.trim() !== baseline.diary.trim())) ||
    isPersonalTipDirty;

  /** Heavy refetches — only after explicit save/remove, never on silent set-complete. */
  const invalidateLogSideEffects = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
    void queryClient.invalidateQueries({ queryKey: ['workout-logs', 'insights'] });
    void queryClient.invalidateQueries({ queryKey: ['user', 'achievements'] });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pointsBalance });
  }, [queryClient]);

  /** Achievements/insights only — cache already patched for logs. */
  const invalidateSoftSideEffects = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['workout-logs', 'insights'] });
    void queryClient.invalidateQueries({ queryKey: ['user', 'achievements'] });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pointsBalance });
  }, [queryClient]);

  const sideEffectDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSoftSideEffects = useCallback(() => {
    if (sideEffectDebounceRef.current) clearTimeout(sideEffectDebounceRef.current);
    sideEffectDebounceRef.current = setTimeout(() => {
      sideEffectDebounceRef.current = null;
      invalidateSoftSideEffects();
    }, 30_000);
  }, [invalidateSoftSideEffects]);

  useEffect(
    () => () => {
      if (sideEffectDebounceRef.current) clearTimeout(sideEffectDebounceRef.current);
    },
    []
  );

  const pendingSilentSaveRef = useRef<SaveWorkoutLogVariables | null>(null);

  const workoutLogsAllKey = QUERY_KEYS.workoutLogsAll(
    activeGymId ?? '',
    activeMemberId ?? ''
  );
  const removeLogParams = {
    machineCode,
    logDate,
    targetMuscleGroup: queryTargetMuscle,
  };

  useEffect(() => {
    lastHydrateKeyRef.current = '';
    lastAppliedSeedKeyRef.current = '';
    setBaseline(null);
    setSelectedMuscle(targetMuscleGroup ?? null);
    setPersonalTipMemo('');
  }, [machineCode, logDate, recommendationId, targetMuscleGroup]);

  useEffect(() => {
    if (!showPersonalTip || !isPreferencesFetched) return;
    setPersonalTipMemo(machinePreferences?.personalTipMemo ?? '');
  }, [showPersonalTip, isPreferencesFetched, machinePreferences?.personalTipMemo, machineCode]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (queryEnabled && !isFetched) return;
    if (lastHydrateKeyRef.current === hydrateKey) return;

    lastHydrateKeyRef.current = hydrateKey;
    let snapshot = existingLog
      ? buildSnapshotFromLog(existingLog)
      : hasPlanSeed && planSeed
        ? buildSnapshotFromPlanSeed(planSeed)
        : buildDefaultSnapshot(suggestedWeightKg);

    // New logs only: seed incomplete steppers from fit/recommend weight.
    // Existing logs / plan seeds must keep setWeightsKg — reseeding incomplete sets
    // after bookmark/memo save wiped user-entered kg (set 「완료」 looked fine
    // because completed sets are seed-protected).
    const seedKey =
      suggestedWeightKg != null && suggestedWeightKg > 0
        ? `${hydrateKey}|${suggestedWeightKg}`
        : `${hydrateKey}|none`;
    if (
      !existingLog &&
      !hasPlanSeed &&
      suggestedWeightKg != null &&
      suggestedWeightKg > 0
    ) {
      snapshot = {
        ...snapshot,
        weights: applySeedToIncompleteWeights(
          snapshot.weights,
          snapshot.setCompleted,
          suggestedWeightKg
        ),
      };
    }

    applyWorkoutFormSnapshot(snapshot, {
      setSetCount,
      setWeights,
      setSetCompleted,
      setDiary,
    });
    // Existing logs / plan seeds treat kg as plan-protected so live
    // fit-seed cannot wipe them — same protection as set 「완료」, without UI.
    const protectedFlags =
      existingLog || hasPlanSeed
        ? snapshot.weights.map(() => true)
        : buildDefaultCompleted(snapshot.setCount);
    setPlanProtected(protectedFlags);
    // Keep refs in sync for the seed effect in this same commit.
    setCountRef.current = snapshot.setCount;
    weightsRef.current = snapshot.weights;
    setCompletedRef.current = snapshot.setCompleted;
    planProtectedRef.current = protectedFlags;
    setBaseline(cloneWorkoutFormSnapshot(snapshot));
    lastAppliedSeedKeyRef.current = seedKey;

    if (activeGymId && activeMemberId) {
      const key = draftKey({
        gymId: activeGymId,
        memberId: activeMemberId,
        machineCode,
        logDate,
        targetMuscleGroup: queryTargetMuscle,
      });
      void getWorkoutDraft(key).then((draft) => {
        if (!draft) return;
        const serverUpdated = existingLog?.updatedAt
          ? Date.parse(existingLog.updatedAt)
          : 0;
        if (draft.updatedAt <= serverUpdated) return;
        if (lastHydrateKeyRef.current !== hydrateKey) return;
        const restored = {
          setCount: draft.setCount,
          weights: draft.setWeightsKg,
          setCompleted: draft.setCompleted,
          diary: draft.diary ?? '',
        };
        applyWorkoutFormSnapshot(restored, {
          setSetCount,
          setWeights,
          setSetCompleted,
          setDiary,
        });
        setCountRef.current = restored.setCount;
        weightsRef.current = restored.weights;
        setCompletedRef.current = restored.setCompleted;
        setBaseline(cloneWorkoutFormSnapshot(restored));
      });
    }
  }, [
    isAuthenticated,
    queryEnabled,
    isFetched,
    hydrateKey,
    existingLog,
    suggestedWeightKg,
    hasPlanSeed,
    planSeed,
    activeGymId,
    activeMemberId,
    machineCode,
    logDate,
    queryTargetMuscle,
  ]);

  // Incomplete + unplanned sets follow live fit-feedback seed weight when the
  // user changes fit rating / adjusted weight after hydrate.
  // Completed and plan-saved sets keep their logged weight.
  // Patch history caches for 「총 중량」 display only — do NOT autosave the workout
  // log (that made the 기록 bookmark look pressed when tapping 조정중량 +/-).
  useEffect(() => {
    if (!isAuthenticated) return;
    if (queryEnabled && !isFetched) return;
    if (lastHydrateKeyRef.current !== hydrateKey) return;
    if (suggestedWeightKg == null || !(suggestedWeightKg > 0)) return;

    const seedKey = `${hydrateKey}|${suggestedWeightKg}`;
    if (lastAppliedSeedKeyRef.current === seedKey) return;
    lastAppliedSeedKeyRef.current = seedKey;

    // Prefer completed flags from the saved log when present so a stale ref
    // cannot rewrite performed set weights after fit feedback changes.
    const completedFromLog = existingLog?.setCompleted;
    const completed = weightsRef.current.map(
      (_, index) =>
        setCompletedRef.current[index] === true || completedFromLog?.[index] === true
    );
    const protectedFlags = planProtectedRef.current;
    const prevWeights = weightsRef.current;
    const nextWeights = applySeedToIncompleteWeights(
      prevWeights,
      completed,
      suggestedWeightKg,
      protectedFlags
    );
    if (weightsEqual(prevWeights, nextWeights)) return;

    setWeights(nextWeights);
    weightsRef.current = nextWeights;

    setBaseline((prev) => {
      if (!prev) return prev;
      const nextBaselineWeights = applySeedToIncompleteWeights(
        prev.weights,
        completed,
        suggestedWeightKg,
        protectedFlags
      );
      if (weightsEqual(prev.weights, nextBaselineWeights)) return prev;
      return { ...prev, weights: nextBaselineWeights };
    });

    const baseLog =
      queryClient.getQueryData<WorkoutLog[]>(workoutLogQueryKey)?.[0] ?? existingLog;
    if (!baseLog) return;

    // Never replace completed / plan-protected performed kg in the history cache.
    const baseCompleted = baseLog.setCompleted ?? [];
    const baseWeights = baseLog.setWeightsKg ?? [];
    const patchedWeights = nextWeights.map((weight, index) =>
      baseCompleted[index] === true || protectedFlags[index] === true
        ? (baseWeights[index] ?? weight)
        : weight
    );

    const patchedLog: WorkoutLog = {
      ...baseLog,
      setWeightsKg: [...patchedWeights],
      setCompleted: baseCompleted.length > 0 ? [...baseCompleted] : [...completed],
      setCount: setCountRef.current,
    };
    queryClient.setQueryData(workoutLogQueryKey, [patchedLog]);
    queryClient.setQueriesData<WorkoutLog[]>(
      { queryKey: QUERY_KEYS.workoutLogs },
      (old) => upsertWorkoutLogInListQueryData(old, patchedLog, removeLogParams)
    );
  }, [
    isAuthenticated,
    queryEnabled,
    isFetched,
    hydrateKey,
    suggestedWeightKg,
    existingLog,
    queryClient,
    workoutLogQueryKey,
    removeLogParams,
  ]);

  const patchWorkoutLogCaches = useCallback(
    (log: WorkoutLog) => {
      queryClient.setQueryData(workoutLogQueryKey, [log]);
      onSavedChange?.(true);
      queryClient.setQueryData(
        workoutLogsAllKey,
        upsertWorkoutLogInCache(
          queryClient.getQueryData<WorkoutLog[]>(workoutLogsAllKey),
          log,
          removeLogParams
        )
      );
      queryClient.setQueriesData<WorkoutLog[]>(
        { queryKey: QUERY_KEYS.workoutLogs },
        (old) => upsertWorkoutLogInListQueryData(old, log, removeLogParams)
      );
    },
    [onSavedChange, queryClient, removeLogParams, workoutLogQueryKey, workoutLogsAllKey]
  );

  const saveMutation = useMutation({
    mutationFn: async (variables?: SaveWorkoutLogVariables) => {
      if (!activeGymId || !activeMemberId) throw new Error('missing_gym_or_member');
      const body = {
        gymId: activeGymId,
        memberId: activeMemberId,
        machineCode,
        logDate,
        setCount: variables?.setCount ?? setCountRef.current,
        setWeightsKg: variables?.setWeightsKg ?? weightsRef.current,
        setCompleted: variables?.setCompleted ?? setCompletedRef.current,
        diary: diary.trim() || undefined,
        ...(recommendationId && isTodayLog ? { recommendationId } : {}),
        ...(queryTargetMuscle ? { targetMuscleGroup: queryTargetMuscle } : {}),
      };

      const draftKeyValue = draftKey({
        gymId: activeGymId,
        memberId: activeMemberId,
        machineCode,
        logDate,
        targetMuscleGroup: queryTargetMuscle,
      });
      void putWorkoutDraft({
        key: draftKeyValue,
        gymId: activeGymId,
        memberId: activeMemberId,
        machineCode,
        logDate,
        targetMuscleGroup: queryTargetMuscle,
        setCount: body.setCount,
        setWeightsKg: [...body.setWeightsKg],
        setCompleted: [...(body.setCompleted ?? [])],
        diary: body.diary,
        updatedAt: Date.now(),
      });

      const idempotencyKey = [
        'wl',
        activeGymId,
        activeMemberId,
        machineCode,
        logDate,
        queryTargetMuscle ?? '',
        String(body.setCount),
        (body.setCompleted ?? []).map((v) => (v ? '1' : '0')).join(''),
        body.setWeightsKg.map((w) => String(w)).join(','),
      ]
        .join(':')
        .slice(0, 120);

      try {
        const started = performance.now();
        const res = await workoutLogApi.upsert(body, { idempotencyKey });
        void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
          trackFeature('workout_save_ms', {
            ms: Math.round(performance.now() - started),
            silent: Boolean(variables?.silent),
          })
        );
        return res.data.data;
      } catch (error) {
        const transient =
          !navigator.onLine ||
          (axios.isAxiosError(error) &&
            (!error.response ||
              error.code === 'ECONNABORTED' ||
              [408, 409, 429, 500, 502, 503, 504].includes(error.response?.status ?? 0)));
        if (variables?.silent && transient) {
          const clientActionId =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
              ? crypto.randomUUID()
              : `wl-${Date.now()}`;
          await enqueueWorkoutLogUpsert({
            clientActionId,
            idempotencyKey,
            body,
          });
          // Keep optimistic UI; queue will flush when online.
          return {
            id: `queued-${clientActionId}`,
            gymId: activeGymId,
            memberId: activeMemberId,
            machineCode,
            logDate,
            setCount: body.setCount,
            setWeightsKg: body.setWeightsKg,
            setCompleted: body.setCompleted,
            diary: body.diary,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...(queryTargetMuscle ? { targetMuscleGroup: queryTargetMuscle } : {}),
          } satisfies WorkoutLog;
        }
        throw error;
      }
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: workoutLogQueryKey });
      await queryClient.cancelQueries({ queryKey: workoutLogsAllKey });

      if (!variables?.silent) return {};

      const previousLogs = queryClient.getQueryData<WorkoutLog[]>(workoutLogQueryKey);
      const previousAllLogs = queryClient.getQueryData<WorkoutLog[]>(workoutLogsAllKey);
      const base =
        previousLogs?.[0] ??
        existingLog ??
        ({
          id: `optimistic-${machineCode}-${logDate}`,
          gymId: activeGymId ?? '',
          memberId: activeMemberId ?? '',
          machineCode,
          logDate,
          setCount: variables.setCount ?? setCountRef.current,
          setWeightsKg: variables.setWeightsKg ?? weightsRef.current,
          setCompleted: variables.setCompleted ?? setCompletedRef.current,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...(queryTargetMuscle ? { targetMuscleGroup: queryTargetMuscle } : {}),
        } satisfies WorkoutLog);

      const optimistic: WorkoutLog = {
        ...base,
        setCount: variables.setCount ?? setCountRef.current,
        setWeightsKg: [...(variables.setWeightsKg ?? weightsRef.current)],
        setCompleted: [...(variables.setCompleted ?? setCompletedRef.current)],
        diary: diary.trim() || base.diary,
        updatedAt: new Date().toISOString(),
      };
      patchWorkoutLogCaches(optimistic);
      return { previousLogs, previousAllLogs, silent: true as const };
    },
    onSuccess: async (savedLog, variables) => {
      if (savedLog) {
        void import('@/utils/timerHistoryPersist').then(({ noteActiveTimerMachine }) => {
          noteActiveTimerMachine(savedLog);
        });
      }
      void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
        trackFeature(variables?.silent ? 'history_save' : 'workout_save')
      );
      let personalTipSaved = true;
      // Skip tip on silent set-complete autosaves. 「계획 저장」 and explicit save
      // persist personalTipMemo only (API omits customSettings → keeps 조정중량).
      const shouldSavePersonalTip =
        showPersonalTip &&
        isAuthenticated &&
        !variables?.silent &&
        isPersonalTipDirty;
      if (shouldSavePersonalTip) {
        try {
          const savedPrefs = await machinePreferenceApi.upsert({
            machineCode,
            personalTipMemo: personalTipMemo.trim(),
            ...(activeGymId && activeMemberId
              ? { gymId: activeGymId, memberId: activeMemberId }
              : {}),
          });
          setPersonalTipMemo(savedPrefs.personalTipMemo ?? personalTipMemo.trim());
          // Patch tip only — do not invalidate prefs (avoids stale customSettings flash).
          queryClient.setQueryData(
            QUERY_KEYS.machinePreferences(machineCode, activeGymId, activeMemberId),
            (prev: unknown) => {
              const current =
                prev && typeof prev === 'object'
                  ? (prev as {
                      customSettings?: Partial<RecommendationSettings>;
                      personalTipMemo?: string;
                      activeSource?: SettingsActiveSource;
                    })
                  : {};
              return {
                customSettings: current.customSettings ?? {},
                personalTipMemo: savedPrefs.personalTipMemo ?? personalTipMemo.trim(),
                activeSource: savedPrefs.activeSource ?? current.activeSource ?? 'recommended',
              };
            }
          );
        } catch (error) {
          personalTipSaved = false;
          showToast(
            resolveApiErrorMessage(error, t, 'machines:history.personalTipSaveFailed'),
            'error'
          );
        }
      }

      patchWorkoutLogCaches(savedLog);
      if (variables?.silent) {
        scheduleSoftSideEffects();
      } else {
        if (sideEffectDebounceRef.current) {
          clearTimeout(sideEffectDebounceRef.current);
          sideEffectDebounceRef.current = null;
        }
        invalidateSoftSideEffects();
      }
      if (personalTipSaved && !variables?.silent) {
        if (variables?.asPlan) {
          showToast(t('machines:workoutLog.planSaved'), 'success');
        } else {
          const savedToast = isLogSaved
            ? t('machines:workoutLog.updated')
            : isTodayLog
              ? t('machines:workoutLog.saved')
              : t('machines:workoutLog.savedOnDate', { date: logDate });
          showToast(savedToast, 'success');
        }
      }
    },
    onError: (error, variables, context) => {
      if (context?.previousLogs !== undefined) {
        queryClient.setQueryData(workoutLogQueryKey, context.previousLogs);
        onSavedChange?.(Boolean(context.previousLogs?.[0]));
      }
      if (context?.previousAllLogs !== undefined) {
        queryClient.setQueryData(workoutLogsAllKey, context.previousAllLogs);
      }
      const current = queryClient.getQueryData<WorkoutLog[]>(workoutLogQueryKey);
      onSavedChange?.(Boolean(current?.[0]));
      if (!variables?.silent) {
        showToast(resolveApiErrorMessage(error, t, 'common:errors.submitFailed'), 'error');
      } else {
        showToast(
          resolveApiErrorMessage(error, t, 'machines:workoutLog.syncDelayed'),
          'info'
        );
      }
    },
    onSettled: () => {
      const queued = pendingSilentSaveRef.current;
      if (!queued) return;
      pendingSilentSaveRef.current = null;
      queueMicrotask(() => {
        saveMutation.mutate(queued);
      });
    },
  });

  const enqueueSilentSave = useCallback(
    (variables: SaveWorkoutLogVariables) => {
      const payload: SaveWorkoutLogVariables = {
        ...variables,
        silent: true,
        setCount: variables.setCount ?? setCountRef.current,
        setWeightsKg: variables.setWeightsKg ?? weightsRef.current,
        setCompleted: variables.setCompleted ?? setCompletedRef.current,
      };
      if (saveMutation.isPending) {
        pendingSilentSaveRef.current = payload;
        return;
      }
      saveMutation.mutate(payload);
    },
    [saveMutation]
  );

  const removeMutation = useMutation({
    mutationFn: () => {
      if (!activeGymId || !activeMemberId) throw new Error('missing_gym_or_member');
      return workoutLogApi.remove({
        gymId: activeGymId,
        memberId: activeMemberId,
        machineCode,
        logDate,
        ...(queryTargetMuscle ? { targetMuscleGroup: queryTargetMuscle } : {}),
      });
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: workoutLogQueryKey });
      await queryClient.cancelQueries({ queryKey: workoutLogsAllKey });
      const previousLogs = queryClient.getQueryData<WorkoutLog[]>(workoutLogQueryKey);
      const previousAllLogs = queryClient.getQueryData<WorkoutLog[]>(workoutLogsAllKey);

      // Keep set count / weights / completed / diary / tip in the UI after 「기록 해제」.
      // Only clear the saved-log association so the user can re-save without retyping.
      const nextHydrateKey = `${machineCode}|${logDate}|${activeTargetMuscle ?? ''}|new|`;
      lastHydrateKeyRef.current = nextHydrateKey;
      lastAppliedSeedKeyRef.current =
        suggestedWeightKg != null && suggestedWeightKg > 0
          ? `${nextHydrateKey}|${suggestedWeightKg}`
          : `${nextHydrateKey}|none`;
      setBaseline(null);
      queryClient.setQueryData(workoutLogQueryKey, []);
      onSavedChange?.(false);
      queryClient.setQueryData(
        workoutLogsAllKey,
        removeWorkoutLogFromCache(previousAllLogs, removeLogParams)
      );
      queryClient.setQueriesData<WorkoutLog[]>(
        { queryKey: QUERY_KEYS.workoutLogs },
        (old) => removeWorkoutLogInListQueryData(old, removeLogParams)
      );

      return { previousLogs, previousAllLogs };
    },
    onSuccess: () => {
      queryClient.setQueryData(workoutLogQueryKey, []);
      onSavedChange?.(false);
      queryClient.setQueryData(
        workoutLogsAllKey,
        removeWorkoutLogFromCache(
          queryClient.getQueryData<WorkoutLog[]>(workoutLogsAllKey),
          removeLogParams
        )
      );
      queryClient.setQueriesData<WorkoutLog[]>(
        { queryKey: QUERY_KEYS.workoutLogs },
        (old) => removeWorkoutLogInListQueryData(old, removeLogParams)
      );
      invalidateLogSideEffects();
      showToast(
        isTodayLog
          ? t('machines:workoutLog.canceled')
          : t('machines:workoutLog.canceledOnDate', { date: logDate }),
        'success'
      );
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLogs !== undefined) {
        queryClient.setQueryData(workoutLogQueryKey, context.previousLogs);
        onSavedChange?.(Boolean(context.previousLogs?.[0]));
      }
      if (context?.previousAllLogs !== undefined) {
        queryClient.setQueryData(workoutLogsAllKey, context.previousAllLogs);
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  const isBlockingPending =
    removeMutation.isPending ||
    companionSavePending ||
    Boolean(saveMutation.isPending && !saveMutation.variables?.silent);
  /** Panel lock for Save/Remove — silent set-complete does not block set taps. */
  const isActionPending = isBlockingPending;

  const translateMuscleGroup = (group: string) =>
    t(`machines:muscleGroups.${group}`, { defaultValue: group });

  const showMusclePicker = isFreeWeight && !lockTargetMuscle;

  const targetMusclePicker = showMusclePicker ? (
    <div
      className="recommendation-workout-log__muscle-picker"
      role="group"
      aria-label={t('machines:targetMuscleLabel')}
    >
      <p className="recommendation-workout-log__field-label">{t('machines:targetMuscleLabel')}</p>
      {activeTargetMuscle ? (
        <div className="recommendation-workout-log__muscle-selected">
          <button
            type="button"
            className="filter-chip filter-chip--active"
            onClick={() => setSelectedMuscle(null)}
            disabled={isActionPending}
            aria-pressed
          >
            <MuscleGroupIcon
              group={activeTargetMuscle}
              size={22}
              className="filter-chip__icon"
            />
            <span>{translateMuscleGroup(activeTargetMuscle)}</span>
          </button>
        </div>
      ) : (
        <div className="filter-chips recommendation-workout-log__muscle-chips">
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              className="filter-chip"
              onClick={() => setSelectedMuscle(group)}
              disabled={isActionPending}
            >
              <MuscleGroupIcon group={group} size={22} className="filter-chip__icon" />
              <span>{translateMuscleGroup(group)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  ) : lockTargetMuscle && activeTargetMuscle ? (
    <div className="recommendation-workout-log__muscle-locked">
      <p className="recommendation-workout-log__field-label">{t('machines:targetMuscleLabel')}</p>
      <div className="recommendation-workout-log__muscle-selected">
        <span className="filter-chip filter-chip--active filter-chip--readonly">
          <MuscleGroupIcon
            group={activeTargetMuscle}
            size={22}
            className="filter-chip__icon"
          />
          <span>{translateMuscleGroup(activeTargetMuscle)}</span>
        </span>
      </div>
    </div>
  ) : null;

  const handleSave = useCallback(async () => {
    if (isFreeWeight && !activeTargetMuscle) {
      showToast(t('machines:targetMuscleRequired'), 'error');
      return;
    }
    try {
      if (onCompanionSave) {
        await onCompanionSave();
      }
      await saveMutation.mutateAsync({});
    } catch {
      // Toast handled by mutation / companion save.
    }
  }, [
    activeTargetMuscle,
    isFreeWeight,
    onCompanionSave,
    saveMutation,
    showToast,
    t,
  ]);

  const handleRemoveLog = useCallback(() => {
    removeMutation.mutate();
  }, [removeMutation]);

  const saveRef = useRef(handleSave);
  const removeRef = useRef(handleRemoveLog);
  saveRef.current = handleSave;
  removeRef.current = handleRemoveLog;

  useEffect(() => {
    if (!onControlReady) return;

    if (!isAuthenticated) {
      onControlReady(null);
      return;
    }

    onControlReady({
      isLogSaved,
      isDirty,
      isActionPending,
      isLoading,
      canSave: isLogSaved ? isDirty && !isLoading : !isLoading,
      totalWeightKg,
      setCount,
      save: () => saveRef.current(),
      remove: () => removeRef.current(),
    });
  }, [
    onControlReady,
    isAuthenticated,
    isLogSaved,
    isDirty,
    isActionPending,
    isLoading,
    totalWeightKg,
    setCount,
  ]);

  useEffect(() => {
    return () => onControlReady?.(null);
  }, [onControlReady]);

  const handleSetCountChange = (value: number) => {
    const next = Math.min(MAX_SET_COUNT, Math.max(MIN_SET_COUNT, value));
    setSetCount(next);
    setWeights((prev) => resizeWeights(prev, next, suggestedWeightKg));
    setSetCompleted((prev) => resizeCompleted(prev, next));
    setPlanProtected((prev) => {
      const resized = resizeCompleted(prev, next);
      planProtectedRef.current = resized;
      return resized;
    });
  };

  const handleWeightChange = (index: number, next: number) => {
    setWeights((prev) => {
      const updated = [...prev];
      updated[index] = next >= 0 ? next : 0;
      weightsRef.current = updated;
      return updated;
    });
  };

  const handleApplySuggestedWeight = (index: number) => {
    if (suggestedWeightKg == null || suggestedWeightKg <= 0) return;
    handleWeightChange(index, suggestedWeightKg);
  };

  const handleCopyPreviousWeight = (index: number) => {
    if (index <= 0) return;
    handleWeightChange(index, weights[index - 1] ?? 0);
  };

  const handleApplyWeightToAll = (sourceIndex: number) => {
    const source = weights[sourceIndex] ?? 0;
    setWeights((prev) => {
      const updated = prev.map(() => source);
      weightsRef.current = updated;
      return updated;
    });
  };

  const handleDiaryChange = (value: string) => {
    setDiary(truncateUtf8(value, WORKOUT_DIARY_MAX_BYTES));
  };

  const handlePersonalTipChange = (value: string) => {
    setPersonalTipMemo(truncateUtf8(value, MACHINE_PERSONAL_TIP_MAX_BYTES));
  };

  const handleDiaryTagClick = (tag: string) => {
    const token = formatDiaryTag(tag);
    const next = diary.trim() ? `${diary.trim()} ${token}` : token;
    handleDiaryChange(next);
  };

  const handleToggleSetCompleted = (index: number) => {
    setSetCompleted((prev) => {
      const next = [...prev];
      const wasCompleted = next[index] ?? false;
      next[index] = !wasCompleted;

      if (!wasCompleted && next[index]) {
        if (shouldShowRestAfterSetComplete(next, restTimerAfterAllSetsComplete)) {
          unlockVoiceCoachAudio(sessionVoicePack);
          startRestTimer(index + 1, clampRestDurationSeconds(restDurationSeconds));
          void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
            trackFeature('rest_timer')
          );
          void import('@/utils/usageTelemetry').then(({ trackUsage }) =>
            trackUsage('rest_timer')
          );
        } else {
          stopRestTimer();
        }
      } else if (wasCompleted) {
        stopRestTimer();
      }

      return next;
    });
  };

  const handleHistorySetComplete = (index: number) => {
    if (isFreeWeight && !activeTargetMuscle) {
      showToast(t('machines:targetMuscleRequired'), 'error');
      return;
    }

    const next = [...setCompleted];
    const wasCompleted = next[index] ?? false;
    next[index] = !wasCompleted;

    setSetCompleted(next);

    if (!wasCompleted && next[index]) {
      if (shouldShowRestAfterSetComplete(next, restTimerAfterAllSetsComplete)) {
        unlockVoiceCoachAudio(sessionVoicePack);
        startRestTimer(index + 1, clampRestDurationSeconds(restDurationSeconds));
        void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
          trackFeature('rest_timer')
        );
        void import('@/utils/usageTelemetry').then(({ trackUsage }) =>
          trackUsage('rest_timer')
        );
      } else {
        stopRestTimer();
      }
    } else if (wasCompleted) {
      stopRestTimer();
    }

    enqueueSilentSave({ setCompleted: next });
  };

  const allSetsCompleted =
    setCompleted.length > 0 && setCompleted.every((done) => done === true);

  const handleToggleAllSetsComplete = () => {
    if (isFreeWeight && !activeTargetMuscle) {
      showToast(t('machines:targetMuscleRequired'), 'error');
      return;
    }

    const markComplete = !allSetsCompleted;
    const next = Array.from({ length: setCount }, () => markComplete);
    setSetCompleted(next);

    if (markComplete) {
      if (shouldShowRestAfterSetComplete(next, restTimerAfterAllSetsComplete)) {
        unlockVoiceCoachAudio(sessionVoicePack);
        startRestTimer(setCount, clampRestDurationSeconds(restDurationSeconds));
        void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
          trackFeature('rest_timer')
        );
        void import('@/utils/usageTelemetry').then(({ trackUsage }) =>
          trackUsage('rest_timer')
        );
      } else {
        stopRestTimer();
      }
    } else {
      stopRestTimer();
    }

    enqueueSilentSave({ setCompleted: next });
  };

  const isDiaryDirty =
    diary.trim() !== (baseline?.diary ?? existingLog?.diary ?? '').trim();

  const isPlanDirty =
    isPersonalTipDirty ||
    isDiaryDirty ||
    !existingLog ||
    existingLog.setCount !== setCount ||
    !weightsEqual(existingLog.setWeightsKg ?? [], weights);

  const handlePlanSave = useCallback(async () => {
    if (isFreeWeight && !activeTargetMuscle) {
      showToast(t('machines:targetMuscleRequired'), 'error');
      return;
    }

    const nextWeights = [...weightsRef.current];
    const nextCount = setCountRef.current;
    const nextDiary = diary.trim();
    const nextProtected = Array.from({ length: nextCount }, () => true);
    const voicePrefs = captureCurrentVoicePrefs();

    try {
      await saveMutation.mutateAsync({
        setWeightsKg: nextWeights,
        setCount: nextCount,
        setCompleted: [...setCompletedRef.current],
        asPlan: true,
      });
      if (voicePrefs) {
        setLiveCardVoicePrefs(cardVoicePrefsKey, voicePrefs);
        if (workoutCardId) {
          try {
            lastPatchedVoicePrefsRef.current = JSON.stringify(voicePrefs);
            await workoutCardApi.update(workoutCardId, { voicePrefs });
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCards });
          } catch {
            // Sets/weights already saved; voice prefs stay in live store for template save.
          }
        }
      }
      setPlanProtected(nextProtected);
      planProtectedRef.current = nextProtected;
      setBaseline((prev) =>
        prev
          ? {
              ...prev,
              setCount: nextCount,
              weights: nextWeights,
              setCompleted: [...setCompletedRef.current],
              diary: nextDiary,
            }
          : {
              setCount: nextCount,
              weights: nextWeights,
              setCompleted: [...setCompletedRef.current],
              diary: nextDiary,
            }
      );
    } catch {
      // Toast handled by mutation.
    }
  }, [
    activeTargetMuscle,
    captureCurrentVoicePrefs,
    cardVoicePrefsKey,
    diary,
    isFreeWeight,
    queryClient,
    saveMutation,
    setLiveCardVoicePrefs,
    showToast,
    t,
    workoutCardId,
  ]);

  if (!isAuthenticated) {
    return (
      <section
        className={`recommendation-workout-log${compact ? ' recommendation-workout-log--compact' : ''}`}
        aria-label={t('machines:workoutLog.title')}
      >
        <p className="recommendation-workout-log__login-hint">
          {t('machines:workoutLog.loginRequired')}
        </p>
        {!compact ? (
          <Link to={ROUTES.LOGIN} state={{ from: location }} className="btn btn--secondary btn--block">
            {t('machines:recommendLogin')}
          </Link>
        ) : null}
      </section>
    );
  }

  if (isAllGyms) {
    return (
      <section
        className={`recommendation-workout-log${compact ? ' recommendation-workout-log--compact' : ''}`}
        aria-label={t('machines:workoutLog.title')}
      >
        <p className="recommendation-workout-log__login-hint">
          {t('machines:workoutLog.selectGymToLog')}
        </p>
      </section>
    );
  }

  const controlSize = compact || isHistory ? 'compact' : 'default';

  const setCountControl = (
    <NumericStepper
      id={setCountInputId}
      value={setCount}
      onChange={(next) => {
        if (next == null) return;
        handleSetCountChange(next);
      }}
      min={MIN_SET_COUNT}
      max={MAX_SET_COUNT}
      step={1}
      size={controlSize}
      disabled={isActionPending}
      ariaLabel={t('machines:workoutLog.setCount')}
      allowManualInput={false}
    />
  );

  const nextIncompleteSetIndex = useMemo(
    () => setCompleted.findIndex((done) => done !== true),
    [setCompleted]
  );

  const weightList = (
    <div
      className={`recommendation-workout-log__weight-list${
        compact ? ' recommendation-workout-log__weight-list--compact' : ''
      }${isHistory ? ' recommendation-workout-log__weight-list--history' : ''}`}
    >
      {weights.map((weight, index) => {
        const completed = setCompleted[index] ?? false;
        const previousWeight = index > 0 ? weights[index - 1] : undefined;
        const planSaved = isSetPlanSaved(
          index,
          weight,
          existingLog?.setWeightsKg,
          existingLog?.setCount
        );
        const nudgeComplete = isHistory && !completed && index === nextIncompleteSetIndex;
        return (
          <div
            key={index}
            className={`recommendation-workout-log__weight-row${
              compact ? ' recommendation-workout-log__weight-row--compact' : ''
            }${isHistory ? ' recommendation-workout-log__weight-row--history' : ''}${
              completed ? ' recommendation-workout-log__weight-row--completed' : ''
            }`}
          >
            {isHistory ? (
              <span
                className={`recommendation-workout-log__set-index${
                  completed ? ' recommendation-workout-log__set-index--completed' : ''
                }${!completed ? ' recommendation-workout-log__set-index--active' : ''}`}
              >
                {completed ? <Check size={12} strokeWidth={3} aria-hidden /> : index + 1}
              </span>
            ) : (
              <button
                type="button"
                className={`recommendation-workout-log__set-toggle${
                  compact ? ' recommendation-workout-log__set-toggle--compact' : ''
                }${completed ? ' recommendation-workout-log__set-toggle--completed' : ''}`}
                onClick={() => handleToggleSetCompleted(index)}
                disabled={isActionPending}
                aria-pressed={completed}
                aria-label={t('machines:workoutLog.setLabel', { number: index + 1 })}
              >
                {compact ? index + 1 : t('machines:workoutLog.setLabel', { number: index + 1 })}
              </button>
            )}
            <WeightStepper
              id={`${idPrefix}-weight-${index}`}
              value={weight}
              step={weightStepKg}
              size={controlSize}
              disabled={isActionPending}
              ariaLabel={t('machines:workoutLog.setLabel', { number: index + 1 })}
              suggestedWeightKg={suggestedWeightKg}
              previousWeightKg={previousWeight}
              onApplySuggested={() => handleApplySuggestedWeight(index)}
              onCopyPrevious={() => handleCopyPreviousWeight(index)}
              onApplyToAll={() => handleApplyWeightToAll(index)}
              showApplyToAll={setCount > 1}
              showQuickActions={!compact && !isHistory}
              onChange={(next) => handleWeightChange(index, next)}
            />
            {isHistory ? (
              <>
                <span
                  className={`recommendation-workout-log__plan-status${
                    planSaved
                      ? ' recommendation-workout-log__plan-status--saved'
                      : ' recommendation-workout-log__plan-status--unsaved'
                  }`}
                  title={
                    planSaved
                      ? t('machines:workoutLog.planStatusSaved')
                      : t('machines:workoutLog.planStatusUnsaved')
                  }
                >
                  {planSaved
                    ? t('machines:workoutLog.planStatusSaved')
                    : t('machines:workoutLog.planStatusUnsaved')}
                </span>
                <button
                  type="button"
                  className={`recommendation-workout-log__complete-btn${
                    completed
                      ? ' recommendation-workout-log__complete-btn--completed'
                      : ' recommendation-workout-log__complete-btn--pending'
                  }${
                    nudgeComplete ? ' recommendation-workout-log__complete-btn--nudge' : ''
                  }`}
                  onClick={() => handleHistorySetComplete(index)}
                  disabled={isActionPending}
                  aria-pressed={completed}
                  aria-label={
                    completed
                      ? t('machines:workoutLog.setCompleteDoneAria', { number: index + 1 })
                      : t('machines:workoutLog.setCompletePendingAria', { number: index + 1 })
                  }
                >
                  {completed
                    ? t('machines:workoutLog.setComplete')
                    : t('machines:workoutLog.setIncomplete')}
                </button>
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );

  const diaryTags = (
    <div
      className="recommendation-workout-log__diary-tags"
      role="group"
      aria-label={t('machines:workoutLog.diaryTagsLabel')}
    >
      {WORKOUT_DIARY_TAGS.map((tag) => (
        <button
          key={tag}
          type="button"
          className="recommendation-workout-log__diary-tag"
          onClick={() => handleDiaryTagClick(tag)}
          disabled={isActionPending}
        >
          {formatDiaryTag(tag)}
        </button>
      ))}
    </div>
  );

  const diaryField = isHistory ? (
    <div className="history-workout-log__diary-grid">
      <div className="history-workout-log__diary-tags-pane">{diaryTags}</div>
      <div className="history-workout-log__diary-memo-pane">
        <textarea
          id={`${idPrefix}-diary`}
          className="input history-workout-log__memo-input"
          rows={4}
          value={diary}
          placeholder={t('machines:history.memoPlaceholder')}
          aria-label={t('machines:history.memoPlaceholder')}
          onChange={(e) => handleDiaryChange(e.target.value)}
          disabled={isActionPending}
        />
      </div>
    </div>
  ) : compact ? (
    <details
      className="recommendation-workout-log__diary-details"
      open={diaryExpanded}
      onToggle={(e) => setDiaryExpanded(e.currentTarget.open)}
    >
      <summary className="recommendation-workout-log__diary-summary">
        <span>{t('machines:workoutLog.diaryTitle')}</span>
      </summary>
      {diaryTags}
      <textarea
        id={`${idPrefix}-diary`}
        className="input recommendation-workout-log__diary-input"
        rows={2}
        value={diary}
        placeholder={t('machines:workoutLog.diaryPlaceholder')}
        onChange={(e) => handleDiaryChange(e.target.value)}
        disabled={isActionPending}
      />
    </details>
  ) : (
    <div className="recommendation-workout-log__diary">
      <div className="recommendation-workout-log__diary-header">
        <label className="recommendation-workout-log__field-label" htmlFor={`${idPrefix}-diary`}>
          {t('machines:workoutLog.diaryTitle')}
        </label>
        <span className="recommendation-workout-log__diary-bytes">
          {t('machines:workoutLog.diaryBytes', { used: diaryBytes })}
        </span>
      </div>
      {diaryTags}
      <textarea
        id={`${idPrefix}-diary`}
        className="input recommendation-workout-log__diary-input"
        rows={3}
        value={diary}
        placeholder={t('machines:workoutLog.diaryPlaceholder')}
        onChange={(e) => handleDiaryChange(e.target.value)}
        disabled={isActionPending}
      />
    </div>
  );

  const planSaveAttention = isPlanDirty && !isActionPending && !isLoading;
  const planSaveLabel =
    saveMutation.isPending && saveMutation.variables?.asPlan
      ? t('machines:workoutLog.planSaving')
      : t('machines:workoutLog.planSave');

  const renderPlanSaveButton = (placement: 'header' | 'below-tip') => (
    <button
      type="button"
      className={[
        'btn btn--secondary history-workout-log__plan-save',
        placement === 'below-tip' ? 'history-workout-log__plan-save--below-tip' : '',
        planSaveAttention ? 'history-workout-log__plan-save--attention' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={() => void handlePlanSave()}
      disabled={isActionPending || isLoading || !isPlanDirty}
      aria-live={isPlanDirty ? 'polite' : undefined}
    >
      <span className="history-workout-log__plan-save-lead" aria-hidden="true">
        <span className="history-workout-log__plan-save-note">📋</span>
        <PenLine className="history-workout-log__plan-save-pen" strokeWidth={2.75} />
      </span>
      {planSaveLabel}
    </button>
  );

  const renderAllSetsCompleteToggle = (placement: 'header' | 'below-tip') => (
    <button
      type="button"
      className={[
        'btn btn--secondary history-workout-log__all-complete',
        placement === 'below-tip' ? 'history-workout-log__all-complete--below-tip' : '',
        allSetsCompleted ? 'history-workout-log__all-complete--undo' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleToggleAllSetsComplete}
      disabled={isActionPending || isLoading || setCount < 1}
      aria-pressed={allSetsCompleted}
      aria-label={
        allSetsCompleted
          ? t('machines:workoutLog.allSetsUndoAria')
          : t('machines:workoutLog.allSetsCompleteAria')
      }
      title={
        allSetsCompleted
          ? t('machines:workoutLog.allSetsUndoAria')
          : t('machines:workoutLog.allSetsCompleteAria')
      }
    >
      {allSetsCompleted ? (
        <ListRestart
          className="history-workout-log__all-complete-icon"
          strokeWidth={2.75}
          aria-hidden
        />
      ) : (
        <CheckCheck
          className="history-workout-log__all-complete-icon"
          strokeWidth={2.75}
          aria-hidden
        />
      )}
    </button>
  );

  const renderPlanActionGroup = (placement: 'header' | 'below-tip') => (
    <div
      className={[
        'history-workout-log__plan-actions',
        placement === 'below-tip' ? 'history-workout-log__plan-actions--below-tip' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {renderPlanSaveButton(placement)}
      {renderAllSetsCompleteToggle(placement)}
    </div>
  );

  const personalTipField =
    isHistory && showPersonalTip && isAuthenticated ? (
      <div className="history-workout-log__personal-tip">
        <textarea
          id={`${idPrefix}-personal-tip`}
          className="input history-workout-log__memo-input history-workout-log__personal-tip-input"
          rows={2}
          value={personalTipMemo}
          placeholder={t('machines:history.personalTipPlaceholder')}
          aria-label={t('machines:history.personalTipPlaceholder')}
          onChange={(e) => handlePersonalTipChange(e.target.value)}
          disabled={isActionPending}
        />
        {renderPlanActionGroup('below-tip')}
      </div>
    ) : null;

  const saveButton = isLogSaved ? (
    <div className="recommendation-workout-log__actions">
      <button
        type="button"
        className={[
          'btn recommendation-workout-log__save btn--primary',
          compact ? ' recommendation-workout-log__save--compact btn--block' : ' btn--block',
        ].join('')}
        onClick={handleSave}
        disabled={!isDirty || isActionPending || isLoading}
      >
        {saveMutation.isPending ? t('machines:workoutLog.updating') : t('machines:workoutLog.update')}
      </button>
      <button
        type="button"
        className={[
          'btn recommendation-workout-log__save btn--secondary recommendation-workout-log__save--saved',
          compact ? ' recommendation-workout-log__save--compact btn--block' : ' btn--block',
        ].join('')}
        onClick={handleRemoveLog}
        disabled={isActionPending || isLoading}
      >
        {removeMutation.isPending ? t('machines:workoutLog.canceling') : t('machines:workoutLog.cancel')}
      </button>
    </div>
  ) : (
    <button
      type="button"
      className={[
        'btn recommendation-workout-log__save',
        compact ? ' recommendation-workout-log__save--compact btn--block' : ' btn--block',
        'btn--primary',
      ].join('')}
      onClick={handleSave}
      disabled={isActionPending || isLoading}
    >
      {saveMutation.isPending ? t('machines:workoutLog.saving') : t('machines:workoutLog.save')}
    </button>
  );

  const totalWeightSummary = (
    <div className="recommendation-workout-log__total">
      <span className="recommendation-workout-log__total-label">
        {t('machines:workoutLog.totalWeight')}
      </span>
      <strong className="recommendation-workout-log__total-value">
        {formatWeight(totalWeightKg, unitWeight)}
      </strong>
    </div>
  );

  const voiceCoachPanel =
    showVoiceCoach && settingsHydrated && voicePickers ? (
    <VoiceCoachPanel
      key={voiceTargetSeedContext}
      enabled={sessionVoiceEnabled}
      onEnabledChange={handleCardVoiceEnabledChange}
      targetReps={voicePickers.targetReps}
      onTargetRepsChange={handleVoiceTargetRepsChange}
      repGapMs={voicePickers.repGapMs}
      onRepGapMsChange={handleVoiceRepGapMsChange}
      prepCount={sessionPrepCount}
      onPrepCountChange={handleCardPrepCountChange}
      voicePack={sessionVoicePack}
      onVoicePackChange={handleCardVoicePackChange}
      countMode={sessionCountMode}
      onCountModeChange={handleCardCountModeChange}
      flowMode={sessionFlowMode}
      onFlowModeChange={handleCardFlowModeChange}
      holdDurationSec={voicePickers.holdDurationSec}
      onHoldDurationSecChange={handleVoiceHoldDurationChange}
      oneMoreEnabled={sessionOneMoreEnabled}
      onOneMoreChange={isHistory ? () => {} : handleCardOneMoreEnabledChange}
      oneMoreCount={voicePickers.oneMoreCount}
      onOneMoreCountChange={handleVoiceOneMoreCountChange}
      autoStartAfterRest={sessionAutoAfterRest}
      onAutoStartAfterRestChange={handleCardAutoAfterRestChange}
      restTipsEnabled={sessionRestTipsEnabled}
      onRestTipsEnabledChange={handleCardRestTipsEnabledChange}
      phase={voiceCoach.phase}
      currentRep={voiceCoach.currentRep}
      countdown={voiceCoach.countdown}
      turbo={voiceCoach.turbo}
      intensity={voiceCoach.intensity}
      isRunning={voiceCoach.isRunning}
      onStart={startVoiceCoach}
      onStop={stopVoiceCoachSession}
      idPrefix={`${idPrefix}-voice-coach`}
      compact={compact}
      showVoicePackSelector={!isHistory}
      showRestOptionSelectors={!isHistory}
      showOneMoreAndHoldSelectors={!isHistory}
      showSessionConfigSelectors={!isHistory}
      // GlobalCountSessionHost owns live chrome while a session is running.
      hideLiveDisplay={voiceCoach.isRunning}
      onPickersPinnedChange={setVoicePickersPinned}
    />
  ) : null;

  if (isHistory) {
    return (
      <>
        <section
          className="recommendation-workout-log recommendation-workout-log--history"
          aria-label={t('machines:workoutLog.title')}
        >
        {targetMusclePicker}
        <div className="history-workout-log__performance">
          <div className="history-workout-log__performance-header">
            <div className="history-workout-log__performance-title-row">
              <span className="history-workout-log__performance-title">
                {t('machines:history.performanceTitle', { count: setCount })}
              </span>
              {setCountControl}
              {renderPlanActionGroup('header')}
            </div>
          </div>
          {weightList}
        </div>
        {diaryField}
        {personalTipField ? (
          <div className="history-workout-log__memo-actions">{personalTipField}</div>
        ) : null}
        {/* After diary / tip + 「계획 저장」(below-tip) on Records + detail. */}
        {voiceCoachPanel}
        {showSaveButton ? saveButton : null}
        </section>
      </>
    );
  }

  if (compact) {
    return (
      <>
        <section
          className="recommendation-workout-log recommendation-workout-log--compact"
          aria-label={t('machines:workoutLog.title')}
        >
        {voiceCoachPanel}
        {targetMusclePicker}
        <div className="recommendation-workout-log__toolbar">
          <span className="recommendation-workout-log__title">{t('machines:workoutLog.title')}</span>
          {setCountControl}
          <span className="recommendation-workout-log__toolbar-total">
            {formatWeight(totalWeightKg, unitWeight)}
          </span>
        </div>
        <div className="recommendation-workout-log__weights">{weightList}</div>
        {diaryField}
        {!isHistory ? saveButton : null}
        </section>
      </>
    );
  }

  return (
    <>
      <section className="recommendation-workout-log" aria-label={t('machines:workoutLog.title')}>
      {voiceCoachPanel}
      <div className="recommendation-workout-log__header">
        <span className="recommendation-collapsible__label">{t('machines:workoutLog.title')}</span>
        <span className="recommendation-workout-log__date">
          {formatHistoryDateHeader(logDate, locale)}
        </span>
      </div>

      {targetMusclePicker}

      <div className="recommendation-workout-log__set-count">
        <label className="recommendation-workout-log__field-label" htmlFor={setCountInputId}>
          {t('machines:workoutLog.setCount')}
        </label>
        {setCountControl}
      </div>

      <div className="recommendation-workout-log__weights">
        <div className="recommendation-workout-log__weights-header">
          <p className="recommendation-workout-log__field-label recommendation-workout-log__field-label--inline">
            {isBodyweight
              ? t('machines:workoutLog.estimatedLoad')
              : t('machines:workoutLog.weights')}
          </p>
          {totalWeightSummary}
        </div>
        {isBodyweight ? (
          <p className="recommendation-workout-log__bw-hint">
            {t('machines:workoutLog.estimatedLoadHint')}
          </p>
        ) : null}
        {loadSemanticsKey ? (
          <p className="recommendation-workout-log__bw-hint">
            {t(`machines:workoutLog.loadSemantics.${loadSemanticsKey}`)}
          </p>
        ) : null}
        <p className="recommendation-workout-log__bw-hint">
          {t('machines:workoutLog.seedVsRecordHint')}
        </p>
        {weightList}
      </div>

      {diaryField}

      {saveButton}
      </section>
    </>
  );
}
