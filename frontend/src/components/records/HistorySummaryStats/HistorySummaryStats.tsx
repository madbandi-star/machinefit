import { useTranslation } from 'react-i18next';
import type { HistorySummaryStats as HistorySummaryStatsData } from '@/utils/historySummaryStats';

interface HistorySummaryStatsProps {
  stats: HistorySummaryStatsData;
}

export function HistorySummaryStats({ stats }: HistorySummaryStatsProps) {
  const { t } = useTranslation('machines');

  const items = [
    {
      key: 'sets',
      label: t('history.summaryTotalSets'),
      value: t('history.summaryTotalSetsValue', { count: stats.totalSets }),
      tone: 'green',
    },
    {
      key: 'weight',
      label: t('history.summaryTotalWeight'),
      value: t('history.summaryTotalWeightValue', {
        weight: stats.totalWeightKg.toLocaleString(),
      }),
      tone: 'blue',
    },
    {
      key: 'volume',
      label: t('history.summaryTotalVolume'),
      value: t('history.summaryTotalVolumeValue', {
        weight: stats.totalVolumeDummyKg.toLocaleString(),
      }),
      tone: 'purple',
      dummy: true,
    },
    {
      key: 'time',
      label: t('history.summaryWorkoutTime'),
      value: t('history.summaryWorkoutTimeValue', { minutes: stats.workoutMinutesDummy }),
      tone: 'orange',
      dummy: true,
    },
  ] as const;

  return (
    <div className="history-summary-stats" aria-label={t('history.summaryLabel')}>
      {items.map((item) => (
        <article
          key={item.key}
          className={`history-summary-stats__card history-summary-stats__card--${item.tone}`}
        >
          <span className="history-summary-stats__label">{item.label}</span>
          <strong className="history-summary-stats__value">{item.value}</strong>
        </article>
      ))}
    </div>
  );
}
