import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useUIStore } from '@/store/ui.store';
import '@/styles/pwa.css';

export function PwaInstallButton() {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const { canInstall, hasNativePrompt, install } = usePwaInstall();

  if (!canInstall) return null;

  const handleClick = async () => {
    if (hasNativePrompt) {
      const accepted = await install();
      if (accepted) {
        showToast(t('pwa.installSuccess'), 'success');
      }
      return;
    }

    showToast(t('pwa.iosInstallHint'), 'info');
  };

  return (
    <button
      type="button"
      className="pwa-install-button"
      onClick={() => void handleClick()}
      aria-label={t('pwa.addToHome')}
    >
      <Icon name="home" size={16} aria-hidden />
      <span className="pwa-install-button__label">{t('pwa.addToHome')}</span>
    </button>
  );
}
