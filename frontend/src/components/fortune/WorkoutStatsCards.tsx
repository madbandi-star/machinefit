import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCountUp } from '@/hooks/useCountUp';
import { ROUTES } from '@/constants/routes';

interface WorkoutStatsCardsProps {
  workoutCount7d: number;
  workoutCount30d: number;
  animate?: boolean;
}

function StatCard({
  emoji,
  label,
  value,
  unit,
  animate,
}: {
  emoji: string;
  label: string;
  value: number;
  unit: string;
  animate?: boolean;
}) {
  const shown = useCountUp(value, 850, animate !== false);
  return (
    <div className="fortune-stat-card">
      <p className="fortune-stat-card__label">
        <span aria-hidden>{emoji}</span> {label}
      </p>
      <p className="fortune-stat-card__value">{shown}</p>
      <p className="fortune-stat-card__unit">{unit}</p>
    </div>
  );
}

export function WorkoutStatsCards({
  workoutCount7d,
  workoutCount30d,
  animate = true,
}: WorkoutStatsCardsProps) {
  const { t } = useTranslation('fortune');

  return (
    <div className="fortune-stats">
      <div className="fortune-stats__grid">
        <StatCard
          emoji="📅"
          label={t('stat7d')}
          value={workoutCount7d}
          unit={t('stat7dUnit')}
          animate={animate}
        />
        <StatCard
          emoji="📆"
          label={t('stat30d')}
          value={workoutCount30d}
          unit={t('stat30dUnit')}
          animate={animate}
        />
      </div>
      <Link to={`${ROUTES.RECORDS}?tab=history`} className="fortune-stats__link">
        {t('cta.records')}
      </Link>
    </div>
  );
}
