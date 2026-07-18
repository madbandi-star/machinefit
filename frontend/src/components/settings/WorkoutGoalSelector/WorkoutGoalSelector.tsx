import { useTranslation } from 'react-i18next';
import { WORKOUT_GOALS, type WorkoutGoal } from '@machinefit/shared';
import { SegmentedControl } from '@/components/form/SegmentedControl/SegmentedControl';
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
    <div className={invalid ? 'form-row form-row--invalid' : 'form-row'}>
      <span className="form-row__label">{t('auth.workoutGoal')}</span>
      {allowEmpty && !value ? (
        <p className="form-section__desc">{t('auth.workoutGoalPlaceholder')}</p>
      ) : null}
      <SegmentedControl
        value={value}
        options={WORKOUT_GOALS.map((goal) => ({
          value: goal,
          label: t(`auth.workoutGoals.${goal}`),
        }))}
        onChange={onChange}
        ariaLabel={t('auth.workoutGoal')}
      />
    </div>
  );
}
