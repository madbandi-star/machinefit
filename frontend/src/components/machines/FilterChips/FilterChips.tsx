import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { ScrollCarousel } from '@/components/navigation/ScrollCarousel/ScrollCarousel';
import { MUSCLE_GROUPS } from '@/constants/muscle-groups';
import { useMuscleGroupImageMap } from '@/hooks/useMuscleGroupImages';
import '@/styles/machines.css';

interface FilterChipsProps {
  /** `null` = 전체 (all muscle groups). */
  value: string | null;
  onChange: (muscleGroup: string | null) => void;
}

const MUSCLE_ICON_SIZE = 44;
/** 전체 + muscle groups — keep skeleton count stable with the real row. */
const MUSCLE_SKELETON_COUNT = 1 + MUSCLE_GROUPS.length;

export function FilterChips({ value, onChange }: FilterChipsProps) {
  const { t } = useTranslation('machines');
  const { ready: muscleImagesReady } = useMuscleGroupImageMap();
  const sectionTitle = t('muscleSectionTitle');
  const allLabel = t('filterAll');
  const loading = !muscleImagesReady;

  return (
    <section className="filter-section" aria-labelledby="search-muscle-section-title">
      <h2 id="search-muscle-section-title" className="filter-section__title">
        {sectionTitle}
      </h2>
      <ScrollCarousel
        className="filter-chips-scroller"
        scrollerClassName="filter-chips"
        scrollerProps={{
          role: 'group',
          'aria-label': t('filterByMuscle'),
          'aria-busy': loading || undefined,
        }}
      >
        {loading
          ? Array.from({ length: MUSCLE_SKELETON_COUNT }, (_, i) => (
              <div
                key={`muscle-skel-${i}`}
                className="filter-chip filter-chip--muscle filter-chip--skeleton"
                aria-hidden
              >
                <span className="filter-chip__icon-wrap filter-chip__skeleton-icon skeleton" />
                <span className="filter-chip__skeleton-label skeleton" />
              </div>
            ))
          : (
            <>
              <button
                type="button"
                className={`filter-chip filter-chip--muscle filter-chip--muscle-all${
                  value === null ? ' filter-chip--active' : ''
                }`}
                onClick={() => onChange(null)}
                aria-label={allLabel}
                aria-pressed={value === null}
              >
                <span className="filter-chip__icon-wrap filter-chip__icon-wrap--all" aria-hidden>
                  <Icon name="machines" size={22} className="filter-chip__all-icon" />
                </span>
                <span className="filter-chip__label">{allLabel}</span>
              </button>
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
                      <MuscleGroupIcon
                        group={group}
                        size={MUSCLE_ICON_SIZE}
                        adminOnly
                        className="filter-chip__icon"
                      />
                    </span>
                    <span className="filter-chip__label">{label}</span>
                  </button>
                );
              })}
            </>
          )}
      </ScrollCarousel>
    </section>
  );
}
