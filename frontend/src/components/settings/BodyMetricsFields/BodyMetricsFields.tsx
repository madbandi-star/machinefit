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
import { ScrollPicker } from '@/components/form/ScrollPicker/ScrollPicker';
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

  const handleFeetInchesChange = (feet: number, inches: number) => {
    setHeightFeet(feet);
    setHeightInches(inches);
    onHeightCmChange(toStandardHeight(feet, 'ft_in', inches));
  };

  const handleWeightKgValue = (value: number) => {
    onWeightKgChange(value);
    setWeightLb(kgToLb(value));
  };

  const handleWeightLbValue = (value: number) => {
    setWeightLb(value);
    onWeightKgChange(toStandardWeight(value, 'lb'));
  };

  return (
    <div className="form-stack">
      {unitHeight === 'cm' ? (
        <div className={`body-metrics-picker${heightInvalid ? ' body-metrics-picker--invalid' : ''}`}>
          <span className="body-metrics-picker__label">
            {t('auth.heightLabel')} (CM{heightOptional ? `, ${t('auth.optional')}` : ''})
          </span>
          <ScrollPicker
            value={heightCm}
            onChange={handleHeightCmChange}
            min={100}
            max={250}
            step={1}
            unit="cm"
            defaultValue={175}
            initializeOnMount={!heightOptional}
            ariaLabel={t('auth.heightLabel')}
          />
        </div>
      ) : (
        <div className={`body-metrics-picker${heightInvalid ? ' body-metrics-picker--invalid' : ''}`}>
          <span className="body-metrics-picker__label">
            {t('auth.heightLabel')} (FT{heightOptional ? `, ${t('auth.optional')}` : ''})
          </span>
          <div className="body-metrics-picker__row">
            <div className="body-metrics-picker__column">
              <span className="body-metrics-picker__sublabel">ft</span>
              <ScrollPicker
                value={heightFeet}
                onChange={(next) => handleFeetInchesChange(next, heightInches ?? 9)}
                min={3}
                max={8}
                step={1}
                defaultValue={5}
                initializeOnMount={!heightOptional}
                ariaLabel={`${t('auth.heightLabel')} ft`}
              />
            </div>
            <div className="body-metrics-picker__column">
              <span className="body-metrics-picker__sublabel">in</span>
              <ScrollPicker
                value={heightInches}
                onChange={(next) => handleFeetInchesChange(heightFeet ?? 5, next)}
                min={0}
                max={11}
                step={1}
                defaultValue={9}
                ariaLabel={`${t('auth.heightLabel')} in`}
              />
            </div>
          </div>
        </div>
      )}

      <div className={`body-metrics-picker${weightInvalid ? ' body-metrics-picker--invalid' : ''}`}>
        <span className="body-metrics-picker__label">
          {t('auth.weightLabel')} ({unitWeight === 'kg' ? 'KG' : 'LB'}
          {weightOptional ? `, ${t('auth.optional')}` : ''})
        </span>
        {unitWeight === 'kg' ? (
          <ScrollPicker
            value={weightKg}
            onChange={handleWeightKgValue}
            min={30}
            max={300}
            step={0.5}
            unit="kg"
            defaultValue={70}
            initializeOnMount={!weightOptional}
            ariaLabel={t('auth.weightLabel')}
          />
        ) : (
          <ScrollPicker
            value={weightLb}
            onChange={handleWeightLbValue}
            min={66}
            max={660}
            step={1}
            unit="lb"
            defaultValue={154}
            initializeOnMount={!weightOptional}
            ariaLabel={t('auth.weightLabel')}
          />
        )}
      </div>
    </div>
  );
}
