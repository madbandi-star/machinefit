import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUtf8ByteLength, recommendRestSeconds, truncateUtf8, WORKOUT_DIARY_MAX_BYTES, isFreeWeightMachineCode, type TargetMuscleGroup } from '@machinefit/shared';
import { workoutLogApi } from '@/api';
import { RestTimerBanner } from '@/components/recommendation/RestTimerBanner/RestTimerBanner';
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
import '@/styles/recommendation.css';

const DEFAULT_SET_COUNT = 3;
const MIN_SET_COUNT = 1;
const MAX_SET_COUNT = 20;

interface WorkoutLogPanelProps {
  machineCode: string;
  recommendationId: string;
  suggestedWeightKg?: number;
  isAuthenticated: boolean;
  variant?: 'default' | 'compact';
  logDate?: string;
  idPrefix?: string;
  targetMuscleGroup?: TargetMuscleGroup;
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

export function WorkoutLogPanel({
  machineCode,
  recommendationId,
  suggestedWeightKg,
  isAuthenticated,
  variant = 'default',
  logDate: logDateProp,
  idPrefix = 'workout',
  targetMuscleGroup,
}: WorkoutLogPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const locale = useSettingsStore((s) => s.locale);
  const location = useLocation();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const workoutGoal = useAuthStore((s) => s.user?.workoutGoal);
  const compact = variant === 'compact';
  const logDate = normalizeDateKey(logDateProp ?? getTodayDateKey());
  const setCountInputId = `${idPrefix}-set-count`;
  const isFreeWeight = isFreeWeightMachineCode(machineCode);
  const [selectedMuscle, setSelectedMuscle] = useState<TargetMuscleGroup | null>(
    targetMuscleGroup ?? null
  );
  const activeTargetMuscle = targetMuscleGroup ?? selectedMuscle;

  const [setCount, setSetCount] = useState(DEFAULT_SET_COUNT);
  const [weights, setWeights] = useState<number[]>(() =>
    buildDefaultWeights(DEFAULT_SET_COUNT, suggestedWeightKg)
  );
  const [setCompleted, setSetCompleted] = useState<boolean[]>(() =>
    buildDefaultCompleted(DEFAULT_SET_COUNT)
  );
  const [diary, setDiary] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [restTimer, setRestTimer] = useState<{ setNumber: number; seconds: number } | null>(null);
  const diaryBytes = getUtf8ByteLength(diary);

  const { data: existingLogs, isLoading } = useQuery({
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
    enabled: isAuthenticated && (!isFreeWeight || !!activeTargetMuscle),
  });

  const existingLog = existingLogs?.[0];
  const isLogSaved = Boolean(existingLog);
  const totalWeightKg = useMemo(() => computeVolume(weights), [weights]);

  const savedSnapshot = useMemo(
    () => ({
      setCount: existingLog?.setCount ?? DEFAULT_SET_COUNT,
      weights: existingLog?.setWeightsKg ?? buildDefaultWeights(DEFAULT_SET_COUNT, suggestedWeightKg),
      setCompleted:
        existingLog?.setCompleted ??
        buildDefaultCompleted(existingLog?.setCount ?? DEFAULT_SET_COUNT),
      diary: existingLog?.diary ?? '',
    }),
    [existingLog, suggestedWeightKg]
  );

  const isDirty =
    isLogSaved &&
    initialized &&
    (setCount !== savedSnapshot.setCount ||
      JSON.stringify(weights) !== JSON.stringify(savedSnapshot.weights) ||
      JSON.stringify(setCompleted) !== JSON.stringify(savedSnapshot.setCompleted) ||
      diary !== savedSnapshot.diary);

  const invalidateLogQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogsAll });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
    await queryClient.invalidateQueries({ queryKey: ['workout-logs', 'insights'] });
  };

  useEffect(() => {
    setInitialized(false);
    setSelectedMuscle(targetMuscleGroup ?? null);
  }, [machineCode, logDate, recommendationId, targetMuscleGroup]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || initialized) return;

    if (existingLog) {
      setSetCount(existingLog.setCount);
      setWeights(existingLog.setWeightsKg);
      setSetCompleted(
        existingLog.setCompleted ?? buildDefaultCompleted(existingLog.setCount)
      );
      setDiary(existingLog.diary ?? '');
    } else {
      setSetCount(DEFAULT_SET_COUNT);
      setWeights(buildDefaultWeights(DEFAULT_SET_COUNT, suggestedWeightKg));
      setSetCompleted(buildDefaultCompleted(DEFAULT_SET_COUNT));
      setDiary('');
    }

    setInitialized(true);
  }, [existingLog, initialized, isAuthenticated, isLoading, suggestedWeightKg]);

  useEffect(() => {
    setInitialized(false);
  }, [activeTargetMuscle]);

  const saveMutation = useMutation({
    mutationFn: () =>
      workoutLogApi.upsert({
        machineCode,
        recommendationId,
        logDate,
        setCount,
        setWeightsKg: weights,
        setCompleted,
        diary: diary.trim() || undefined,
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
    onSuccess: async () => {
      setInitialized(false);
      await invalidateLogQueries();
      showToast(t('machines:workoutLog.canceled'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const isActionPending = saveMutation.isPending || removeMutation.isPending;

  const targetMusclePicker =
    isFreeWeight && !targetMuscleGroup ? (
      <div className="recommendation-workout-log__muscle-picker" role="group" aria-label={t('machines:targetMuscleLabel')}>
        <p className="recommendation-workout-log__field-label">{t('machines:targetMuscleLabel')}</p>
        <div className="filter-chips">
          {MUSCLE_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              className={`filter-chip${activeTargetMuscle === group ? ' filter-chip--active' : ''}`}
              onClick={() => setSelectedMuscle(group)}
              disabled={isActionPending}
            >
              <MuscleGroupIcon group={group} size={22} className="filter-chip__icon" />
              <span>{t(`machines:muscleGroups.${group}`)}</span>
            </button>
          ))}
        </div>
      </div>
    ) : null;

  const handleSave = () => {
    if (isFreeWeight && !activeTargetMuscle) {
      showToast(t('machines:targetMuscleRequired'), 'error');
      return;
    }
    saveMutation.mutate();
  };

  const handleRemoveLog = () => {
    removeMutation.mutate();
  };

  const handleSetCountChange = (value: number) => {
    const next = Math.min(MAX_SET_COUNT, Math.max(MIN_SET_COUNT, value));
    setSetCount(next);
    setWeights((prev) => resizeWeights(prev, next, suggestedWeightKg));
    setSetCompleted((prev) => resizeCompleted(prev, next));
  };

  const handleWeightChange = (index: number, raw: string) => {
    const parsed = raw === '' ? 0 : Number.parseFloat(raw);
    setWeights((prev) => {
      const next = [...prev];
      next[index] = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
      return next;
    });
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

  const setCountControl = (
    <div className="recommendation-workout-log__set-count-row">
      <button
        type="button"
        className="recommendation-workout-log__stepper"
        aria-label={t('machines:workoutLog.decreaseSets')}
        onClick={() => handleSetCountChange(setCount - 1)}
        disabled={setCount <= MIN_SET_COUNT || isActionPending}
      >
        -
      </button>
      {compact ? (
        <span
          className="recommendation-workout-log__set-value"
          aria-label={t('machines:workoutLog.setCount')}
        >
          {setCount}
        </span>
      ) : (
        <input
          id={setCountInputId}
          className="input recommendation-workout-log__set-input"
          type="number"
          min={MIN_SET_COUNT}
          max={MAX_SET_COUNT}
          value={setCount}
          onChange={(e) => handleSetCountChange(Number.parseInt(e.target.value, 10) || MIN_SET_COUNT)}
          disabled={isActionPending}
          aria-label={t('machines:workoutLog.setCount')}
        />
      )}
      <button
        type="button"
        className="recommendation-workout-log__stepper"
        aria-label={t('machines:workoutLog.increaseSets')}
        onClick={() => handleSetCountChange(setCount + 1)}
        disabled={setCount >= MAX_SET_COUNT || isActionPending}
      >
        +
      </button>
    </div>
  );

  const weightGrid = (
    <div className="recommendation-workout-log__weight-grid">
      {weights.map((weight, index) => {
        const completed = setCompleted[index] ?? false;
        return (
          <div
            key={index}
            className={`setting-value-card setting-value-card--compact recommendation-workout-log__weight-card${
              completed ? ' recommendation-workout-log__weight-card--completed' : ''
            }`}
          >
            <button
              type="button"
              className={`recommendation-workout-log__set-toggle${
                completed ? ' recommendation-workout-log__set-toggle--completed' : ''
              }`}
              onClick={() => handleToggleSetCompleted(index)}
              disabled={isActionPending}
              aria-pressed={completed}
              aria-label={t('machines:workoutLog.setLabel', { number: index + 1 })}
            >
              {t('machines:workoutLog.setLabel', { number: index + 1 })}
            </button>
            <div className="setting-value-card__value-row">
              <input
                id={`${idPrefix}-weight-${index}`}
                className="input recommendation-workout-log__weight-input"
                type="number"
                min={0}
                step="0.5"
                inputMode="decimal"
                value={weight === 0 ? '' : weight}
                placeholder="0"
                onChange={(e) => handleWeightChange(index, e.target.value)}
                disabled={isActionPending}
              />
              <span className="setting-value-card__unit">kg</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  const diaryField = (
    <div className="recommendation-workout-log__diary">
      <div className="recommendation-workout-log__diary-header">
        <label className="recommendation-workout-log__field-label" htmlFor={`${idPrefix}-diary`}>
          {t('machines:workoutLog.diaryTitle')}
        </label>
        <span className="recommendation-workout-log__diary-bytes">
          {t('machines:workoutLog.diaryBytes', { used: diaryBytes })}
        </span>
      </div>
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
      <textarea
        id={`${idPrefix}-diary`}
        className="input recommendation-workout-log__diary-input"
        rows={compact ? 2 : 3}
        value={diary}
        placeholder={t('machines:workoutLog.diaryPlaceholder')}
        onChange={(e) => handleDiaryChange(e.target.value)}
        disabled={isActionPending}
      />
    </div>
  );

  const saveButton = isLogSaved ? (
    <div className="recommendation-workout-log__actions">
      {isDirty ? (
        <button
          type="button"
          className={[
            'btn recommendation-workout-log__save btn--primary',
            compact ? ' recommendation-workout-log__save--compact btn--block' : ' btn--block',
          ].join('')}
          onClick={handleSave}
          disabled={isActionPending || isLoading}
        >
          {saveMutation.isPending ? t('machines:workoutLog.updating') : t('machines:workoutLog.update')}
        </button>
      ) : null}
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
        </div>
        <div className="recommendation-workout-log__weights">{weightGrid}</div>
        {totalWeightSummary}
        {diaryField}
        {saveButton}
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
        {weightGrid}
      </div>

      {diaryField}

      {saveButton}
    </section>
  );
}
