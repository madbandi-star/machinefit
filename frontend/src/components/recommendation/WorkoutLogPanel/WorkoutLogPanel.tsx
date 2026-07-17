import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getUtf8ByteLength, truncateUtf8, WORKOUT_DIARY_MAX_BYTES } from '@machinefit/shared';
import { workoutLogApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { formatHistoryDateHeader, getTodayDateKey, normalizeDateKey } from '@/utils/historyDate';
import { computeVolume } from '@/utils/workoutAnalytics';
import { useSettingsStore } from '@/store/settings.store';
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

export function WorkoutLogPanel({
  machineCode,
  recommendationId,
  suggestedWeightKg,
  isAuthenticated,
  variant = 'default',
  logDate: logDateProp,
  idPrefix = 'workout',
}: WorkoutLogPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const locale = useSettingsStore((s) => s.locale);
  const location = useLocation();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const compact = variant === 'compact';
  const logDate = normalizeDateKey(logDateProp ?? getTodayDateKey());
  const setCountInputId = `${idPrefix}-set-count`;

  const [setCount, setSetCount] = useState(DEFAULT_SET_COUNT);
  const [weights, setWeights] = useState<number[]>(() =>
    buildDefaultWeights(DEFAULT_SET_COUNT, suggestedWeightKg)
  );
  const [diary, setDiary] = useState('');
  const [initialized, setInitialized] = useState(false);
  const diaryBytes = getUtf8ByteLength(diary);

  const { data: existingLogs, isLoading } = useQuery({
    queryKey: QUERY_KEYS.workoutLogToday(machineCode, logDate),
    queryFn: async () => {
      const res = await workoutLogApi.list({ machineCode, logDate });
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  const existingLog = existingLogs?.[0];
  const isLogSaved = Boolean(existingLog);
  const totalWeightKg = useMemo(() => computeVolume(weights), [weights]);

  const invalidateLogQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogsAll });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
    await queryClient.invalidateQueries({ queryKey: ['workout-logs', 'insights'] });
  };

  useEffect(() => {
    setInitialized(false);
  }, [machineCode, logDate, recommendationId]);

  useEffect(() => {
    if (!isAuthenticated || isLoading || initialized) return;

    if (existingLog) {
      setSetCount(existingLog.setCount);
      setWeights(existingLog.setWeightsKg);
      setDiary(existingLog.diary ?? '');
    } else {
      setSetCount(DEFAULT_SET_COUNT);
      setWeights(buildDefaultWeights(DEFAULT_SET_COUNT, suggestedWeightKg));
      setDiary('');
    }

    setInitialized(true);
  }, [existingLog, initialized, isAuthenticated, isLoading, suggestedWeightKg]);

  const saveMutation = useMutation({
    mutationFn: () =>
      workoutLogApi.upsert({
        machineCode,
        recommendationId,
        logDate,
        setCount,
        setWeightsKg: weights,
        diary: diary.trim() || undefined,
      }),
    onSuccess: async () => {
      await invalidateLogQueries();
      showToast(t('machines:workoutLog.saved'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const removeMutation = useMutation({
    mutationFn: () => workoutLogApi.remove({ machineCode, logDate }),
    onSuccess: async () => {
      setInitialized(false);
      await invalidateLogQueries();
      showToast(t('machines:workoutLog.canceled'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const isActionPending = saveMutation.isPending || removeMutation.isPending;

  const handleLogAction = () => {
    if (isLogSaved) {
      removeMutation.mutate();
      return;
    }
    saveMutation.mutate();
  };

  const handleSetCountChange = (value: number) => {
    const next = Math.min(MAX_SET_COUNT, Math.max(MIN_SET_COUNT, value));
    setSetCount(next);
    setWeights((prev) => resizeWeights(prev, next, suggestedWeightKg));
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
      {weights.map((weight, index) => (
        <div
          key={index}
          className="setting-value-card setting-value-card--compact recommendation-workout-log__weight-card"
        >
          <label className="setting-value-card__label" htmlFor={`${idPrefix}-weight-${index}`}>
            {t('machines:workoutLog.setLabel', { number: index + 1 })}
          </label>
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
      ))}
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

  const saveButton = (
    <button
      type="button"
      className={[
        'btn recommendation-workout-log__save',
        compact ? ' recommendation-workout-log__save--compact btn--block' : ' btn--block',
        isLogSaved ? 'btn--secondary recommendation-workout-log__save--saved' : 'btn--primary',
      ].join('')}
      onClick={handleLogAction}
      disabled={isActionPending || isLoading}
      aria-pressed={isLogSaved}
    >
      {isActionPending
        ? isLogSaved
          ? t('machines:workoutLog.canceling')
          : t('machines:workoutLog.saving')
        : isLogSaved
          ? t('machines:workoutLog.cancel')
          : t('machines:workoutLog.save')}
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

  if (compact) {
    return (
      <section
        className="recommendation-workout-log recommendation-workout-log--compact"
        aria-label={t('machines:workoutLog.title')}
      >
        <div className="recommendation-workout-log__toolbar">
          <span className="recommendation-workout-log__title">{t('machines:workoutLog.title')}</span>
          {setCountControl}
        </div>
        <div className="recommendation-workout-log__weights">
          {weightGrid}
        </div>
        {totalWeightSummary}
        {diaryField}
        {saveButton}
      </section>
    );
  }

  return (
    <section className="recommendation-workout-log" aria-label={t('machines:workoutLog.title')}>
      <div className="recommendation-workout-log__header">
        <span className="recommendation-collapsible__label">{t('machines:workoutLog.title')}</span>
        <span className="recommendation-workout-log__date">
          {formatHistoryDateHeader(logDate, locale)}
        </span>
      </div>

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
