import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/machines.css';

interface MachineHeroProps {
  machine: Machine;
  compact?: boolean;
}

export function MachineHero({ machine, compact = false }: MachineHeroProps) {
  const { t, i18n } = useTranslation('machines');
  const name = getLocalizedName(machine.name, i18n.language, machine.code);
  const muscleLabel = t(`muscleGroups.${machine.muscleGroup}`, {
    defaultValue: machine.muscleGroup,
  });
  const typeLabel = t(`machineTypes.${machine.machineType}`, {
    defaultValue: machine.machineType.replace(/_/g, ' '),
  });

  return (
    <div className={`machine-hero${compact ? ' machine-hero--compact' : ''}`}>
      {!compact && (
        <div className="machine-hero__image-wrap">
          {machine.primaryImageUrl ? (
            <img
              className="machine-hero__image"
              src={machine.primaryImageUrl}
              alt={name}
              loading="lazy"
            />
          ) : machine.muscleGroup ? (
            <div className="machine-hero__muscle-icon" aria-hidden>
              <MuscleGroupIcon group={machine.muscleGroup as MuscleGroup} size={120} />
            </div>
          ) : (
            <div className="machine-hero__placeholder" aria-hidden>
              🏋️
            </div>
          )}
        </div>
      )}
      <h1 className="machine-hero__title">
        <MachineNameWithMuscle
          muscleGroup={machine.muscleGroup}
          name={name}
          iconSize={28}
          labelClassName="machine-hero__title-text"
        />
      </h1>
      <p className="machine-hero__code">{machine.code}</p>
      <div className="machine-hero__badges">
        <span className="machine-badge machine-badge--muscle">{muscleLabel}</span>
        <span className="machine-badge machine-badge--type">{typeLabel}</span>
      </div>
    </div>
  );
}
