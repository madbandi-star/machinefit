import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getUtf8ByteLength,
  clampRestDurationSeconds,
  truncateUtf8,
  WORKOUT_DIARY_MAX_BYTES,
  MACHINE_PERSONAL_TIP_MAX_BYTES,
  isFreeWeightMachineCode,
  formatWeight,
  isAllGymsId,
  computePerformedTotalWeightKg,
  type TargetMuscleGroup,
  type WorkoutLog,
} from '@machinefit/shared';
import { workoutLogApi, machinePreferenceApi, recommendationApi } from '@/api';
import { RestTimerBanner } from '@/components/recommendation/RestTimerBanner/RestTimerBanner';
import { VoiceCoachPanel } from '@/components/recommendation/VoiceCoachPanel/VoiceCoachPanel';
import { useVoiceCoachSession } from '@/hooks/useVoiceCoachSession';
import {
  unlockVoiceCoachAudio,
  speakRestTipsAndWarnings,
  stopVoiceCoach,
} from '@/utils/voiceCoach';
import { Check, Pencil } from 'lucide-react';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { formatHistoryDateHeader, getTodayDateKey, normalizeDateKey } from '@/utils/historyDate';
import { useSettingsStore } from '@/store/settings.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { WORKOUT_DIARY_TAGS, formatDiaryTag } from '@/constants/workout-diary-tags';
import { NumericStepper } from '@/components/form/NumericStepper/NumericStepper';
import { WeightStepper } from '@/components/form/WeightStepper/WeightStepper';
import { getWeightStepKg } from '@/utils/weightStep';
import { getWorkoutLogQueryTargetMuscle, removeWorkoutLogFromCache, upsertWorkoutLogInCache } from '@/utils/workoutLogCache';
import { buildWorkoutLogSavedQueryKey } from '@/hooks/useWorkoutLogSaved';
import '@/styles/recommendation.css';

const DEFAULT_SET_COUNT = 3;
const MIN_SET_COUNT = 1;
const MAX_SET_COUNT = 20;

