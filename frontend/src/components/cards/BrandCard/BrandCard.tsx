import { Link } from 'react-router-dom';
import type { Brand } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

interface BrandCardProps {
  brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
  const name = brand.name.en ?? brand.code;

  return (
    <Link
      to={ROUTES.BRAND_DETAIL.replace(':brandCode', brand.code)}
      className="card card--interactive"
    >
      <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{name}</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{brand.code}</p>
    </Link>
  );
}
