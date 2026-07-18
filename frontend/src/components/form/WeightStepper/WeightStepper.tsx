import { useTranslation } from 'react-i18next';
import { NumericStepper } from '@/components/form/NumericStepper/NumericStepper';
import { roundToWeightStep } from '@/utils/weightStep';
import '@/styles/components.css';

interface WeightStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  manualStep?: number;
  size?: 'default' | 'compact';
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  suggestedWeightKg?: number;
  previousWeightKg?: number;
  onApplySuggested?: () => void;
  onCopyPrevious?: () => void;
  onApplyToAll?: () => void;
  showApplyToAll?: boolean;
  showQuickActions?: boolean;
}

function formatWeight(value: number): number {
  return value <= 0 ? 0 : value;
}

export function WeightStepper({
  value,
  onChange,
  step = 5,
  manualStep = 1,
  size = 'default',
  disabled = false,
  id,
  ariaLabel,
  suggestedWeightKg,
  previousWeightKg,
  onApplySuggested,
  onCopyPrevious,
  onApplyToAll,
  showApplyToAll = false,
  showQuickActions = true,
}: WeightStepperProps) {
  const { t } = useTranslation('machines');

  const handleChange = (next: number | undefined) => {
    onChange(formatWeight(next ?? 0));
  };

  const suggested =
    suggestedWeightKg != null && suggestedWeightKg > 0
      ? roundToWeightStep(suggestedWeightKg, step)
      : undefined;
  const previous =
    previousWeightKg != null && previousWeightKg > 0
      ? roundToWeightStep(previousWeightKg, step)
      : undefined;

  const chips: Array<{ key: string; label: string; onClick: () => void; hidden?: boolean }> = [
    {
      key: 'suggested',
      label: suggested != null ? t('workoutLog.applySuggested', { weight: suggested }) : '',
      onClick: () => onApplySuggested?.(),
      hidden: suggested == null || !onApplySuggested,
    },
    {
      key: 'previous',
      label: t('workoutLog.copyPreviousSet'),
      onClick: () => onCopyPrevious?.(),
      hidden: previous == null || !onCopyPrevious,
    },
    {
      key: 'all',
      label: t('workoutLog.applyAllSets'),
      onClick: () => onApplyToAll?.(),
      hidden: !showApplyToAll || !onApplyToAll,
    },
  ];

  const visibleChips = chips.filter((chip) => !chip.hidden);

  return (
    <div className={`weight-stepper${size === 'compact' ? ' weight-stepper--compact' : ''}`}>
      <NumericStepper
        id={id}
        value={formatWeight(value)}
        onChange={handleChange}
        min={0}
        max={999}
        step={step}
        manualStep={manualStep}
        unit="kg"
        size={size}
        disabled={disabled}
        ariaLabel={ariaLabel}
        emptyLabel="0"
        allowManualInput
      />
      {showQuickActions && visibleChips.length > 0 ? (
        <div className="weight-stepper__chips" role="group" aria-label={t('workoutLog.quickActions')}>
          {visibleChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="weight-stepper__chip"
              disabled={disabled}
              onClick={chip.onClick}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
