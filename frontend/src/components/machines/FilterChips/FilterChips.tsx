import { useTranslation } from 'react-i18next';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import '@/styles/machines.css';

interface FilterChipsProps {
  value: string | null;
  onChange: (muscleGroup: string | null) => void;
}

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
      {MUSCLE_GROUPS.map((group) => (
        <button
          key={group}
          type="button"
          className={`filter-chip${value === group ? ' filter-chip--active' : ''}`}
          onClick={() => onChange(value === group ? null : group)}
        >
          <MuscleGroupIcon group={group} size={22} className="filter-chip__icon" />
          <span>{t(`muscleGroups.${group}`)}</span>
        </button>
      ))}
    </div>
  );
}
