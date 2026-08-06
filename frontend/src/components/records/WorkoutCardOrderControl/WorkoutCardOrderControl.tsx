import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChevronsDown,
  ChevronsUp,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { WorkoutCardOrderMove } from '@/utils/workoutCardOrder';
import './WorkoutCardOrderControl.css';

export interface WorkoutCardOrderControlProps {
  index: number;
  total: number;
  disabled?: boolean;
  onMove: (move: WorkoutCardOrderMove) => void;
  /** Compact icon strip (default) or labeled menu list. */
  variant?: 'icons' | 'menu';
}

export function WorkoutCardOrderControl({
  index,
  total,
  disabled = false,
  onMove,
  variant = 'icons',
}: WorkoutCardOrderControlProps) {
  const { t } = useTranslation(['machines']);
  const labelId = useId();
  const isFirst = index <= 0;
  const isLast = index >= total - 1 || total <= 1;

  const actions: {
    move: WorkoutCardOrderMove;
    label: string;
    Icon: typeof ChevronUp;
    inactive: boolean;
  }[] = [
    {
      move: 'up',
      label: t('machines:history.orderMoveUp'),
      Icon: ChevronUp,
      inactive: isFirst,
    },
    {
      move: 'down',
      label: t('machines:history.orderMoveDown'),
      Icon: ChevronDown,
      inactive: isLast,
    },
    {
      move: 'top',
      label: t('machines:history.orderMoveTop'),
      Icon: ChevronsUp,
      inactive: isFirst,
    },
    {
      move: 'bottom',
      label: t('machines:history.orderMoveBottom'),
      Icon: ChevronsDown,
      inactive: isLast,
    },
  ];

  return (
    <div
      className={`workout-card-order workout-card-order--${variant}`}
      role="group"
      aria-labelledby={labelId}
    >
      <span id={labelId} className="workout-card-order__legend">
        {t('machines:history.orderControlsLabel')}
      </span>
      {actions.map(({ move, label, Icon, inactive }) => {
        const isDisabled = disabled || inactive;
        return (
          <button
            key={move}
            type="button"
            className={`workout-card-order__btn workout-card-order__btn--${move}${
              inactive ? ' workout-card-order__btn--inactive' : ''
            }`}
            aria-label={label}
            title={label}
            disabled={isDisabled}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!isDisabled) onMove(move);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                if (!isDisabled) onMove(move);
              }
            }}
          >
            <Icon size={variant === 'menu' ? 16 : 15} strokeWidth={2.25} aria-hidden />
            {variant === 'menu' ? (
              <span className="workout-card-order__btn-label">{label}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
