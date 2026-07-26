import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEasyModeStore } from '@/store/easyMode.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/easy-mode.css';

export function EasyHomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mode = useEasyModeStore((s) => s.mode);
  const setMode = useEasyModeStore((s) => s.setMode);
  const onboardingSeen = useEasyModeStore((s) => s.onboardingSeen);

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
        <Link to={ROUTES.HOME} className="easy-btn easy-btn--primary">
          {t('easyMode.backToNormalCta')}
        </Link>
      </div>
    );
  }

  if (!onboardingSeen) return null;

  return (
    <div className="easy-home">
      <header className="easy-home__header">
        <Link to={ROUTES.HOME} className="easy-home__logo">
          <img
            className="easy-home__logo-mark"
            src={`${import.meta.env.BASE_URL}assets/brand/machinefit-mark.svg`}
            alt=""
            width={34}
            height={34}
            decoding="async"
          />
          Machine<span className="easy-home__logo-fit">Fit</span>
        </Link>
      </header>

      <div className="easy-home__hero">
        <div className="easy-home__actions">
          <button
            type="button"
            className="easy-btn easy-btn--primary easy-btn--hero"
            onClick={() => navigate(ROUTES.EASY_WIZARD)}
          >
            {t('easyMode.startWorkout')}
          </button>
          <button
            type="button"
            className="easy-btn easy-btn--ghost"
            onClick={() => {
              setMode('normal');
              navigate(ROUTES.HOME);
            }}
          >
            {t('easyMode.switchModeHint')}
          </button>
        </div>
      </div>
    </div>
  );
}
