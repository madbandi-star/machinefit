import { useTranslation } from 'react-i18next';
import { WORKOUT_GOALS, type WorkoutGoal } from '@machinefit/shared';
import '@/styles/components.css';

interface WorkoutGoalSelectorProps {
  value: WorkoutGoal | undefined;
  onChange: (value: WorkoutGoal | undefined) => void;
  allowEmpty?: boolean;
  invalid?: boolean;
}

export function WorkoutGoalSelector({
  value,
  onChange,
  allowEmpty = false,
  invalid = false,
}: WorkoutGoalSelectorProps) {
  const { t } = useTranslation();

  return (
    <label>
      {t('auth.workoutGoal')}
      <select
        className={`input${invalid ? ' input--invalid' : ''}`}
        value={value ?? ''}
        onChange={(e) => {
          const next = e.target.value;
          onChange(next ? (next as WorkoutGoal) : undefined);
        }}
      >
        {allowEmpty && <option value="">{t('auth.workoutGoalPlaceholder')}</option>}
        {WORKOUT_GOALS.map((goal) => (
          <option key={goal} value={goal}>
            {t(`auth.workoutGoals.${goal}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
