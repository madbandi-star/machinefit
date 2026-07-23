import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '@/store/ui.store';
import { useEasyModeStore, type AppUiMode } from '@/store/easyMode.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/easy-mode.css';

/** Additive My Page block — does not alter existing menu rows. */
export function EasyModeSettingsBlock() {
  const { t } = useTranslation();
  const mode = useEasyModeStore((s) => s.mode);
  const setMode = useEasyModeStore((s) => s.setMode);
  const onboardingSeen = useEasyModeStore((s) => s.onboardingSeen);
  const showToast = useUIStore((s) => s.showToast);

  const select = (next: AppUiMode) => {
    if (next === mode) return;
    setMode(next);
    showToast(
      next === 'easy' ? t('easyMode.toastEasy') : t('easyMode.toastNormal'),
      'success'
    );
  };

  return (
    <section className="my-page-section easy-mode-block" aria-label={t('easyMode.sectionTitle')}>
      <h3 className="my-page-section__title">{t('easyMode.sectionTitle')}</h3>
      <p className="easy-mode-block__desc">{t('easyMode.sectionDesc')}</p>

      <button
        type="button"
        className={`easy-mode-option${mode === 'normal' ? ' easy-mode-option--on' : ''}`}
        onClick={() => select('normal')}
        aria-pressed={mode === 'normal'}
      >
        <div className="easy-mode-option__title">
          <span>{t('easyMode.normalTitle')}</span>
          <span className="easy-mode-option__badge">{t('easyMode.normalBadge')}</span>
        </div>
        <p className="easy-mode-option__text">{t('easyMode.normalDesc')}</p>
      </button>

      <button
        type="button"
        className={`easy-mode-option${mode === 'easy' ? ' easy-mode-option--on' : ''}`}
        onClick={() => select('easy')}
        aria-pressed={mode === 'easy'}
      >
        <div className="easy-mode-option__title">
          <span>{t('easyMode.easyTitle')}</span>
        </div>
        <p className="easy-mode-option__text">{t('easyMode.easyDesc')}</p>
      </button>

      {mode === 'easy' ? (
        <Link
          to={onboardingSeen ? ROUTES.EASY : ROUTES.EASY_ONBOARDING}
          className="btn btn--primary btn--block"
          style={{ marginTop: '0.35rem' }}
        >
          {t('easyMode.openEasyCta')}
        </Link>
      ) : null}

      <p className="easy-mode-block__foot">{t('easyMode.sectionFoot')}</p>
    </section>
  );
}
