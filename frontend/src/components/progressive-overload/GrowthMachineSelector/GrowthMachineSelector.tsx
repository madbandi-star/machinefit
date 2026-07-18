import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SegmentedControl } from '@/components/form/SegmentedControl/SegmentedControl';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import type { TargetMuscleGroup } from '@machinefit/shared';
import '@/styles/growth-analysis.css';
import '@/styles/machines.css';

export interface GrowthMachineSelectorOption {
  optionKey: string;
  label: string;
  isFreeWeight: boolean;
  targetMuscleGroup?: TargetMuscleGroup;
}

type MachineGroupFilter = 'all' | 'freeWeight' | 'machines';

interface GrowthMachineSelectorProps {
  label: string;
  options: GrowthMachineSelectorOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function GrowthMachineSelector({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: GrowthMachineSelectorProps) {
  const { t } = useTranslation('common');
  const [groupFilter, setGroupFilter] = useState<MachineGroupFilter>('all');
  const chipRefs = useRef(new Map<string, HTMLButtonElement | null>());

  const filteredOptions = useMemo(() => {
    if (groupFilter === 'all') return options;
    if (groupFilter === 'freeWeight') {
      return options.filter((option) => option.isFreeWeight);
    }
    return options.filter((option) => !option.isFreeWeight);
  }, [groupFilter, options]);

  useEffect(() => {
    if (filteredOptions.length === 0) return;
    if (!filteredOptions.some((option) => option.optionKey === value)) {
      onChange(filteredOptions[0].optionKey);
    }
  }, [filteredOptions, onChange, value]);

  const selectedIndex = filteredOptions.findIndex((option) => option.optionKey === value);
  const selectedOption =
    selectedIndex >= 0 ? filteredOptions[selectedIndex] : filteredOptions[0];
  const canNavigate = filteredOptions.length > 1;

  useEffect(() => {
    if (!value) return;
    const chip = chipRefs.current.get(value);
    chip?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [value, groupFilter]);

  const moveSelection = (direction: -1 | 1) => {
    if (!canNavigate || selectedIndex < 0) return;
    const nextIndex =
      (selectedIndex + direction + filteredOptions.length) % filteredOptions.length;
    onChange(filteredOptions[nextIndex].optionKey);
  };

  const groupOptions = [
    { value: 'all' as const, label: t('growthAnalysis.machineSelector.all') },
    { value: 'freeWeight' as const, label: t('growthAnalysis.machineGroups.freeWeight') },
    { value: 'machines' as const, label: t('growthAnalysis.machineGroups.machines') },
  ];

  if (options.length === 0) {
    return (
      <div className="growth-machine-selector">
        <span className="growth-machine-selector__label">{label}</span>
        <p className="growth-machine-selector__empty">{t('growthAnalysis.empty')}</p>
      </div>
    );
  }

  return (
    <div className="growth-machine-selector">
      <span className="growth-machine-selector__label">{label}</span>

      <div className="growth-machine-selector__navigator" role="group" aria-label={label}>
        <button
          type="button"
          className="growth-machine-selector__nav-btn"
          aria-label={t('growthAnalysis.machineSelector.previous')}
          disabled={disabled || !canNavigate}
          onClick={() => moveSelection(-1)}
        >
          ‹
        </button>

        <div className="growth-machine-selector__current" aria-live="polite">
          <strong className="growth-machine-selector__current-label">
            {selectedOption?.label ?? t('picker.selectOption')}
          </strong>
          {filteredOptions.length > 0 ? (
            <span className="growth-machine-selector__counter">
              {t('growthAnalysis.machineSelector.counter', {
                current: selectedIndex >= 0 ? selectedIndex + 1 : 1,
                total: filteredOptions.length,
              })}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          className="growth-machine-selector__nav-btn"
          aria-label={t('growthAnalysis.machineSelector.next')}
          disabled={disabled || !canNavigate}
          onClick={() => moveSelection(1)}
        >
          ›
        </button>
      </div>

      <SegmentedControl
        value={groupFilter}
        options={groupOptions}
        onChange={setGroupFilter}
        ariaLabel={t('growthAnalysis.machineSelector.groupFilter')}
        size="compact"
        className="growth-machine-selector__groups"
      />

      <div
        className="filter-chips growth-machine-selector__chips"
        role="listbox"
        aria-label={label}
      >
        {filteredOptions.map((option) => {
          const isActive = option.optionKey === value;
          return (
            <button
              key={option.optionKey}
              ref={(node) => {
                chipRefs.current.set(option.optionKey, node);
              }}
              type="button"
              role="option"
              aria-selected={isActive}
              className={`filter-chip${isActive ? ' filter-chip--active' : ''}`}
              disabled={disabled}
              onClick={() => onChange(option.optionKey)}
            >
              {option.targetMuscleGroup ? (
                <MuscleGroupIcon
                  group={option.targetMuscleGroup}
                  size={22}
                  className="filter-chip__icon"
                />
              ) : null}
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
