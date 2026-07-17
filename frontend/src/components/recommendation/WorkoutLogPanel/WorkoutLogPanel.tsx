import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { workoutLogApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { formatHistoryDateHeader, getTodayDateKey } from '@/utils/historyDate';
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

export function WorkoutLogPanel({
  machineCode,
  recommendationId,
  suggestedWeightKg,
  isAuthenticated,
}: WorkoutLogPanelProps) {
  const { t } = useTranslation(['machines', 'common']);
  const locale = useSettingsStore((s) => s.locale);
  const location = useLocation();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const logDate = useMemo(() => getTodayDateKey(), []);

  const [setCount, setSetCount] = useState(DEFAULT_SET_COUNT);
  const [weights, setWeights] = useState<number[]>(() =>
    buildDefaultWeights(DEFAULT_SET_COUNT, suggestedWeightKg)
  );
  const [initialized, setInitialized] = useState(false);

  const { data: existingLogs, isLoading } = useQuery({
    queryKey: QUERY_KEYS.workoutLogToday(machineCode, logDate),
    queryFn: async () => {
      const res = await workoutLogApi.list({ machineCode, logDate });
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  const existingLog = existingLogs?.[0];

  useEffect(() => {
    if (!isAuthenticated || isLoading || initialized) return;

    if (existingLog) {
      setSetCount(existingLog.setCount);
      setWeights(existingLog.setWeightsKg);
    } else {
      setSetCount(DEFAULT_SET_COUNT);
      setWeights(buildDefaultWeights(DEFAULT_SET_COUNT, suggestedWeightKg));
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
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutLogs });
      showToast(t('machines:workoutLog.saved'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

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

  if (!isAuthenticated) {
    return (
      <section className="recommendation-workout-log" aria-label={t('machines:workoutLog.title')}>
        <p className="recommendation-workout-log__login-hint">
          {t('machines:workoutLog.loginRequired')}
        </p>
        <Link to={ROUTES.LOGIN} state={{ from: location }} className="btn btn--secondary btn--block">
          {t('machines:recommendLogin')}
        </Link>
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
        <label className="recommendation-workout-log__field-label" htmlFor="workout-set-count">
          {t('machines:workoutLog.setCount')}
        </label>
        <div className="recommendation-workout-log__set-count-row">
          <button
            type="button"
            className="recommendation-workout-log__stepper"
            aria-label={t('machines:workoutLog.decreaseSets')}
            onClick={() => handleSetCountChange(setCount - 1)}
            disabled={setCount <= MIN_SET_COUNT || saveMutation.isPending}
          >
            −
          </button>
          <input
            id="workout-set-count"
            className="input recommendation-workout-log__set-input"
            type="number"
            min={MIN_SET_COUNT}
            max={MAX_SET_COUNT}
            value={setCount}
            onChange={(e) => handleSetCountChange(Number.parseInt(e.target.value, 10) || MIN_SET_COUNT)}
            disabled={saveMutation.isPending}
          />
          <button
            type="button"
            className="recommendation-workout-log__stepper"
            aria-label={t('machines:workoutLog.increaseSets')}
            onClick={() => handleSetCountChange(setCount + 1)}
            disabled={setCount >= MAX_SET_COUNT || saveMutation.isPending}
          >
            +
          </button>
        </div>
      </div>

      <div className="recommendation-workout-log__weights">
        <p className="recommendation-workout-log__field-label">{t('machines:workoutLog.weights')}</p>
        <div className="recommendation-workout-log__weight-grid">
          {weights.map((weight, index) => (
            <div key={index} className="setting-value-card setting-value-card--compact recommendation-workout-log__weight-card">
              <label
                className="setting-value-card__label"
                htmlFor={`workout-weight-${index}`}
              >
                {t('machines:workoutLog.setLabel', { number: index + 1 })}
              </label>
              <div className="setting-value-card__value-row">
                <input
                  id={`workout-weight-${index}`}
                  className="input recommendation-workout-log__weight-input"
                  type="number"
                  min={0}
                  step="0.5"
                  inputMode="decimal"
                  value={weight === 0 ? '' : weight}
                  placeholder="0"
                  onChange={(e) => handleWeightChange(index, e.target.value)}
                  disabled={saveMutation.isPending}
                />
                <span className="setting-value-card__unit">kg</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="btn btn--primary btn--block recommendation-workout-log__save"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending || isLoading}
      >
        {saveMutation.isPending ? t('machines:workoutLog.saving') : t('machines:workoutLog.save')}
      </button>
    </section>
  );
}
