import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import '@/styles/home.css';

interface MachineMiniCardProps {
  machineCode: string;
  machineName: string;
  muscleGroup?: string;
  imageUrl?: string;
}

export function MachineMiniCard({
  machineCode,
  machineName,
  muscleGroup,
  imageUrl,
}: MachineMiniCardProps) {
  const { t } = useTranslation('machines');
  const muscleLabel = muscleGroup
    ? t(`muscleGroups.${muscleGroup}`, { defaultValue: muscleGroup })
    : undefined;

  return (
    <Link
      to={ROUTES.MACHINE_DETAIL.replace(':machineCode', machineCode)}
      className="machine-mini-card"
    >
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
