import { useTranslation } from 'react-i18next';
import { kgToLb, lbToKg } from '@machinefit/shared';
import { NumericStepper } from '@/components/form/NumericStepper/NumericStepper';
import { useUserUnits } from '@/hooks/useUserUnits';
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
  const { unitWeight } = useUserUnits();

  const displayValue =
    unitWeight === 'lb' ? kgToLb(formatWeight(value)) : formatWeight(value);
  const displayStep = unitWeight === 'lb' ? Math.max(1, Math.round(kgToLb(step))) : step;
  const displayManualStep =
    unitWeight === 'lb' ? Math.max(0.5, Math.round(kgToLb(manualStep) * 2) / 2) : manualStep;

  const handleChange = (next: number | undefined) => {
    const raw = next ?? 0;
    const kg = unitWeight === 'lb' ? lbToKg(raw) : raw;
    onChange(formatWeight(kg));
  };

  const suggested =
    suggestedWeightKg != null && suggestedWeightKg > 0
      ? roundToWeightStep(suggestedWeightKg, step)
      : undefined;
  const previous =
    previousWeightKg != null && previousWeightKg > 0
      ? roundToWeightStep(previousWeightKg, step)
      : undefined;

  const formatChipWeight = (kg: number) =>
    unitWeight === 'lb' ? kgToLb(kg) : kg;

  const chips: Array<{ key: string; label: string; onClick: () => void; hidden?: boolean }> = [
    {
      key: 'suggested',
      label:
        suggested != null
          ? t('workoutLog.applySuggested', { weight: formatChipWeight(suggested) })
          : '',
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
        value={displayValue}
        onChange={handleChange}
        min={0}
        max={unitWeight === 'lb' ? 2000 : 999}
        step={displayStep}
        manualStep={displayManualStep}
        unit={unitWeight}
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
