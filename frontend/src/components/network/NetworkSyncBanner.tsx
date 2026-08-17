import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNetworkSyncStore } from '@/store/networkSync.store';
import '@/styles/network-sync-banner.css';

export function NetworkSyncBanner() {
  const { t } = useTranslation('common');
  const banner = useNetworkSyncStore((s) => s.banner);

  useEffect(() => {
    if (banner !== 'synced') return;
    const tId = window.setTimeout(() => {
      const s = useNetworkSyncStore.getState();
      if (s.banner === 'synced') s.setBanner(null);
    }, 2800);
    return () => window.clearTimeout(tId);
  }, [banner]);

  if (!banner) return null;

  const message =
    banner === 'offline'
      ? t('network.offlineSafe')
      : banner === 'syncing'
        ? t('network.syncing')
        : t('network.synced');

  return (
    <div
      className={`network-sync-banner network-sync-banner--${banner}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
