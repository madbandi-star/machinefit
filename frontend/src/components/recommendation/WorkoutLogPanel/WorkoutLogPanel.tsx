import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUtf8ByteLength, recommendRestSeconds, truncateUtf8, WORKOUT_DIARY_MAX_BYTES, isFreeWeightMachineCode, type TargetMuscleGroup, type WorkoutLog } from '@machinefit/shared';
import { workoutLogApi } from '@/api';
import { RestTimerBanner } from '@/components/recommendation/RestTimerBanner/RestTimerBanner';
import { Check, Pencil } from 'lucide-react';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { useAuthStore } from '@/store/auth.store';
import { formatHistoryDateHeader, getTodayDateKey, normalizeDateKey } from '@/utils/historyDate';
import { computeVolume } from '@/utils/workoutAnalytics';
import { useSettingsStore } from '@/store/settings.store';
import { WORKOUT_DIARY_TAGS, formatDiaryTag } from '@/constants/workout-diary-tags';
import { NumericStepper } from '@/components/form/NumericStepper/NumericStepper';
import { WeightStepper } from '@/components/form/WeightStepper/WeightStepper';
import { getWeightStepKg } from '@/utils/weightStep';
import { removeWorkoutLogFromCache } from '@/utils/workoutLogCache';
import '@/styles/recommendation.css';

const DEFAULT_SET_COUNT = 3;
const MIN_SET_COUNT = 1;
const MAX_SET_COUNT = 20;

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
  onControlReady?: (control: WorkoutLogPanelControl | null) => void;
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

