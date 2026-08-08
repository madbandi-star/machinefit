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
  /** Compact icon strip (default) or labeled action pad. */
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
    shortLabel: string;
    Icon: typeof ChevronUp;
    inactive: boolean;
  }[] = [
    {
      move: 'up',
      label: t('machines:history.orderMoveUp'),
      shortLabel: t('machines:history.orderMoveUpShort'),
      Icon: ChevronUp,
      inactive: isFirst,
    },
    {
      move: 'down',
      label: t('machines:history.orderMoveDown'),
      shortLabel: t('machines:history.orderMoveDownShort'),
      Icon: ChevronDown,
      inactive: isLast,
    },
    {
      move: 'top',
      label: t('machines:history.orderMoveTop'),
      shortLabel: t('machines:history.orderMoveTopShort'),
      Icon: ChevronsUp,
      inactive: isFirst,
    },
    {
      move: 'bottom',
      label: t('machines:history.orderMoveBottom'),
      shortLabel: t('machines:history.orderMoveBottomShort'),
      Icon: ChevronsDown,
      inactive: isLast,
    },
  ];

  const buttons = actions.map(({ move, label, shortLabel, Icon, inactive }) => {
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
        <span className="workout-card-order__btn-icon" aria-hidden>
          <Icon size={variant === 'menu' ? 18 : 15} strokeWidth={2.25} />
        </span>
        {variant === 'menu' ? (
          <span className="workout-card-order__btn-label">{shortLabel}</span>
        ) : null}
      </button>
    );
  });

  return (
    <div
      className={`workout-card-order workout-card-order--${variant}`}
      role="group"
      aria-labelledby={labelId}
    >
      <span
        id={labelId}
        className={
          variant === 'menu'
            ? 'workout-card-order__title'
            : 'workout-card-order__legend'
        }
      >
        {t('machines:history.orderControlsLabel')}
      </span>
      {variant === 'menu' ? (
        <div className="workout-card-order__grid">{buttons}</div>
      ) : (
        buttons
      )}
    </div>
  );
}
