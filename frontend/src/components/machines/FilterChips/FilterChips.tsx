import { useTranslation } from 'react-i18next';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import '@/styles/machines.css';

interface FilterChipsProps {
  value: string;
  onChange: (muscleGroup: string) => void;
}

const MUSCLE_ICON_SIZE = 44;

export function FilterChips({ value, onChange }: FilterChipsProps) {
  const { t } = useTranslation('machines');
  const sectionTitle = t('muscleSectionTitle');

  return (
    <section className="filter-section" aria-labelledby="search-muscle-section-title">
      <h2 id="search-muscle-section-title" className="filter-section__title">
        {sectionTitle}
      </h2>
      <div className="filter-chips" role="group" aria-label={t('filterByMuscle')}>
        {MUSCLE_GROUPS.map((group) => {
          const label = t(`muscleGroups.${group}`);
          return (
            <button
              key={group}
              type="button"
              className={`filter-chip filter-chip--muscle${value === group ? ' filter-chip--active' : ''}`}
              onClick={() => onChange(group)}
              aria-label={label}
              aria-pressed={value === group}
            >
              <span className="filter-chip__icon-wrap" aria-hidden>
                <MuscleGroupIcon group={group} size={MUSCLE_ICON_SIZE} className="filter-chip__icon" />
              </span>
              <span className="filter-chip__label">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
