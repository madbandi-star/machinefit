import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/icons/Icon';
import { getMarketingShareUrl } from '@/config/site';
import { useUIStore } from '@/store/ui.store';

interface ShareAppButtonProps {
  variant?: 'header' | 'block';
}

export function ShareAppButton({ variant = 'block' }: ShareAppButtonProps) {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);

  const handleShare = async () => {
    const url = getMarketingShareUrl();
    const payload = {
      title: t('share.title'),
      text: t('share.text'),
      url,
    };
    const markShared = () => {
      void import('@/utils/opsTelemetry').then(({ trackFeature }) => trackFeature('share'));
      void import('@/utils/usageTelemetry').then(({ trackUsage }) => {
        const path = typeof location !== 'undefined' ? location.pathname : '';
        if (/^\/(lifter-dna|growth-|lifted-weight|achievements)/.test(path)) {
          trackUsage('insight_share');
        } else if (/^\/(live|my-page\/lab)/.test(path)) {
          trackUsage('lab_share');
        } else {
          trackUsage('insight_share');
        }
      });
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(payload);
        markShared();
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${payload.text}\n${url}`);
      markShared();
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