interface SaveWorkoutLogVariables {
  setCompleted?: boolean[];
  /** Skip success toast (e.g. autosave on set complete). */
  silent?: boolean;
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
  const restDurationSeconds = useSettingsStore((s) => s.restDurationSeconds);
  const setVoiceCoachEnabled = useSettingsStore((s) => s.setVoiceCoachEnabled);
  const setVoiceCoachTargetReps = useSettingsStore((s) => s.setVoiceCoachTargetReps);
  const setVoiceCoachOneMore = useSettingsStore((s) => s.setVoiceCoachOneMore);
  const setVoiceCoachOneMoreCount = useSettingsStore((s) => s.setVoiceCoachOneMoreCount);
  const setVoiceCoachAutoAfterRest = useSettingsStore((s) => s.setVoiceCoachAutoAfterRest);
  const setVoiceRestTipsEnabled = useSettingsStore((s) => s.setVoiceRestTipsEnabled);
  const setVoiceCoachRepGapMs = useSettingsStore((s) => s.setVoiceCoachRepGapMs);
  const location = useLocation();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const { activeGymId } = useActiveGym();
  const { activeMemberId } = useActiveMember();
  const isAllGyms = isAllGymsId(activeGymId);
  const voiceCoach = useVoiceCoachSession({
    targetReps: voiceCoachTargetReps,
    oneMoreEnabled: voiceCoachOneMore,
    oneMoreCount: voiceCoachOneMoreCount,
    repGapMs: voiceCoachRepGapMs,
    locale,
    enabled: voiceCoachEnabled,
  });
  const voiceCoachStartRef = useRef(voiceCoach.start);
  voiceCoachStartRef.current = voiceCoach.start;
  const voiceCoachRunningRef = useRef(voiceCoach.isRunning);
  voiceCoachRunningRef.current = voiceCoach.isRunning;
  const restSpeechAbortRef = useRef<AbortController | null>(null);
  const handleRestReadyForNextSet = useCallback(() => {
    restSpeechAbortRef.current?.abort();
    restSpeechAbortRef.current = null;
    setRestTimer(null);
    // Keep an active set-count session running when rest ends or is skipped.
    if (voiceCoachRunningRef.current) return;
    stopVoiceCoach();
    if (!voiceCoachEnabled || !voiceCoachAutoAfterRest) return;
    unlockVoiceCoachAudio();
    voiceCoachStartRef.current();
  }, [voiceCoachAutoAfterRest, voiceCoachEnabled]);
  const startVoiceCoach = useCallback(() => {
    restSpeechAbortRef.current?.abort();
    restSpeechAbortRef.current = null;
    setRestTimer(null);
    voiceCoachStartRef.current();
  }, []);
  const isHistory = variant === 'history';
  const compact = variant === 'compact' || isHistory;
  const showPersonalTip = showPersonalTipMemo ?? isHistory;
  const logDate = normalizeDateKey(logDateProp ?? getTodayDateKey());
  const setCountInputId = `${idPrefix}-set-count`;
  const weightStepKg = getWeightStepKg(machineCode);
  const isFreeWeight = isFreeWeightMachineCode(machineCode);
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
  const [diary, setDiary] = useState('');
  const [personalTipMemo, setPersonalTipMemo] = useState('');
  const [diaryExpanded, setDiaryExpanded] = useState(diaryDefaultOpen);
  const [baseline, setBaseline] = useState<WorkoutFormSnapshot | null>(null);
  const lastHydrateKeyRef = useRef('');
  const lastAppliedSeedKeyRef = useRef('');
  const setCompletedRef = useRef(setCompleted);
  setCompletedRef.current = setCompleted;
  const [restTimer, setRestTimer] = useState<{ setNumber: number; seconds: number } | null>(null);
  const diaryBytes = getUtf8ByteLength(diary);
  const personalTipBytes = getUtf8ByteLength(personalTipMemo);
  const canLog = isAuthenticated && Boolean(activeGymId) && !isAllGyms && Boolean(activeMemberId);
  const queryEnabled = canLog && (!isFreeWeight || !!queryTargetMuscle);

  const needsFetchedCoaching =
    voiceCoachEnabled &&
    voiceRestTipsEnabled &&
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
    if (!restTimer) return;
    if (!voiceCoachEnabled || !voiceRestTipsEnabled) return;
    if (!hasRestCoaching) return;
    // Never restart rest tips over an active set-count session.
    if (voiceCoachRunningRef.current) return;

    const controller = new AbortController();
    restSpeechAbortRef.current = controller;
    void speakRestTipsAndWarnings({
      warnings: coachingWarningsRef.current,
      tips: coachingTipsRef.current,
      locale,
      signal: controller.signal,
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
    restTimer?.setNumber,
    restTimer?.seconds,
    voiceCoachEnabled,
    voiceRestTipsEnabled,
    hasRestCoaching,
    restCoachingFingerprint,
    locale,
  ]);


