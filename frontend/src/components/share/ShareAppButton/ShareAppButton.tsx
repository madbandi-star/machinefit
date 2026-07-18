import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { useUIStore } from '@/store/ui.store';

interface ShareAppButtonProps {
  variant?: 'header' | 'block';
}

function getShareUrl(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${base}`.replace(/\/+$/, '/');
}

export function ShareAppButton({ variant = 'block' }: ShareAppButtonProps) {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);

  const handleShare = async () => {
    const url = getShareUrl();
    const payload = {
      title: t('share.title'),
      text: t('share.text'),
      url,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${payload.text}\n${url}`);
      showToast(t('share.copied'), 'success');
    } catch {
      showToast(t('errors.submitFailed'), 'error');
    }
  };

  if (variant === 'header') {
    return (
      <button
        type="button"
        className="header-action-btn"
        onClick={handleShare}
        aria-label={t('share.action')}
      >
        <Icon name="share" size={20} />
      </button>
    );
  }

  return (
    <button type="button" className="btn btn--secondary btn--block share-app-btn" onClick={handleShare}>
      <Icon name="share" size={18} />
      {t('share.action')}
    </button>
  );
}
