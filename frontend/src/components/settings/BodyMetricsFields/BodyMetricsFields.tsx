import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UnitHeight, UnitWeight } from '@machinefit/shared';
import {
  cmToFeetInches,
  fromStandardHeight,
  kgToLb,
  toStandardHeight,
  toStandardWeight,
} from '@machinefit/shared';
import '@/styles/components.css';

interface BodyMetricsFieldsProps {
  unitHeight: UnitHeight;
  unitWeight: UnitWeight;
  heightCm?: number;
  weightKg?: number;
  onHeightCmChange: (heightCm: number) => void;
  onWeightKgChange: (weightKg: number | undefined) => void;
  weightOptional?: boolean;
}

export function BodyMetricsFields({
  unitHeight,
  unitWeight,
  heightCm,
  weightKg,
  onHeightCmChange,
  onWeightKgChange,
  weightOptional = true,
}: BodyMetricsFieldsProps) {
  const { t } = useTranslation();
  const [heightFeet, setHeightFeet] = useState(5);
  const [heightInches, setHeightInches] = useState(9);
  const [weightLb, setWeightLb] = useState<number | undefined>(
    weightKg != null ? kgToLb(weightKg) : undefined
  );

  const resolvedHeightCm = heightCm ?? 175;

  useEffect(() => {
    const converted = fromStandardHeight(resolvedHeightCm, unitHeight);
    if (typeof converted === 'object') {
      setHeightFeet(converted.feet);
      setHeightInches(converted.inches);
    }
  }, [unitHeight, resolvedHeightCm]);

  useEffect(() => {
    if (weightKg != null) {
      setWeightLb(kgToLb(weightKg));
    } else {
      setWeightLb(undefined);
    }
  }, [unitWeight, weightKg]);

  const handleHeightCmChange = (value: number) => {
    onHeightCmChange(value);
    const { feet, inches } = cmToFeetInches(value);
    setHeightFeet(feet);
    setHeightInches(inches);
  };

  const handleFeetInchesChange = (feet: number, inches: number) => {
    setHeightFeet(feet);
    setHeightInches(inches);
    onHeightCmChange(toStandardHeight(feet, 'ft_in', inches));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {unitHeight === 'cm' ? (
        <label>
          {t('auth.heightLabel')} (CM)
          <input
            className="input"
            type="number"
            min={100}
            max={250}
            value={resolvedHeightCm}
            onChange={(e) => handleHeightCmChange(Number(e.target.value))}
            required
          />
        </label>
      ) : (
        <div className="form-row-group">
          <span className="form-row-group__label">{t('auth.heightLabel')} (FT)</span>
          <div className="form-row-group__inputs">
            <label>
              ft
              <input
                className="input"
                type="number"
                min={3}
                max={8}
                value={heightFeet}
                onChange={(e) =>
                  handleFeetInchesChange(Number(e.target.value), heightInches)
                }
                required
              />
            </label>
            <label>
              in
              <input
                className="input"
                type="number"
                min={0}
                max={11}
                value={heightInches}
                onChange={(e) =>
                  handleFeetInchesChange(heightFeet, Number(e.target.value))
                }
                required
              />
            </label>
          </div>
        </div>
      )}

      <label>
        {t('auth.weightLabel')} ({unitWeight === 'kg' ? 'KG' : 'LB'}
        {weightOptional ? `, ${t('auth.optional')}` : ''})
        <input
          className="input"
          type="number"
          value={unitWeight === 'kg' ? (weightKg ?? '') : (weightLb ?? '')}
          onChange={(e) => {
            if (!e.target.value) {
              onWeightKgChange(undefined);
              setWeightLb(undefined);
              return;
            }
            const value = Number(e.target.value);
            if (unitWeight === 'kg') {
              onWeightKgChange(value);
              setWeightLb(kgToLb(value));
            } else {
              setWeightLb(value);
              onWeightKgChange(toStandardWeight(value, 'lb'));
            }
          }}
          required={!weightOptional}
        />
      </label>
    </div>
  );
}
