import type { UnitHeight, UnitWeight } from '@machinefit/shared';
import '@/styles/components.css';

interface UnitOption<T extends string> {
  value: T;
  label: string;
}

interface UnitPickerProps<T extends string> {
  label: string;
  value: T;
  options: UnitOption<T>[];
  onChange: (value: T) => void;
  compact?: boolean;
}

export function UnitPicker<T extends string>({
  label,
  value,
  options,
  onChange,
  compact = false,
}: UnitPickerProps<T>) {
  return (
    <div className={`unit-picker${compact ? ' unit-picker--compact' : ''}`}>
      <span className="unit-picker__label">{label}</span>
      <div className="unit-picker__options" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`unit-picker__option${value === option.value ? ' unit-picker__option--active' : ''}`}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export const HEIGHT_UNIT_OPTIONS: UnitOption<UnitHeight>[] = [
  { value: 'cm', label: 'CM' },
  { value: 'ft_in', label: 'FT' },
];

export const WEIGHT_UNIT_OPTIONS: UnitOption<UnitWeight>[] = [
  { value: 'kg', label: 'KG' },
  { value: 'lb', label: 'LB' },
];