  const { data: machinePreferences, isFetched: isPreferencesFetched } = useQuery({
    queryKey: ['machine-preferences', machineCode, activeGymId, activeMemberId],
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
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const existingLog = existingLogs?.[0];
  const isLogSaved = Boolean(existingLog);
  const totalWeightKg = useMemo(
    () =>
      computePerformedTotalWeightKg({
        setWeightsKg: weights,
        setCompleted,
        sets: setCount,
        recommendedReps: voiceCoachTargetReps,
      }),
    [weights, setCompleted, setCount, voiceCoachTargetReps]
  );
  const hydrateKey = `${machineCode}|${logDate}|${activeTargetMuscle ?? ''}|${existingLog?.id ?? 'new'}|${existingLog?.updatedAt ?? ''}`;

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

  const invalidateLogSideEffects = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
    void queryClient.invalidateQueries({ queryKey: ['workout-logs', 'insights'] });
  };

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
    const snapshot = existingLog
      ? buildSnapshotFromLog(existingLog)
      : buildDefaultSnapshot(suggestedWeightKg);

    applyWorkoutFormSnapshot(snapshot, {
      setSetCount,
      setWeights,
      setSetCompleted,
      setDiary,
    });
    setBaseline(cloneWorkoutFormSnapshot(snapshot));
    // Allow the seed effect below to re-apply to incomplete sets after hydrate.
    lastAppliedSeedKeyRef.current = '';
  }, [
    isAuthenticated,
    queryEnabled,
    isFetched,
    hydrateKey,
    existingLog,
    suggestedWeightKg,
  ]);

  // Incomplete sets (-무게kg+, 완료 아님): follow live fit-feedback seed weight.
  // - 추천값 잘 맞음 → 추천중량 (parent resolves)
  // - 셋팅값 조정 필요 → 조정중량 (parent resolves from on-screen edits)
  // Completed sets keep their logged weight; saved vs unsaved does not matter.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (queryEnabled && !isFetched) return;
    if (lastHydrateKeyRef.current !== hydrateKey) return;
    if (suggestedWeightKg == null || !(suggestedWeightKg > 0)) return;

    const seedKey = `${hydrateKey}|${suggestedWeightKg}`;
    if (lastAppliedSeedKeyRef.current === seedKey) return;
    lastAppliedSeedKeyRef.current = seedKey;

    const applySeedToIncomplete = (weights: number[], completed: boolean[]) =>
      weights.map((weight, index) =>
        completed[index] === true ? weight : suggestedWeightKg
      );

    setWeights((prev) => {
      const next = applySeedToIncomplete(prev, setCompletedRef.current);
      if (weightsEqual(prev, next)) return prev;
      return next;
    });

    setBaseline((prev) => {
      if (!prev) return prev;
      const nextWeights = applySeedToIncomplete(prev.weights, setCompletedRef.current);
      if (weightsEqual(prev.weights, nextWeights)) return prev;
      return { ...prev, weights: nextWeights };
    });
  }, [
    isAuthenticated,
    queryEnabled,
    isFetched,
    hydrateKey,
    suggestedWeightKg,
  ]);

  const saveMutation = useMutation({
    mutationFn: async (variables?: SaveWorkoutLogVariables) => {
      if (!activeGymId || !activeMemberId) throw new Error('missing_gym_or_member');
      const res = await workoutLogApi.upsert({
        gymId: activeGymId,
        memberId: activeMemberId,
        machineCode,
        logDate,
        setCount,
        setWeightsKg: weights,
        setCompleted: variables?.setCompleted ?? setCompleted,
        diary: diary.trim() || undefined,
        ...(recommendationId ? { recommendationId } : {}),
        ...(queryTargetMuscle ? { targetMuscleGroup: queryTargetMuscle } : {}),
      });
      return res.data.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: workoutLogQueryKey });
      await queryClient.cancelQueries({ queryKey: workoutLogsAllKey });
    },
    onSuccess: async (savedLog, variables) => {
      let personalTipSaved = true;
      if (showPersonalTip && isAuthenticated) {
        try {
          const savedPrefs = await machinePreferenceApi.upsert({
            machineCode,
            personalTipMemo: personalTipMemo.trim(),
            ...(activeGymId && activeMemberId
              ? { gymId: activeGymId, memberId: activeMemberId }
              : {}),
          });
          setPersonalTipMemo(savedPrefs.personalTipMemo ?? personalTipMemo.trim());
          void queryClient.invalidateQueries({
            queryKey: ['machine-preferences', machineCode, activeGymId, activeMemberId],
          });
        } catch {
          personalTipSaved = false;
          showToast(t('machines:history.personalTipSaveFailed'), 'error');
        }
      }

      queryClient.setQueryData(workoutLogQueryKey, [savedLog]);
      onSavedChange?.(true);
      queryClient.setQueryData(
        workoutLogsAllKey,
        upsertWorkoutLogInCache(
          queryClient.getQueryData<WorkoutLog[]>(workoutLogsAllKey),
          savedLog,
          removeLogParams
        )
      );
      invalidateLogSideEffects();
      if (personalTipSaved && !variables?.silent) {
        showToast(
          isLogSaved ? t('machines:workoutLog.updated') : t('machines:workoutLog.saved'),
          'success'
        );
      }
    },
    onError: () => {
      const current = queryClient.getQueryData<WorkoutLog[]>(workoutLogQueryKey);
      onSavedChange?.(Boolean(current?.[0]));
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

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

      lastHydrateKeyRef.current = '';
      const snapshot = buildDefaultSnapshot(suggestedWeightKg);
      applyWorkoutFormSnapshot(snapshot, {
        setSetCount,
        setWeights,
        setSetCompleted,
        setDiary,
      });
      setBaseline(null);
      queryClient.setQueryData(workoutLogQueryKey, []);
      onSavedChange?.(false);
      queryClient.setQueryData(
        workoutLogsAllKey,
        removeWorkoutLogFromCache(previousAllLogs, removeLogParams)
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
      invalidateLogSideEffects();
      showToast(t('machines:workoutLog.canceled'), 'success');
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

  const isActionPending = saveMutation.isPending || removeMutation.isPending;

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

  const handleSave = useCallback(() => {
    if (isFreeWeight && !activeTargetMuscle) {
      showToast(t('machines:targetMuscleRequired'), 'error');
      return;
    }
    saveMutation.mutate({});
  }, [activeTargetMuscle, isFreeWeight, saveMutation, showToast, t]);

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
  };

  const handleWeightChange = (index: number, next: number) => {
    setWeights((prev) => {
      const updated = [...prev];
      updated[index] = next >= 0 ? next : 0;
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
    setWeights((prev) => prev.map(() => source));
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
        unlockVoiceCoachAudio();
        setRestTimer({
          setNumber: index + 1,
          seconds: clampRestDurationSeconds(restDurationSeconds),
        });
      } else if (wasCompleted) {
        setRestTimer(null);
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
      unlockVoiceCoachAudio();
      setRestTimer({
        setNumber: index + 1,
        seconds: clampRestDurationSeconds(restDurationSeconds),
      });
    } else if (wasCompleted) {
      setRestTimer(null);
    }

    saveMutation.mutate({ setCompleted: next, silent: true });
  };

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

  const weightList = (
    <div
      className={`recommendation-workout-log__weight-list${
        compact ? ' recommendation-workout-log__weight-list--compact' : ''
      }${isHistory ? ' recommendation-workout-log__weight-list--history' : ''}`}
    >
      {weights.map((weight, index) => {
        const completed = setCompleted[index] ?? false;
        const previousWeight = index > 0 ? weights[index - 1] : undefined;
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
              <button
                type="button"
                className={`recommendation-workout-log__complete-btn${
                  completed ? ' recommendation-workout-log__complete-btn--completed' : ''
                }`}
                onClick={() => handleHistorySetComplete(index)}
                disabled={isActionPending}
                aria-pressed={completed}
              >
                {t('machines:workoutLog.setComplete')}
              </button>
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
      <div className="history-workout-log__diary-tags-pane">
        <span className="history-workout-log__pane-label">{t('machines:history.diaryMemoTitle')}</span>
        {diaryTags}
      </div>
      <div className="history-workout-log__diary-memo-pane">
        <label className="history-workout-log__pane-label" htmlFor={`${idPrefix}-diary`}>
          {t('machines:history.memoLabel')}
        </label>
        <textarea
          id={`${idPrefix}-diary`}
          className="input history-workout-log__memo-input"
          rows={4}
          value={diary}
          placeholder={t('machines:history.memoPlaceholder')}
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

  const personalTipField =
    isHistory && showPersonalTip && isAuthenticated ? (
      <div className="history-workout-log__personal-tip">
        <div className="history-workout-log__personal-tip-header">
          <label className="history-workout-log__pane-label" htmlFor={`${idPrefix}-personal-tip`}>
            {t('machines:history.personalTipTitle')}
          </label>
          <span className="recommendation-workout-log__diary-bytes">
            {t('machines:history.personalTipBytes', { used: personalTipBytes })}
          </span>
        </div>
        <textarea
          id={`${idPrefix}-personal-tip`}
          className="input history-workout-log__memo-input history-workout-log__personal-tip-input"
          rows={3}
          value={personalTipMemo}
          placeholder={t('machines:history.personalTipPlaceholder')}
          onChange={(e) => handlePersonalTipChange(e.target.value)}
          disabled={isActionPending}
        />
        <p className="history-workout-log__personal-tip-hint">
          {t('machines:history.personalTipSaveHint')}
        </p>
      </div>
    ) : null;

  const historyMemoSaveButton = isHistory ? (
    <div className="history-workout-log__memo-save-row">
      <button
        type="button"
        className="btn btn--secondary history-workout-log__memo-save"
        onClick={handleSave}
        disabled={isActionPending || isLoading}
      >
        {saveMutation.isPending ? t('machines:history.memoSaving') : t('machines:history.memoSave')}
      </button>
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

  const restTimerBanner =
    restTimer != null ? (
      <RestTimerBanner
        seconds={restTimer.seconds}
        setNumber={restTimer.setNumber}
        onDismiss={() => setRestTimer(null)}
        onReadyForNextSet={handleRestReadyForNextSet}
      />
    ) : null;

  const voiceCoachPanel = showVoiceCoach ? (
    <VoiceCoachPanel
      enabled={voiceCoachEnabled}
      onEnabledChange={setVoiceCoachEnabled}
      targetReps={voiceCoachTargetReps}
      onTargetRepsChange={setVoiceCoachTargetReps}
      repGapMs={voiceCoachRepGapMs}
      onRepGapMsChange={setVoiceCoachRepGapMs}
      oneMoreEnabled={voiceCoachOneMore}
      onOneMoreChange={setVoiceCoachOneMore}
      oneMoreCount={voiceCoachOneMoreCount}
      onOneMoreCountChange={setVoiceCoachOneMoreCount}
      autoStartAfterRest={voiceCoachAutoAfterRest}
      onAutoStartAfterRestChange={setVoiceCoachAutoAfterRest}
      restTipsEnabled={voiceRestTipsEnabled}
      onRestTipsEnabledChange={setVoiceRestTipsEnabled}
      phase={voiceCoach.phase}
      currentRep={voiceCoach.currentRep}
      countdown={voiceCoach.countdown}
      isRunning={voiceCoach.isRunning}
      onStart={startVoiceCoach}
      onStop={voiceCoach.stop}
      idPrefix={`${idPrefix}-voice-coach`}
      compact={compact}
    />
  ) : null;

  if (isHistory) {
    return (
      <section
        className="recommendation-workout-log recommendation-workout-log--history"
        aria-label={t('machines:workoutLog.title')}
      >
        {restTimerBanner}
        {voiceCoachPanel}
        {targetMusclePicker}
        <div className="history-workout-log__performance">
          <div className="history-workout-log__performance-header">
            <div className="history-workout-log__performance-title-row">
              <span className="history-workout-log__performance-title">
                {t('machines:history.performanceTitle', { count: setCount })}
              </span>
              {setCountControl}
            </div>
            <span className="history-workout-log__edit-label">
              <Pencil size={12} strokeWidth={2.25} className="history-workout-log__edit-icon" aria-hidden />
              {t('machines:history.editSets')}
            </span>
          </div>
          {weightList}
        </div>
        {diaryField}
        {personalTipField}
        {historyMemoSaveButton}
        {showSaveButton ? saveButton : null}
      </section>
    );
  }

  if (compact) {
    return (
      <section
        className="recommendation-workout-log recommendation-workout-log--compact"
        aria-label={t('machines:workoutLog.title')}
      >
        {restTimerBanner}
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
    );
  }

  return (
    <section className="recommendation-workout-log" aria-label={t('machines:workoutLog.title')}>
      {restTimerBanner}
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
            {t('machines:workoutLog.weights')}
          </p>
          {totalWeightSummary}
        </div>
        {weightList}
      </div>

      {diaryField}

      {saveButton}
    </section>
  );
}
