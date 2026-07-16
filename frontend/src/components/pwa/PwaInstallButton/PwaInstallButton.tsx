import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { useUIStore } from '@/store/ui.store';
import '@/styles/pwa.css';

interface PwaInstallButtonProps {
  variant?: 'default' | 'header';
}

export function PwaInstallButton({ variant = 'default' }: PwaInstallButtonProps) {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const { canInstall, hasNativePrompt, installMode, install } = usePwaInstall();

  if (!canInstall) return null;

  const handleClick = async () => {
    if (hasNativePrompt) {
      const accepted = await install();
      if (accepted) {
        showToast(t('pwa.installSuccess'), 'success');
      }
      return;
    }

    const hintKey =
      installMode === 'ios'
        ? 'pwa.iosInstallHint'
        : installMode === 'android'
          ? 'pwa.chromeMobileInstallHint'
          : 'pwa.chromeInstallHint';

    showToast(t(hintKey), 'info');
  };

  return (
    <button
      type="button"
      className={`pwa-install-button${variant === 'header' ? ' pwa-install-button--header' : ''}`}
      onClick={() => void handleClick()}
      aria-label={t('pwa.addToHome')}
    >
      <Icon name="home" size={variant === 'header' ? 15 : 16} aria-hidden />
      <span className="pwa-install-button__label">{t('pwa.addToHome')}</span>
    </button>
  );
}
