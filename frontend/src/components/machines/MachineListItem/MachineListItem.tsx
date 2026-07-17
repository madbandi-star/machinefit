import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { ROUTES } from '@/constants/routes';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/machines.css';

interface MachineListItemProps {
  machine: Machine;
}

export function MachineListItem({ machine }: MachineListItemProps) {
  const { i18n } = useTranslation('machines');
  const name = getLocalizedName(machine.name, i18n.language, machine.code);

  return (
    <Link
      to={ROUTES.MACHINE_DETAIL.replace(':machineCode', machine.code)}
      className="machine-list-item"
    >
      <div className="machine-list-item__thumb">
        {machine.primaryImageUrl ? (
          <img src={machine.primaryImageUrl} alt="" loading="lazy" />
        ) : machine.muscleGroup ? (
          <div className="machine-list-item__muscle-icon" aria-hidden>
            <MuscleGroupIcon group={machine.muscleGroup as MuscleGroup} size={52} />
          </div>
        ) : (
          <div className="machine-list-item__thumb-placeholder" aria-hidden>
            🏋️
          </div>
        )}
      </div>
      <div className="machine-list-item__body">
        <p className="machine-list-item__name">
          <MachineNameWithMuscle
            muscleGroup={machine.muscleGroup}
            name={name}
            iconSize={20}
            labelClassName="machine-list-item__name-text"
          />
        </p>
        <p className="machine-list-item__meta">{machine.code}</p>
      </div>
      <span className="machine-list-item__chevron" aria-hidden>
        ›
      </span>
    </Link>
  );
}
