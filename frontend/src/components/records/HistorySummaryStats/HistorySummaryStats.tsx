import { useTranslation } from 'react-i18next';
import { Activity, Clock, Dumbbell, Flame } from 'lucide-react';
import type { HistorySummaryStats as HistorySummaryStatsData } from '@/utils/historySummaryStats';
import {
  HistoryMetricCard,
  parseHistoryMetricValue,
  type HistoryMetricTone,
} from '@/components/records/history-ui/HistoryMetricCard';
import { HistorySectionHeader } from '@/components/records/history-ui/HistorySectionHeader';

interface HistorySummaryStatsProps {
  stats: HistorySummaryStatsData;
}

export function HistorySummaryStats({ stats }: HistorySummaryStatsProps) {
  const { t } = useTranslation('machines');

  const items: Array<{
    key: string;
    label: string;
    rawValue: string;
    tone: HistoryMetricTone;
    icon: typeof Activity;
  }> = [
    {
      key: 'sets',
      label: t('history.summaryTotalSets'),
      rawValue: t('history.summaryTotalSetsValue', { count: stats.totalSets }),
      tone: 'green',
      icon: Activity,
    },
    {
      key: 'weight',
      label: t('history.summaryTotalWeight'),
      rawValue: t('history.summaryTotalWeightValue', {
        weight: stats.totalWeightKg.toLocaleString(),
      }),
      tone: 'blue',
      icon: Dumbbell,
    },
    {
      key: 'volume',
      label: t('history.summaryTotalVolume'),
      rawValue: t('history.summaryTotalVolumeValue', {
        weight: stats.totalVolumeDummyKg.toLocaleString(),
      }),
      tone: 'purple',
      icon: Flame,
    },
    {
      key: 'time',
      label: t('history.summaryWorkoutTime'),
      rawValue: t('history.summaryWorkoutTimeValue', { minutes: stats.workoutMinutesDummy }),
      tone: 'orange',
      icon: Clock,
    },
  ];

  return (
    <section className="history-dashboard" aria-label={t('history.summaryLabel')}>
      <HistorySectionHeader
        title={t('history.dashboardTitle')}
        icon={<Activity size={15} strokeWidth={2.25} aria-hidden />}
      />
      <div className="history-dashboard__grid">
        {items.map((item) => {
          const { main, unit } = parseHistoryMetricValue(item.rawValue);
          return (
            <HistoryMetricCard
              key={item.key}
              label={item.label}
              valueMain={main}
              valueUnit={unit}
              tone={item.tone}
              icon={item.icon}
            />
          );
        })}
      </div>
    </section>
  );
}
