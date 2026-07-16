import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/machines.css';

interface MachineListItemProps {
  machine: Machine;
}

export function MachineListItem({ machine }: MachineListItemProps) {
  const { t, i18n } = useTranslation('machines');
  const name = getLocalizedName(machine.name, i18n.language, machine.code);
  const muscleLabel = t(`muscleGroups.${machine.muscleGroup}`, {
    defaultValue: machine.muscleGroup,
  });

  return (
    <Link
      to={ROUTES.MACHINE_DETAIL.replace(':machineCode', machine.code)}
      className="machine-list-item"
    >
      <div className="machine-list-item__thumb">
        {machine.primaryImageUrl ? (
          <img src={machine.primaryImageUrl} alt="" loading="lazy" />
        ) : (
          <div className="machine-list-item__thumb-placeholder" aria-hidden>
            🏋️
          </div>
        )}
      </div>
      <div className="machine-list-item__body">
        <p className="machine-list-item__name">{name}</p>
        <p className="machine-list-item__meta">
          {muscleLabel} · {machine.code}
        </p>
      </div>
      <span className="machine-list-item__chevron" aria-hidden>
        ›
      </span>
    </Link>
  );
}
