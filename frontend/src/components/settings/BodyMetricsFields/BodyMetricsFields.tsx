import { useEffect, useMemo, useState } from 'react';
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
import {
  DEFAULT_AGE,
  DEFAULT_HEIGHT_CM,
  DEFAULT_WEIGHT_KG,
  DEFAULT_WEIGHT_LB,
} from '@/constants/body-metrics-defaults';
import '@/styles/components.css';

interface BodyMetricsFieldsProps {
  unitHeight: UnitHeight;
  unitWeight: UnitWeight;
  heightCm?: number;
  weightKg?: number;
  age?: number;
  onHeightCmChange: (heightCm: number | undefined) => void;
  onWeightKgChange: (weightKg: number | undefined) => void;
  onAgeChange?: (age: number) => void;
  heightOptional?: boolean;
  weightOptional?: boolean;
  heightInvalid?: boolean;
  weightInvalid?: boolean;
  ageInvalid?: boolean;
  initializeOnMount?: boolean;
  pickerSize?: 'default' | 'compact';
}

export function BodyMetricsFields({
  unitHeight,
  unitWeight,
  heightCm,
  weightKg,
  age,
  onHeightCmChange,
  onWeightKgChange,
  onAgeChange,
  heightOptional = false,
  weightOptional = true,
  heightInvalid = false,
  weightInvalid = false,
  ageInvalid = false,
  initializeOnMount = false,
  pickerSize = 'default',
}: BodyMetricsFieldsProps) {
  const { t } = useTranslation();
  const defaultFeetInches = useMemo(() => cmToFeetInches(DEFAULT_HEIGHT_CM), []);
  const [heightFeet, setHeightFeet] = useState<number | undefined>(undefined);
  const [heightInches, setHeightInches] = useState<number | undefined>(undefined);
  const [weightLb, setWeightLb] = useState<number | undefined>(
    weightKg != null ? kgToLb(weightKg) : undefined
  );

  const initHeight = initializeOnMount && !heightOptional;
  const initWeight = initializeOnMount && !weightOptional;
  const initAge = initializeOnMount && !!onAgeChange;

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

  const heightUnitLabel = unitHeight === 'cm' ? 'cm' : 'ft/in';
  const weightUnitLabel = unitWeight === 'kg' ? 'kg' : 'lb';

  return (
    <div
      className={`body-metrics-inline${
        heightInvalid || weightInvalid || ageInvalid ? ' body-metrics-inline--invalid' : ''
      }`}
    >
      <div className="body-metrics-inline__grid">
        <div
          className={`body-metrics-inline__cell${
            heightInvalid ? ' body-metrics-inline__cell--invalid' : ''
          }`}
        >
          <span className="body-metrics-inline__label">
            {t('auth.heightLabel')}
            <span className="body-metrics-inline__unit">{heightUnitLabel}</span>
          </span>
          {unitHeight === 'cm' ? (
            <ScrollPicker
              value={heightCm}
              onChange={handleHeightCmChange}
              min={100}
              max={250}
              step={1}
              size={pickerSize}
              defaultValue={DEFAULT_HEIGHT_CM}
              initializeOnMount={initHeight}
              ariaLabel={t('auth.heightLabel')}
              formatValue={(value) => String(value)}
            />
          ) : (
            <div className="body-metrics-inline__imperial">
              <ScrollPicker
                value={heightFeet}
                onChange={(next) =>
                  handleFeetInchesChange(next, heightInches ?? defaultFeetInches.inches)
                }
                min={3}
                max={8}
                step={1}
                size={pickerSize}
                defaultValue={defaultFeetInches.feet}
                initializeOnMount={initHeight}
                ariaLabel={`${t('auth.heightLabel')} ft`}
                formatValue={(value) => `${value}'`}
              />
              <ScrollPicker
                value={heightInches}
                onChange={(next) =>
                  handleFeetInchesChange(heightFeet ?? defaultFeetInches.feet, next)
                }
                min={0}
                max={11}
                step={1}
                size={pickerSize}
                defaultValue={defaultFeetInches.inches}
                ariaLabel={`${t('auth.heightLabel')} in`}
                formatValue={(value) => `${value}"`}
              />
            </div>
          )}
        </div>

        <div
          className={`body-metrics-inline__cell${
            weightInvalid ? ' body-metrics-inline__cell--invalid' : ''
          }`}
        >
          <span className="body-metrics-inline__label">
            {t('auth.weightLabel')}
            <span className="body-metrics-inline__unit">{weightUnitLabel}</span>
          </span>
          {unitWeight === 'kg' ? (
            <ScrollPicker
              value={weightKg}
              onChange={handleWeightKgValue}
              min={30}
              max={300}
              step={0.5}
              size={pickerSize}
              defaultValue={DEFAULT_WEIGHT_KG}
              initializeOnMount={initWeight}
              ariaLabel={t('auth.weightLabel')}
              formatValue={(value) =>
                Number.isInteger(value) ? String(value) : value.toFixed(1)
              }
            />
          ) : (
            <ScrollPicker
              value={weightLb}
              onChange={handleWeightLbValue}
              min={66}
              max={660}
              step={1}
              size={pickerSize}
              defaultValue={DEFAULT_WEIGHT_LB}
              initializeOnMount={initWeight}
              ariaLabel={t('auth.weightLabel')}
              formatValue={(value) => String(value)}
            />
          )}
        </div>

        {onAgeChange ? (
          <div
            className={`body-metrics-inline__cell${
              ageInvalid ? ' body-metrics-inline__cell--invalid' : ''
            }`}
          >
            <span className="body-metrics-inline__label">
              {t('auth.ageLabel')}
              <span className="body-metrics-inline__unit">{t('auth.ageUnitShort')}</span>
            </span>
            <ScrollPicker
              value={age}
              onChange={onAgeChange}
              min={13}
              max={100}
              step={1}
              size={pickerSize}
              defaultValue={DEFAULT_AGE}
              initializeOnMount={initAge}
              ariaLabel={t('auth.ageLabel')}
              formatValue={(value) => String(value)}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
