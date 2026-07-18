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
  const [manualDraft, setManualDraft] = useState('');
  const inputStep = manualStep ?? step;
  const decimalPlaces = getDecimalPlaces(step);
  const manualDecimalPlaces = getDecimalPlaces(inputStep);
  const hasValue = value != null && Number.isFinite(value);
  const currentValue = hasValue ? clampNumber(value, min, max) : min;

  const emitChange = (next: number, roundingStep = step) => {
    onChange(clampNumber(roundToStep(next, roundingStep), min, max));
  };

  const formatDraftValue = (next: number) =>
    formatNumericValue(next, decimalPlaces > 0 ? decimalPlaces : undefined);

  const openManualInput = () => {
    if (!allowManualInput || disabled) return;
    setManualDraft(hasValue ? formatDraftValue(currentValue) : '');
    setManualOpen(true);
  };

  const commitManualInput = () => {
    setManualOpen(false);
    const trimmed = manualDraft.trim();
    if (!trimmed) {
      onChange(undefined);
      return;
    }
    const parsed = Number.parseFloat(trimmed);
    if (!Number.isFinite(parsed)) return;
    emitChange(parsed, inputStep);
  };

  const cancelManualInput = () => {
    setManualOpen(false);
  };

  const resolveEditableValue = (): number | null => {
    if (!manualOpen) {
      return hasValue ? currentValue : null;
    }

    setManualOpen(false);
    const trimmed = manualDraft.trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed);
    if (!Number.isFinite(parsed)) return hasValue ? currentValue : null;
    return clampNumber(roundToStep(parsed, inputStep), min, max);
  };

  const decrease = () => {
    const resolved = resolveEditableValue();
    if (resolved == null) {
      onChange(min);
      return;
    }
    emitChange(stepNumber(resolved, step, -1, min, max));
  };

  const increase = () => {
    const resolved = resolveEditableValue();
    if (resolved == null) {
      onChange(min);
      return;
    }
    emitChange(stepNumber(resolved, step, 1, min, max));
  };

  const decreaseRepeat = useLongPressRepeat(decrease);
  const increaseRepeat = useLongPressRepeat(increase);

  const displayValue = hasValue
    ? formatDraftValue(currentValue)
    : emptyLabel;

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
            type="text"
            inputMode={manualDecimalPlaces > 0 ? 'decimal' : 'numeric'}
            value={manualDraft}
            disabled={disabled}
            aria-label={ariaLabel}
            autoFocus
            onFocus={(event) => event.target.select()}
            onBlur={commitManualInput}
            onChange={(event) => setManualDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelManualInput();
              }
            }}
          />
        ) : (
          <button
            type="button"
            id={inputId}
            className="numeric-stepper__value"
            disabled={disabled}
            aria-label={ariaLabel}
            onClick={openManualInput}
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
          onClick={openManualInput}
        >
          {t('numericStepper.manualInput')}
        </button>
      ) : null}
    </div>
  );
}
