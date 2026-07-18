import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { workoutReportApi, type WorkoutReportPeriod } from '@/api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';

const PERIODS: WorkoutReportPeriod[] = ['day', 'week', 'month', 'year'];

export function WorkoutReportSection() {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const [period, setPeriod] = useState<WorkoutReportPeriod>('week');

  const mutation = useMutation({
    mutationFn: () => workoutReportApi.send({ period }),
    onSuccess: () => showToast(t('workoutReport.sent'), 'success'),
    onError: () => showToast(t('workoutReport.failed'), 'error'),
  });

  return (
    <section className="form-section workout-report-section">
      <h3 className="form-section__title">{t('workoutReport.title')}</h3>
      <p className="form-section__desc">{t('workoutReport.desc')}</p>

      <label className="workout-report-section__field">
        {t('workoutReport.periodLabel')}
        <select
          className="input"
          value={period}
          onChange={(e) => setPeriod(e.target.value as WorkoutReportPeriod)}
        >
          {PERIODS.map((value) => (
            <option key={value} value={value}>
              {t(`workoutReport.periods.${value}`)}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? t('workoutReport.sending') : t('workoutReport.send')}
      </button>
    </section>
  );
}
