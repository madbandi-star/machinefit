import { Link } from 'react-router-dom';
import type { Gym } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

interface GymCardProps {
  gym: Gym;
}

export function GymCard({ gym }: GymCardProps) {
  const href = ROUTES.GYM_DETAIL.replace(':gymId', gym.slug ?? gym.id);

  return (
    <Link to={href} className="card card--interactive gym-card">
      <div className="gym-card__header">
        <h3 className="gym-card__name">{gym.name}</h3>
        {gym.isVerified && <span className="gym-card__badge">✓ Verified</span>}
      </div>
      <p className="gym-card__location">
        {gym.city && `${gym.city}, `}{gym.countryCode ?? ''}
      </p>
      <p className="gym-card__address">{gym.address}</p>
      <div className="gym-card__meta">
        {gym.machineCount != null && (
          <span>🔧 {gym.machineCount} machines</span>
        )}
        {gym.distanceKm != null && (
          <span>📍 {gym.distanceKm} km</span>
        )}
      </div>
    </Link>
  );
}
