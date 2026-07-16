import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/machines.css';

interface MachineHeroProps {
  machine: Machine;
}

export function MachineHero({ machine }: MachineHeroProps) {
  const { t, i18n } = useTranslation('machines');
  const name = getLocalizedName(machine.name, i18n.language, machine.code);
  const muscleLabel = t(`muscleGroups.${machine.muscleGroup}`, {
    defaultValue: machine.muscleGroup,
  });
  const typeLabel = t(`machineTypes.${machine.machineType}`, {
    defaultValue: machine.machineType.replace(/_/g, ' '),
  });

  return (
    <div className="machine-hero">
      <div className="machine-hero__image-wrap">
        {machine.primaryImageUrl ? (
          <img
            className="machine-hero__image"
            src={machine.primaryImageUrl}
            alt={name}
            loading="lazy"
          />
        ) : (
          <div className="machine-hero__placeholder" aria-hidden>
            🏋️
          </div>
        )}
      </div>
      <h2 className="machine-hero__title">{name}</h2>
      <p className="machine-hero__code">{machine.code}</p>
      <div className="machine-hero__badges">
        <span className="machine-badge machine-badge--muscle">{muscleLabel}</span>
        <span className="machine-badge machine-badge--type">{typeLabel}</span>
      </div>
    </div>
  );
}
