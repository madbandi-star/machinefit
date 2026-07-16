import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
        ) : (
          <div className="machine-mini-card__placeholder" aria-hidden>
            🏋️
          </div>
        )}
      </div>
      <p className="machine-mini-card__name">{machineName}</p>
      {muscleLabel && <p className="machine-mini-card__meta">{muscleLabel}</p>}
    </Link>
  );
}
