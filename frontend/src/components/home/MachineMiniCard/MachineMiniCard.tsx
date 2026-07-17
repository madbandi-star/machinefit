import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MuscleGroupIcon } from '@/components/muscle/MuscleGroupIcon/MuscleGroupIcon';
import { MachineNameWithMuscle } from '@/components/muscle/MachineNameWithMuscle/MachineNameWithMuscle';
import type { MuscleGroup } from '@/constants/muscle-groups';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';

interface MachineMiniCardProps {
  machineCode: string;
  machineName: string;
  muscleGroup?: string;
  imageUrl?: string;
  recommendationId?: string;
}

export function MachineMiniCard({
  machineCode,
  machineName,
  muscleGroup,
  imageUrl,
  recommendationId,
}: MachineMiniCardProps) {
  const { t } = useTranslation('machines');
  const muscleLabel = muscleGroup
    ? t(`muscleGroups.${muscleGroup}`, { defaultValue: muscleGroup })
    : undefined;

  const to = recommendationId
    ? `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', machineCode)}?id=${recommendationId}`
    : ROUTES.MACHINE_DETAIL.replace(':machineCode', machineCode);

  return (
    <Link to={to} className="machine-mini-card">
      <div className="machine-mini-card__thumb">
        {imageUrl ? (
          <img src={imageUrl} alt="" loading="lazy" />
        ) : muscleGroup ? (
          <div className="machine-mini-card__muscle-icon" aria-hidden>
            <MuscleGroupIcon group={muscleGroup as MuscleGroup} size={44} />
          </div>
        ) : (
          <div className="machine-mini-card__placeholder" aria-hidden>
            🏋️
          </div>
        )}
      </div>
      <p className="machine-mini-card__name">
        {muscleGroup ? (
          <MachineNameWithMuscle
            muscleGroup={muscleGroup}
            name={machineName}
            iconSize={14}
            labelClassName="machine-mini-card__name-text"
          />
        ) : (
          machineName
        )}
      </p>
      {muscleLabel && !muscleGroup && (
        <p className="machine-mini-card__meta">{muscleLabel}</p>
      )}
    </Link>
  );
}
