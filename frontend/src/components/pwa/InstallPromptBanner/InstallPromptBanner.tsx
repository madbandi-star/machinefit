import { useTranslation } from 'react-i18next';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import '@/styles/phase4.css';

export function InstallPromptBanner() {
  const { t } = useTranslation();
  const { canPrompt, install, dismiss } = usePwaInstall();

  if (!canPrompt) return null;

  return (
    <div className="pwa-install-banner" role="region" aria-label={t('pwa.installTitle')}>
      <div className="pwa-install-banner__text">
        <strong>{t('pwa.installTitle')}</strong>
        <span>{t('pwa.installHint')}</span>
      </div>
      <div className="pwa-install-banner__actions">
        <button type="button" className="btn btn--primary" onClick={() => install()}>
          {t('pwa.installAction')}
        </button>
        <button type="button" className="btn btn--secondary" onClick={dismiss}>
          {t('actions.cancel')}
        </button>
      </div>
    </div>
  );
}
