import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

interface MachineCardProps {
  machine: Machine;
}

export function MachineCard({ machine }: MachineCardProps) {
  const { i18n } = useTranslation();
  const name = machine.name[i18n.language as keyof typeof machine.name] ?? machine.name.en ?? machine.code;

  return (
    <Link
      to={ROUTES.MACHINE_DETAIL.replace(':machineCode', machine.code)}
      className="card card--interactive"
    >
      <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
        <MachineNameWithMuscle muscleGroup={machine.muscleGroup} name={name} iconSize={20} />
      </h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{machine.code}</p>
    </Link>
  );
}
