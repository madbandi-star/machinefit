import { Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useBrandFavoriteToggle } from '@/hooks/useBrandFavorites';
import './FavoriteBrandButton.css';

interface FavoriteBrandButtonProps {
  brandId: string;
  className?: string;
  size?: number;
}

export function FavoriteBrandButton({ brandId, className = '', size = 22 }: FavoriteBrandButtonProps) {
  const { t } = useTranslation('common');
  const { isFavorited, toggle, isPending, canToggle } = useBrandFavoriteToggle(brandId);

  return (
    <button
      type="button"
      className={`favorite-brand-btn${isFavorited ? ' favorite-brand-btn--on' : ''}${
        className ? ` ${className}` : ''
      }`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      disabled={!canToggle || isPending}
      aria-pressed={isFavorited}
      aria-label={
        isFavorited
          ? t('brandFavorites.removeAria')
          : t('brandFavorites.addAria')
      }
      title={
        isFavorited
          ? t('brandFavorites.removeAria')
          : t('brandFavorites.addAria')
      }
    >
      <Star
        size={size}
        strokeWidth={2}
        fill={isFavorited ? 'currentColor' : 'none'}
        aria-hidden
      />
    </button>
  );
}
