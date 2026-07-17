import type { ReactNode } from 'react';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import type { MuscleGroup } from '@/constants/muscle-groups';
import '@/styles/muscle-group-icon.css';

interface MachineNameWithMuscleProps {
  muscleGroup?: string;
  name: ReactNode;
  iconSize?: number;
  className?: string;
  labelClassName?: string;
}

export function MachineNameWithMuscle({
  muscleGroup,
  name,
  iconSize = 22,
  className,
  labelClassName,
}: MachineNameWithMuscleProps) {
  return (
    <span className={`machine-name-with-muscle${className ? ` ${className}` : ''}`}>
      {muscleGroup ? (
        <MuscleGroupIcon group={muscleGroup as MuscleGroup} size={iconSize} />
      ) : null}
      <span className={`machine-name-with-muscle__label${labelClassName ? ` ${labelClassName}` : ''}`}>
        {name}
      </span>
    </span>
  );
}
