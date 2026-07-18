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
import { NumericStepper } from '@/components/form/NumericStepper/NumericStepper';
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

  const handleHeightCmChange = (value: number | undefined) => {
    if (value == null) {
      onHeightCmChange(undefined);
      setHeightFeet(undefined);
      setHeightInches(undefined);
      return;
    }

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

  const handleWeightKgValue = (value: number | undefined) => {
    if (value == null) {
      onWeightKgChange(undefined);
      setWeightLb(undefined);
      return;
    }

    onWeightKgChange(value);
    setWeightLb(kgToLb(value));
  };

  const handleWeightLbValue = (value: number | undefined) => {
    if (value == null) {
      onWeightKgChange(undefined);
      setWeightLb(undefined);
      return;
    }

    setWeightLb(value);
    onWeightKgChange(toStandardWeight(value, 'lb'));
  };

  return (
    <div className="form-stack">
      {unitHeight === 'cm' ? (
        <div className={`body-metrics-stepper${heightInvalid ? ' body-metrics-stepper--invalid' : ''}`}>
          <span className="body-metrics-stepper__label">
            {t('auth.heightLabel')} (CM{heightOptional ? `, ${t('auth.optional')}` : ''})
          </span>
          <NumericStepper
            value={heightCm}
            onChange={handleHeightCmChange}
            min={100}
            max={250}
            step={1}
            unit="cm"
            ariaLabel={t('auth.heightLabel')}
          />
        </div>
      ) : (
        <div className="form-row-group">
          <span className="form-row-group__label">
            {t('auth.heightLabel')} (FT{heightOptional ? `, ${t('auth.optional')}` : ''})
          </span>
          <div className="form-row-group__inputs">
            <div className="body-metrics-stepper">
              <span className="body-metrics-stepper__label">ft</span>
              <NumericStepper
                value={heightFeet}
                onChange={(next) => handleFeetInchesChange(next, heightInches)}
                min={3}
                max={8}
                step={1}
                ariaLabel={`${t('auth.heightLabel')} ft`}
              />
            </div>
            <div className="body-metrics-stepper">
              <span className="body-metrics-stepper__label">in</span>
              <NumericStepper
                value={heightInches}
                onChange={(next) => handleFeetInchesChange(heightFeet, next)}
                min={0}
                max={11}
                step={1}
                ariaLabel={`${t('auth.heightLabel')} in`}
              />
            </div>
          </div>
        </div>
      )}

      <div className={`body-metrics-stepper${weightInvalid ? ' body-metrics-stepper--invalid' : ''}`}>
        <span className="body-metrics-stepper__label">
          {t('auth.weightLabel')} ({unitWeight === 'kg' ? 'KG' : 'LB'}
          {weightOptional ? `, ${t('auth.optional')}` : ''})
        </span>
        {unitWeight === 'kg' ? (
          <NumericStepper
            value={weightKg}
            onChange={handleWeightKgValue}
            min={30}
            max={300}
            step={0.5}
            unit="kg"
            ariaLabel={t('auth.weightLabel')}
          />
        ) : (
          <NumericStepper
            value={weightLb}
            onChange={handleWeightLbValue}
            min={66}
            max={660}
            step={1}
            unit="lb"
            ariaLabel={t('auth.weightLabel')}
          />
        )}
      </div>
    </div>
  );
}
