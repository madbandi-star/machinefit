import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { getLocalizedName } from '@/utils/localizedName';
import { shouldShowDefaultMachineMuscle } from '@/utils/freeWeightDisplay';
import { SafeImage } from '@/components/media/SafeImage';
import {
  machinePlaceholderUrl,
  resolveRecordMachineImageUrl,
} from '@/utils/catalogAssets';
import '@/styles/machines.css';

interface MachineHeroProps {
  machine: Machine;
  compact?: boolean;
  selectedMuscle?: string | null;
}

export function MachineHero({ machine, compact = false, selectedMuscle = null }: MachineHeroProps) {
  const { t, i18n } = useTranslation('machines');
  const localizedName = getLocalizedName(machine.name, i18n.language, '');
  const isFreeWeight = isFreeWeightMachineCode(machine.code);
  const showDefaultMuscle = shouldShowDefaultMachineMuscle(machine.code);
  const typeLabel = t('machineTypes.free_weight');
  // FW target chips update `?muscle=` before the muscle-keyed query refetches;
  // prefer the per-muscle cover path so the hero swaps immediately (not only after refresh).
  const imageUrl = resolveRecordMachineImageUrl(machine.code, {
    primaryImageUrl: machine.primaryImageUrl,
    targetMuscleGroup: isFreeWeight ? selectedMuscle : undefined,
    preferMuscleCover: Boolean(isFreeWeight && selectedMuscle),
  });
  const displayMuscle =
    isFreeWeight && selectedMuscle
      ? selectedMuscle
      : showDefaultMuscle
        ? machine.muscleGroup
        : undefined;

  return (
    <div className={`machine-hero${compact ? ' machine-hero--compact' : ''}`}>
      {!compact && (
        <div className="machine-hero__image-wrap">
          {imageUrl ? (
            <SafeImage
              key={imageUrl}
              className="machine-hero__image"
              src={imageUrl}
              fallbackSrc={machinePlaceholderUrl()}
              alt={localizedName}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          ) : displayMuscle ? (
            <div className="machine-hero__muscle-icon" aria-hidden>
              <MuscleGroupIcon group={displayMuscle as MuscleGroup} size={120} />
            </div>
          ) : (
            <SafeImage
              className="machine-hero__image"
              src={machinePlaceholderUrl()}
              alt=""
              loading="eager"
              decoding="async"
            />
          )}
        </div>
      )}
      <h1 className="machine-hero__title">
        {isFreeWeight ? (
          <span className="machine-name-with-muscle">
            <span className="machine-name-with-muscle__label machine-hero__title-text">{localizedName}</span>
          </span>
        ) : (
          <MachineNameWithMuscle
            muscleGroup={machine.muscleGroup}
            name={localizedName}
            iconSize={28}
            labelClassName="machine-hero__title-text"
          />
        )}
      </h1>
      <div className="machine-hero__badges">
        {isFreeWeight ? (
          <span className="machine-badge machine-badge--type">{typeLabel}</span>
        ) : (
          <>
            <span className="machine-badge machine-badge--muscle">
              {t(`muscleGroups.${machine.muscleGroup}`, { defaultValue: machine.muscleGroup })}
            </span>
            <span className="machine-badge machine-badge--type">
              {t(`machineTypes.${machine.machineType}`, {
                defaultValue: machine.machineType.replace(/_/g, ' '),
              })}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
