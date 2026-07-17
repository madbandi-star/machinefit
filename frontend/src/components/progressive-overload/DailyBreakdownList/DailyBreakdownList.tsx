import { useTranslation } from 'react-i18next';
import type { DailyPoint } from '@/utils/workoutAnalytics';
import { formatShortDate } from '@/utils/workoutAnalytics';

interface DailyBreakdownListProps {
  days: DailyPoint[];
  locale: string;
}

export function DailyBreakdownList({ days, locale }: DailyBreakdownListProps) {
  const { t } = useTranslation('common');

  if (days.length === 0) return null;

  const sorted = [...days].reverse();

  return (
    <section className="card growth-analysis-daily-list">
      <h2>{t('growthAnalysis.daily.breakdown.title')}</h2>
      <p className="growth-analysis-chart-section__desc">
        {t('growthAnalysis.daily.breakdown.desc')}
      </p>
      <ol className="growth-analysis-daily-list__items">
        {sorted.map((day) => (
          <li key={day.logDate} className="growth-analysis-daily-list__item">
            <div className="growth-analysis-daily-list__head">
              <strong>{formatShortDate(day.logDate, locale)}</strong>
              <span className="growth-analysis-daily-list__volume">
                {day.totalVolume.toLocaleString()}kg
              </span>
            </div>
            <p className="growth-analysis-daily-list__meta">
              {t('growthAnalysis.daily.breakdown.meta', {
                machines: day.machineCount,
                sets: day.totalSets,
              })}
            </p>
            <ul className="growth-analysis-daily-list__machines">
              {day.machines.map((machine) => (
                <li key={`${day.logDate}-${machine.machineCode}`}>
                  <span>{machine.machineName}</span>
                  <span>{machine.volume.toLocaleString()}kg</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
