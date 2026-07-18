import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLongPressRepeat } from '@/hooks/useLongPressRepeat';
import {
  clampNumber,
  formatNumericValue,
  getDecimalPlaces,
  roundToStep,
  stepNumber,
} from '@/utils/numericStep';
import '@/styles/components.css';

interface NumericStepperProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  max?: number;
  step?: number;
  manualStep?: number;
  size?: 'default' | 'compact';
  disabled?: boolean;
  unit?: string;
  id?: string;
  ariaLabel?: string;
  allowManualInput?: boolean;
  showManualLink?: boolean;
  emptyLabel?: string;
}

export function NumericStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  manualStep,
  size = 'default',
  disabled = false,
  unit,
  id,
  ariaLabel,
  allowManualInput = true,
  showManualLink = false,
  emptyLabel = '—',
}: NumericStepperProps) {
  const { t } = useTranslation('common');
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [manualOpen, setManualOpen] = useState(false);
  const inputStep = manualStep ?? step;
  const decimalPlaces = getDecimalPlaces(step);
  const manualDecimalPlaces = getDecimalPlaces(inputStep);
  const hasValue = value != null && Number.isFinite(value);
  const currentValue = hasValue ? clampNumber(value, min, max) : min;

  const emitChange = (next: number, roundingStep = step) => {
    onChange(clampNumber(roundToStep(next, roundingStep), min, max));
  };

  const decrease = () => {
    if (!hasValue) {
      onChange(min);
      return;
    }
    emitChange(stepNumber(currentValue, step, -1, min, max));
  };

  const increase = () => {
    if (!hasValue) {
      onChange(min);
      return;
    }
    emitChange(stepNumber(currentValue, step, 1, min, max));
  };

  const decreaseRepeat = useLongPressRepeat(decrease);
  const increaseRepeat = useLongPressRepeat(increase);

  const displayValue = hasValue
    ? formatNumericValue(currentValue, decimalPlaces > 0 ? decimalPlaces : undefined)
    : emptyLabel;

  const handleManualChange = (raw: string) => {
    if (!raw.trim()) {
      onChange(undefined);
      return;
    }
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return;
    emitChange(parsed, inputStep);
  };

  return (
    <div
      className={`numeric-stepper numeric-stepper--${size}${
        showManualLink && allowManualInput ? ' numeric-stepper--with-manual-link' : ''
      }${disabled ? ' numeric-stepper--disabled' : ''}`}
    >
      <div className="numeric-stepper__row" role="group" aria-label={ariaLabel}>
        <button
          type="button"
          className="numeric-stepper__btn"
          aria-label={t('numericStepper.decrease')}
          disabled={disabled || (hasValue && currentValue <= min)}
          onClick={decrease}
          onPointerDown={(event) => {
            if (event.button !== 0 || disabled) return;
            decreaseRepeat.start();
          }}
          onPointerUp={decreaseRepeat.stop}
          onPointerLeave={decreaseRepeat.stop}
          onPointerCancel={decreaseRepeat.stop}
        >
          −
        </button>

        {manualOpen ? (
          <input
            id={inputId}
            className="numeric-stepper__manual-input"
            type="number"
            inputMode={manualDecimalPlaces > 0 ? 'decimal' : 'numeric'}
            min={min}
            max={max}
            step={inputStep}
            value={hasValue ? currentValue : ''}
            disabled={disabled}
            aria-label={ariaLabel}
            autoFocus
            onBlur={() => setManualOpen(false)}
            onChange={(event) => handleManualChange(event.target.value)}
          />
        ) : (
          <button
            type="button"
            id={inputId}
            className="numeric-stepper__value"
            disabled={disabled}
            aria-label={ariaLabel}
            onClick={() => {
              if (allowManualInput && !disabled) setManualOpen(true);
            }}
          >
            <span className="numeric-stepper__value-text">{displayValue}</span>
            {unit ? <span className="numeric-stepper__unit">{unit}</span> : null}
          </button>
        )}

        <button
          type="button"
          className="numeric-stepper__btn"
          aria-label={t('numericStepper.increase')}
          disabled={disabled || (hasValue && currentValue >= max)}
          onClick={increase}
          onPointerDown={(event) => {
            if (event.button !== 0 || disabled) return;
            increaseRepeat.start();
          }}
          onPointerUp={increaseRepeat.stop}
          onPointerLeave={increaseRepeat.stop}
          onPointerCancel={increaseRepeat.stop}
        >
          +
        </button>
      </div>

      {showManualLink && allowManualInput && !manualOpen ? (
        <button
          type="button"
          className="numeric-stepper__manual-link"
          disabled={disabled}
          onClick={() => setManualOpen(true)}
        >
          {t('numericStepper.manualInput')}
        </button>
      ) : null}
    </div>
  );
}
