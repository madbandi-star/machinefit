import { useTranslation } from 'react-i18next';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import '@/styles/machines.css';

interface FilterChipsProps {
  value: string | null;
  onChange: (muscleGroup: string | null) => void;
}

const MUSCLE_ICON_SIZE = 44;

export function FilterChips({ value, onChange }: FilterChipsProps) {
  const { t } = useTranslation('machines');

  return (
    <div className="filter-chips" role="group" aria-label={t('filterByMuscle')}>
      <button
        type="button"
        className={`filter-chip${value === null ? ' filter-chip--active' : ''}`}
        onClick={() => onChange(null)}
      >
        {t('filterAll')}
      </button>
      {MUSCLE_GROUPS.map((group) => {
        const label = t(`muscleGroups.${group}`);
        return (
          <button
            key={group}
            type="button"
            className={`filter-chip filter-chip--icon-only${value === group ? ' filter-chip--active' : ''}`}
            onClick={() => onChange(value === group ? null : group)}
            aria-label={label}
            title={label}
          >
            <MuscleGroupIcon group={group} size={MUSCLE_ICON_SIZE} className="filter-chip__icon" />
          </button>
        );
      })}
    </div>
  );
}
