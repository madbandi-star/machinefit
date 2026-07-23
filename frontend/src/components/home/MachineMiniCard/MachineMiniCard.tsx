import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { ROUTES } from '@/constants/routes';
import { getHistoryMuscleGroup, formatFreeWeightRecordLabel, formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import { resolveMachineImageUrl } from '@/utils/catalogAssets';
import '@/styles/home.css';

interface MachineMiniCardProps {
  machineCode: string;
  machineName: string;
  brandName?: string;
  muscleGroup?: string;
  targetMuscleGroup?: string;
  imageUrl?: string;
  recommendationId?: string;
}

export function MachineMiniCard({
  machineCode,
  machineName,
  brandName,
  muscleGroup,
  targetMuscleGroup,
  imageUrl,
  recommendationId,
}: MachineMiniCardProps) {
  const { t } = useTranslation('machines');
  const displayMuscle = getHistoryMuscleGroup(machineCode, muscleGroup, targetMuscleGroup);
  const baseName = formatBrandedMachineLabel(machineName, brandName, machineCode);
  const displayName = formatFreeWeightRecordLabel(
    baseName,
    isFreeWeightMachineCode(machineCode) ? targetMuscleGroup : undefined,
    (group) => t(`muscleGroups.${group}`, { defaultValue: group })
  );
  const muscleLabel = displayMuscle
    ? t(`muscleGroups.${displayMuscle}`, { defaultValue: displayMuscle })
    : undefined;
  const resolvedImageUrl = resolveMachineImageUrl(machineCode, imageUrl);

  const to = recommendationId
    ? `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', machineCode)}?id=${recommendationId}`
    : ROUTES.MACHINE_DETAIL.replace(':machineCode', machineCode);

  return (
    <Link to={to} className="machine-mini-card">
      <div className="machine-mini-card__thumb">
        {resolvedImageUrl ? (
          <img src={resolvedImageUrl} alt="" loading="lazy" width={120} height={96} />
        ) : displayMuscle ? (
          <div className="machine-mini-card__muscle-icon" aria-hidden>
            <MuscleGroupIcon group={displayMuscle as MuscleGroup} size={44} />
          </div>
        ) : (
          <div className="machine-mini-card__placeholder" aria-hidden>
            🏋️
          </div>
        )}
      </div>
      <p className="machine-mini-card__name">
        {displayMuscle && !isFreeWeightMachineCode(machineCode) ? (
          <MachineNameWithMuscle
            muscleGroup={displayMuscle}
            name={displayName}
            iconSize={14}
            labelClassName="machine-mini-card__name-text"
          />
        ) : (
          displayName
        )}
      </p>
      {muscleLabel && !displayMuscle && (
        <p className="machine-mini-card__meta">{muscleLabel}</p>
      )}
    </Link>
  );
}
