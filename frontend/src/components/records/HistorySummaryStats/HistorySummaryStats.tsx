import { useTranslation } from 'react-i18next';
import { Icon, type IconName } from '@/components/icons/Icon';
import type { HistorySummaryStats as HistorySummaryStatsData } from '@/utils/historySummaryStats';

interface HistorySummaryStatsProps {
  stats: HistorySummaryStatsData;
}

export function HistorySummaryStats({ stats }: HistorySummaryStatsProps) {
  const { t } = useTranslation('machines');

  const items: Array<{
    key: string;
    label: string;
    value: string;
    tone: 'green' | 'blue' | 'purple' | 'orange';
    icon: IconName;
  }> = [
    {
      key: 'sets',
      label: t('history.summaryTotalSets'),
      value: t('history.summaryTotalSetsValue', { count: stats.totalSets }),
      tone: 'green',
      icon: 'weightPlate',
    },
    {
      key: 'weight',
      label: t('history.summaryTotalWeight'),
      value: t('history.summaryTotalWeightValue', {
        weight: stats.totalWeightKg.toLocaleString(),
      }),
      tone: 'blue',
      icon: 'kettlebell',
    },
    {
      key: 'volume',
      label: t('history.summaryTotalVolume'),
      value: t('history.summaryTotalVolumeValue', {
        weight: stats.totalVolumeDummyKg.toLocaleString(),
      }),
      tone: 'purple',
      icon: 'flame',
    },
    {
      key: 'time',
      label: t('history.summaryWorkoutTime'),
      value: t('history.summaryWorkoutTimeValue', { minutes: stats.workoutMinutesDummy }),
      tone: 'orange',
      icon: 'clock',
    },
  ];

  return (
    <div className="history-summary-stats" aria-label={t('history.summaryLabel')}>
      {items.map((item) => (
        <article
          key={item.key}
          className={`history-summary-stats__card history-summary-stats__card--${item.tone}`}
        >
          <div className="history-summary-stats__label-row">
            <Icon
              name={item.icon}
              size={14}
              className={`history-summary-stats__icon history-summary-stats__icon--${item.tone}`}
            />
            <span className="history-summary-stats__label">{item.label}</span>
          </div>
          <strong className="history-summary-stats__value">{item.value}</strong>
        </article>
      ))}
    </div>
  );
}
