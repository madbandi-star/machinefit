import { useTranslation } from 'react-i18next';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import type { DailyPoint } from '@/utils/workoutAnalytics';
import { formatShortDate } from '@/utils/workoutAnalytics';
import { formatFreeWeightRecordLabel } from '@/utils/freeWeightDisplay';
import { CollapsibleCard } from '@/components/progressive-overload/CollapsibleCard/CollapsibleCard';

interface DailyBreakdownListProps {
  days: DailyPoint[];
  locale: string;
}

export function DailyBreakdownList({ days, locale }: DailyBreakdownListProps) {
  const { t } = useTranslation(['common', 'machines']);

  if (days.length === 0) return null;

  const sorted = [...days].reverse();

  const translateMuscleGroup = (group: string) =>
    t(`machines:muscleGroups.${group}`, { defaultValue: group });

  return (
    <CollapsibleCard
      title={t('growthAnalysis.daily.breakdown.title')}
      summary={t('growthAnalysis.daily.breakdown.desc')}
      defaultOpen
      className="growth-analysis-daily-list"
    >
      <ol className="growth-analysis-daily-list__items">
        {sorted.map((day) => (
          <li key={day.logDate} className="growth-analysis-daily-list__item">
            <CollapsibleCard
              title={formatShortDate(day.logDate, locale)}
              summary={
                <span className="growth-analysis-daily-list__volume">
                  {day.totalVolume.toLocaleString()}kg ·{' '}
                  {t('growthAnalysis.daily.breakdown.meta', {
                    machines: day.machineCount,
                    sets: day.totalSets,
                  })}
                </span>
              }
              defaultOpen
              className="growth-analysis-daily-list__day-card collapsible-card--nested"
              bodyClassName="growth-analysis-daily-list__day-body"
            >
              <ul className="growth-analysis-daily-list__machines">
                {day.machines.map((machine) => {
                  const displayName = isFreeWeightMachineCode(machine.machineCode)
                    ? formatFreeWeightRecordLabel(
                        machine.machineName,
                        machine.targetMuscleGroup,
                        translateMuscleGroup
                      )
                    : machine.machineName;

                  return (
                    <li
                      key={`${day.logDate}-${machine.machineCode}-${machine.targetMuscleGroup ?? ''}`}
                    >
                      <span>{displayName}</span>
                      <span>
                        {machine.volume.toLocaleString()}kg,{' '}
                        {t('growthAnalysis.daily.breakdown.contribution', {
                          pct: machine.contributionPct,
                        })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CollapsibleCard>
          </li>
        ))}
      </ol>
    </CollapsibleCard>
  );
}
