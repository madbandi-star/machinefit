import { useTranslation } from 'react-i18next';
import {
  clearChunkRetryState,
  clearStaleAssetCaches,
  unregisterAllServiceWorkers,
} from '@/utils/chunkLoadRecovery';
import './RouteCrashScreen.css';

/**
 * User-facing fallback for non-chunk route/render errors.
 * Avoids the misleading "updating" screen when the failure is not a deploy cache miss.
 */
export function RouteCrashScreen() {
  const { t } = useTranslation();

  async function hardReload() {
    clearChunkRetryState();
    try {
      await unregisterAllServiceWorkers();
      await clearStaleAssetCaches();
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    url.searchParams.set('mf_recover', String(Date.now()));
    window.location.replace(url.toString());
  }

  function goHome() {
    const base = import.meta.env.BASE_URL || '/machinefit/';
    window.location.assign(base.endsWith('/') ? base : `${base}/`);
  }

  return (
    <div className="route-crash-screen" role="alert">
      <div className="route-crash-screen__card">
        <h1 className="route-crash-screen__title">{t('routeCrash.title')}</h1>
        <p className="route-crash-screen__desc">{t('routeCrash.desc')}</p>
        <div className="route-crash-screen__actions">
          <button type="button" className="btn btn--primary" onClick={() => void hardReload()}>
            {t('routeCrash.reload')}
          </button>
          <button type="button" className="btn" onClick={goHome}>
            {t('appUpdate.goHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
