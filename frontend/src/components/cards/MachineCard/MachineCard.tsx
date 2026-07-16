import { Link } from 'react-router-dom';
import type { Machine } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

interface MachineCardProps {
  machine: Machine;
}

export function MachineCard({ machine }: MachineCardProps) {
  const name = machine.name.en ?? machine.code;

  return (
    <Link
      to={ROUTES.MACHINE_DETAIL.replace(':machineCode', machine.code)}
      className="card card--interactive"
    >
      <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{name}</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        {machine.muscleGroup} · {machine.code}
      </p>
    </Link>
  );
}
