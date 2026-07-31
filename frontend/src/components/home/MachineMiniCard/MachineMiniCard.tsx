import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { ROUTES } from '@/constants/routes';
import { getHistoryMuscleGroup, formatFreeWeightRecordLabel, formatBrandedMachineLabel } from '@/utils/freeWeightDisplay';
import { SafeImage } from '@/components/media/SafeImage';
import { machinePlaceholderUrl, resolveMachineImageUrl } from '@/utils/catalogAssets';
import { API_BASE_URL } from '@/services/http/axios-client';
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

/** Home recent-row only: history primaryImageUrl is the default cover, not per-muscle. */
function homeFreeWeightMuscleCoverUrl(machineCode: string, muscle: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  return `${base}/media/machine-covers/${encodeURIComponent(machineCode)}/${encodeURIComponent(muscle)}/main`;
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
  const coverUrl =
    isFreeWeightMachineCode(machineCode) && targetMuscleGroup
      ? homeFreeWeightMuscleCoverUrl(machineCode, targetMuscleGroup)
      : imageUrl;
  const resolvedImageUrl = resolveMachineImageUrl(machineCode, coverUrl);

  const to = recommendationId
    ? `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', machineCode)}?id=${recommendationId}`
    : ROUTES.MACHINE_DETAIL.replace(':machineCode', machineCode);

  return (
    <Link to={to} className="machine-mini-card">
      <div className="machine-mini-card__thumb">
        {resolvedImageUrl ? (
          <SafeImage
            src={resolvedImageUrl}
            fallbackSrc={machinePlaceholderUrl()}
            alt=""
            loading="lazy"
            width={136}
            height={136}
          />
        ) : displayMuscle ? (
          <div className="machine-mini-card__muscle-icon" aria-hidden>
            <MuscleGroupIcon group={displayMuscle as MuscleGroup} size={44} />
          </div>
        ) : (
          <div className="machine-mini-card__placeholder" aria-hidden />
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
