import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import { useRecommendMachine } from '@/hooks/useRecommendMachine';
import '@/styles/recommendation.css';

interface RecommendationActionBarProps {
  machineCode: string;
  onSave: () => void;
  isSaving: boolean;
  fixed?: boolean;
}

export function RecommendationActionBar({
  machineCode,
  onSave,
  isSaving,
  fixed = false,
}: RecommendationActionBarProps) {
  const { t } = useTranslation('machines');
  const { requestRecommendation, isPending: isRetrying } = useRecommendMachine(machineCode);
  const [menuOpen, setMenuOpen] = useState(false);

  const barClass = [
    'recommendation-action-bar',
    fixed ? 'recommendation-action-bar--fixed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={barClass}>
      <div className="recommendation-action-bar__primary-row">
        <button
          type="button"
          className="btn btn--primary recommendation-action-bar__save"
          onClick={onSave}
          disabled={isSaving}
        >
          <Icon name="heart" size={18} />
          {isSaving ? '...' : t('recommendation.saveFavorite')}
        </button>
        <button
          type="button"
          className="recommendation-action-bar__more"
          aria-expanded={menuOpen}
          aria-label={t('recommendation.moreActions')}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name="moreHorizontal" size={20} />
        </button>
      </div>
      {menuOpen && (
        <div className="recommendation-action-bar__menu" role="menu">
          <button
            type="button"
            className="recommendation-action-bar__menu-item"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              requestRecommendation();
            }}
            disabled={isRetrying}
          >
            <Icon name="refresh" size={18} />
            {isRetrying ? '...' : t('recommendation.retryRecommend')}
          </button>
          <Link
            to={`${ROUTES.GYMS}?machineCode=${machineCode}`}
            className="recommendation-action-bar__menu-item"
            role="menuitem"
            onClick={() => setMenuOpen(false)}
          >
            <Icon name="mapPin" size={18} />
            {t('recommendation.findGyms')}
          </Link>
        </div>
      )}
    </div>
  );
}
