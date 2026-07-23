import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEasyModeStore } from '@/store/easyMode.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { ROUTES } from '@/constants/routes';
import '@/styles/easy-mode.css';

export function EasyHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mode = useEasyModeStore((s) => s.mode);
  const onboardingSeen = useEasyModeStore((s) => s.onboardingSeen);
  const { activeGym } = useActiveGym();

  useEffect(() => {
    if (mode === 'easy' && !onboardingSeen) {
      navigate(ROUTES.EASY_ONBOARDING, { replace: true });
    }
  }, [mode, onboardingSeen, navigate]);

  if (mode !== 'easy') {
    return (
      <div className="easy-home">
        <h1 className="easy-heading">{t('easyMode.normalRequiredTitle')}</h1>
        <p className="easy-sub">{t('easyMode.normalRequiredDesc')}</p>
        <Link to={ROUTES.MY_PAGE} className="easy-btn easy-btn--primary">
          {t('easyMode.goMyPage')}
        </Link>
      </div>
    );
  }

  if (!onboardingSeen) return null;

  return (
    <div className="easy-home">
      <header className="easy-home__header">
        <div className="easy-home__header-text">
          <p className="easy-home__eyebrow">{t('easyMode.badge')}</p>
          <h1 className="easy-home__title">{t('easyMode.homeTitle')}</h1>
          <p className="easy-home__gym">
            {activeGym?.name?.trim() || t('easyMode.gymUnset')}
          </p>
        </div>
        <Link to={ROUTES.MY_PAGE} className="easy-shell__icon-btn" aria-label={t('easyMode.menu')}>
          ≡
        </Link>
      </header>

      <div className="easy-home__hero">
        <button
          type="button"
          className="easy-btn easy-btn--primary easy-btn--hero"
          onClick={() => navigate(ROUTES.EASY_WIZARD)}
        >
          {t('easyMode.startWorkout')}
        </button>
      </div>

      <div className="easy-home__foot">
        <button
          type="button"
          className="easy-btn easy-btn--ghost"
          onClick={() => navigate(ROUTES.MY_PAGE)}
        >
          {t('easyMode.switchModeHint')}
        </button>
      </div>
    </div>
  );
}