function formatTotalWeightKg(total: number): string {
  return total.toLocaleString(undefined, { maximumFractionDigits: 1 });
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
  onControlReady,
}: WorkoutLogPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const locale = useSettingsStore((s) => s.locale);
  const location = useLocation();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const workoutGoal = useAuthStore((s) => s.user?.workoutGoal);
  const isHistory = variant === 'history';
  const compact = variant === 'compact' || isHistory;
  const logDate = normalizeDateKey(logDateProp ?? getTodayDateKey());
  const setCountInputId = `${idPrefix}-set-count`;
  const weightStepKg = getWeightStepKg(machineCode);
  const isFreeWeight = isFreeWeightMachineCode(machineCode);
  const [selectedMuscle, setSelectedMuscle] = useState<TargetMuscleGroup | null>(
    targetMuscleGroup ?? null
  );
  const activeTargetMuscle = selectedMuscle ?? targetMuscleGroup ?? null;

  const [setCount, setSetCount] = useState(DEFAULT_SET_COUNT);
  const [weights, setWeights] = useState<number[]>(() =>
    buildDefaultWeights(DEFAULT_SET_COUNT, suggestedWeightKg)
  );
  const [setCompleted, setSetCompleted] = useState<boolean[]>(() =>
    buildDefaultCompleted(DEFAULT_SET_COUNT)
  );
  const [diary, setDiary] = useState('');
  const [diaryExpanded, setDiaryExpanded] = useState(diaryDefaultOpen);
  const [baseline, setBaseline] = useState<WorkoutFormSnapshot | null>(null);
  const lastHydrateKeyRef = useRef('');
  const [restTimer, setRestTimer] = useState<{ setNumber: number; seconds: number } | null>(null);
  const diaryBytes = getUtf8ByteLength(diary);
  const queryEnabled = isAuthenticated && (!isFreeWeight || !!activeTargetMuscle);

  const { data: existingLogs, isLoading, isFetched } = useQuery({
    queryKey: QUERY_KEYS.workoutLogToday(machineCode, logDate, activeTargetMuscle ?? undefined),
    queryFn: async () => {
      const res = await workoutLogApi.list({
        machineCode,
        logDate,
        ...(isFreeWeight && activeTargetMuscle
          ? { targetMuscleGroup: activeTargetMuscle }
          : {}),
      });
      return res.data.data;
    },
    enabled: queryEnabled,
  });

  const existingLog = existingLogs?.[0];
  const isLogSaved = Boolean(existingLog);
  const totalWeightKg = useMemo(() => computeVolume(weights), [weights]);
  const hydrateKey = `${machineCode}|${logDate}|${activeTargetMuscle ?? ''}|${existingLog?.id ?? 'new'}|${existingLog?.updatedAt ?? ''}`;

  const isDirty =
    isLogSaved &&
    baseline !== null &&
    (setCount !== baseline.setCount ||
      !weightsEqual(weights, baseline.weights) ||
      !booleansEqual(setCompleted, baseline.setCompleted) ||
      diary.trim() !== baseline.diary.trim());

  const invalidateLogQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogsAll });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
    await queryClient.invalidateQueries({ queryKey: ['workout-logs', 'insights'] });
    await queryClient.invalidateQueries({ queryKey: ['workout-logs', machineCode, logDate] });
  };

  const invalidateLogSideEffects = async (options?: { skipWorkoutLogsAll?: boolean }) => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
    if (!options?.skipWorkoutLogsAll) {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogsAll });
    }
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
    await queryClient.invalidateQueries({ queryKey: ['workout-logs', 'insights'] });
  };

  const workoutLogQueryKey = QUERY_KEYS.workoutLogToday(
    machineCode,
    logDate,
    activeTargetMuscle ?? undefined
  );
  const workoutLogsAllKey = QUERY_KEYS.workoutLogsAll;
  const removeLogParams = {
    machineCode,
    logDate,
    targetMuscleGroup: isFreeWeight && activeTargetMuscle ? activeTargetMuscle : undefined,
  };

  useEffect(() => {
    lastHydrateKeyRef.current = '';
    setBaseline(null);
    setSelectedMuscle(targetMuscleGroup ?? null);
  }, [machineCode, logDate, recommendationId, targetMuscleGroup]);

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
  }, [
    isAuthenticated,
    queryEnabled,
    isFetched,
    hydrateKey,
    existingLog,
    suggestedWeightKg,
  ]);

  const saveMutation = useMutation({
    mutationFn: () =>
      workoutLogApi.upsert({
        machineCode,
        logDate,
        setCount,
        setWeightsKg: weights,
        setCompleted,
        diary: diary.trim() || undefined,
        ...(recommendationId ? { recommendationId } : {}),
        ...(isFreeWeight && activeTargetMuscle
          ? { targetMuscleGroup: activeTargetMuscle }
          : {}),
      }),
    onSuccess: async () => {
      await invalidateLogQueries();
      showToast(
        isLogSaved ? t('machines:workoutLog.updated') : t('machines:workoutLog.saved'),
        'success'
      );
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: () =>
      workoutLogApi.remove({
        machineCode,
        logDate,
        ...(isFreeWeight && activeTargetMuscle
          ? { targetMuscleGroup: activeTargetMuscle }
          : {}),
      }),
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
      queryClient.setQueryData(
        workoutLogsAllKey,
        removeWorkoutLogFromCache(previousAllLogs, removeLogParams)
      );

      return { previousLogs, previousAllLogs };
    },
    onSuccess: async () => {
      queryClient.setQueryData(workoutLogQueryKey, []);
      queryClient.setQueryData(
        workoutLogsAllKey,
        removeWorkoutLogFromCache(
          queryClient.getQueryData<WorkoutLog[]>(workoutLogsAllKey),
          removeLogParams
        )
      );
      await invalidateLogSideEffects({ skipWorkoutLogsAll: true });
      showToast(t('machines:workoutLog.canceled'), 'success');
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLogs !== undefined) {
        queryClient.setQueryData(workoutLogQueryKey, context.previousLogs);
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
    saveMutation.mutate();
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
        const seconds = recommendRestSeconds({
          workoutGoal,
          setIndex: index,
          weightKg: weights[index],
        });
        setRestTimer({ setNumber: index + 1, seconds });
      }

      return next;
    });
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
                onClick={() => handleToggleSetCompleted(index)}
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
        <span className="history-workout-log__pane-label">{t('machines:workoutLog.diaryTitle')}</span>
        {diaryTags}
      </div>
      <div className="history-workout-log__diary-memo-pane">
        <span className="history-workout-log__pane-label">{t('machines:history.memoLabel')}</span>
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
        {formatTotalWeightKg(totalWeightKg)}kg
      </strong>
    </div>
  );

  const restTimerBanner =
    restTimer != null ? (
      <RestTimerBanner
        seconds={restTimer.seconds}
        setNumber={restTimer.setNumber}
        onDismiss={() => setRestTimer(null)}
      />
    ) : null;

  if (isHistory) {
    return (
      <section
        className="recommendation-workout-log recommendation-workout-log--history"
        aria-label={t('machines:workoutLog.title')}
      >
        {restTimerBanner}
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
        {targetMusclePicker}
        <div className="recommendation-workout-log__toolbar">
          <span className="recommendation-workout-log__title">{t('machines:workoutLog.title')}</span>
          {setCountControl}
          <span className="recommendation-workout-log__toolbar-total">
            {formatTotalWeightKg(totalWeightKg)}kg
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
