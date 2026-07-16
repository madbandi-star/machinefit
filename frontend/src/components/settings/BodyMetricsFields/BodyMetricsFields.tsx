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
  onHeightCmChange: (heightCm: number | undefined) => void;
  onWeightKgChange: (weightKg: number | undefined) => void;
  heightOptional?: boolean;
  weightOptional?: boolean;
  heightInvalid?: boolean;
  weightInvalid?: boolean;
}

export function BodyMetricsFields({
  unitHeight,
  unitWeight,
  heightCm,
  weightKg,
  onHeightCmChange,
  onWeightKgChange,
  heightOptional = false,
  weightOptional = true,
  heightInvalid = false,
  weightInvalid = false,
}: BodyMetricsFieldsProps) {
  const { t } = useTranslation();
  const [heightFeet, setHeightFeet] = useState<number | undefined>(undefined);
  const [heightInches, setHeightInches] = useState<number | undefined>(undefined);
  const [weightLb, setWeightLb] = useState<number | undefined>(
    weightKg != null ? kgToLb(weightKg) : undefined
  );

  useEffect(() => {
    if (heightCm == null) {
      setHeightFeet(undefined);
      setHeightInches(undefined);
      return;
    }

    const converted = fromStandardHeight(heightCm, unitHeight);
    if (typeof converted === 'object') {
      setHeightFeet(converted.feet);
      setHeightInches(converted.inches);
    }
  }, [unitHeight, heightCm]);

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

  const handleFeetInchesChange = (feet: number | undefined, inches: number | undefined) => {
    setHeightFeet(feet);
    setHeightInches(inches);

    if (feet == null || inches == null || Number.isNaN(feet) || Number.isNaN(inches)) {
      onHeightCmChange(undefined);
      return;
    }

    onHeightCmChange(toStandardHeight(feet, 'ft_in', inches));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {unitHeight === 'cm' ? (
        <label>
          {t('auth.heightLabel')} (CM{heightOptional ? `, ${t('auth.optional')}` : ''})
          <input
            className={`input${heightInvalid ? ' input--invalid' : ''}`}
            type="number"
            min={100}
            max={250}
            value={heightCm ?? ''}
            onChange={(e) => {
              if (!e.target.value) {
                onHeightCmChange(undefined);
                return;
              }
              handleHeightCmChange(Number(e.target.value));
            }}
          />
        </label>
      ) : (
        <div className="form-row-group">
          <span className="form-row-group__label">
            {t('auth.heightLabel')} (FT{heightOptional ? `, ${t('auth.optional')}` : ''})
          </span>
          <div className="form-row-group__inputs">
            <label>
              ft
              <input
                className={`input${heightInvalid ? ' input--invalid' : ''}`}
                type="number"
                min={3}
                max={8}
                value={heightFeet ?? ''}
                onChange={(e) => {
                  const nextFeet = e.target.value ? Number(e.target.value) : undefined;
                  handleFeetInchesChange(nextFeet, heightInches);
                }}
              />
            </label>
            <label>
              in
              <input
                className={`input${heightInvalid ? ' input--invalid' : ''}`}
                type="number"
                min={0}
                max={11}
                value={heightInches ?? ''}
                onChange={(e) => {
                  const nextInches = e.target.value ? Number(e.target.value) : undefined;
                  handleFeetInchesChange(heightFeet, nextInches);
                }}
              />
            </label>
          </div>
        </div>
      )}

      <label>
        {t('auth.weightLabel')} ({unitWeight === 'kg' ? 'KG' : 'LB'}
        {weightOptional ? `, ${t('auth.optional')}` : ''})
        <input
          className={`input${weightInvalid ? ' input--invalid' : ''}`}
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
        />
      </label>
    </div>
  );
}
