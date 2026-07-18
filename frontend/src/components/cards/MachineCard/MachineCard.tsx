import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import { ROUTES } from '@/constants/routes';
import { getLocalizedName } from '@/utils/localizedName';
import { shouldShowDefaultMachineMuscle } from '@/utils/freeWeightDisplay';
import '@/styles/components.css';

interface MachineCardProps {
  machine: Machine;
}

export function MachineCard({ machine }: MachineCardProps) {
  const { i18n } = useTranslation('machines');
  const name = getLocalizedName(machine.name, i18n.language, '');

  return (
    <Link
      to={ROUTES.MACHINE_DETAIL.replace(':machineCode', machine.code)}
      className="card card--interactive"
    >
      <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
        <MachineNameWithMuscle
          muscleGroup={shouldShowDefaultMachineMuscle(machine.code) ? machine.muscleGroup : undefined}
          name={name}
          iconSize={20}
        />
      </h3>
    </Link>
  );
}
