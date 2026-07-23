import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEasyModeStore } from '@/store/easyMode.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/easy-mode.css';

export function EasyOnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const mode = useEasyModeStore((s) => s.mode);
  const setMode = useEasyModeStore((s) => s.setMode);
  const markOnboardingSeen = useEasyModeStore((s) => s.markOnboardingSeen);
  const showToast = useUIStore((s) => s.showToast);

  useEffect(() => {
    if (mode !== 'easy') {
      navigate(ROUTES.MY_PAGE, { replace: true });
    }
  }, [mode, navigate]);

  if (mode !== 'easy') return null;

  const finish = () => {
    markOnboardingSeen();
    navigate(ROUTES.EASY, { replace: true });
  };

  const backToNormal = () => {
    markOnboardingSeen();
    setMode('normal');
    showToast(t('easyMode.toastNormal'), 'success');
    navigate(ROUTES.MY_PAGE, { replace: true });
  };

  return (
    <div className="easy-onboarding">
      <p className="easy-home__eyebrow">{t('easyMode.badge')}</p>
      <h1 className="easy-heading">{t('easyMode.onboardingTitle')}</h1>
      <p className="easy-sub">{t('easyMode.onboardingLead')}</p>

      <div className="easy-onboarding__steps" aria-hidden>
        <div className="easy-onboarding__step">
          <strong>1</strong>
          <span>{t('easyMode.stepMachine')}</span>
        </div>
        <span className="easy-onboarding__arrow">→</span>
        <div className="easy-onboarding__step">
          <strong>2</strong>
          <span>{t('easyMode.stepRecommend')}</span>
        </div>
        <span className="easy-onboarding__arrow">→</span>
        <div className="easy-onboarding__step">
          <strong>3</strong>
          <span>{t('easyMode.stepLog')}</span>
        </div>
      </div>

      <ul className="easy-onboarding__bullets">
        <li>{t('easyMode.onboardingBullet1')}</li>
        <li>{t('easyMode.onboardingBullet2')}</li>
        <li>{t('easyMode.onboardingBullet3')}</li>
      </ul>

      <button type="button" className="easy-btn easy-btn--primary easy-btn--hero" onClick={finish}>
        {t('easyMode.onboardingCta')}
      </button>
      <button type="button" className="easy-btn easy-btn--ghost" onClick={backToNormal}>
        {t('easyMode.onboardingBackNormal')}
      </button>
      <Link to={ROUTES.MY_PAGE} className="easy-btn easy-btn--ghost">
        {t('easyMode.goMyPage')}
      </Link>
    </div>
  );
}
