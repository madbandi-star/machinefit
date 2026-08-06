import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CHUNK_RETRY_WAIT_MS, manualChunkRecover } from '@/utils/chunkLoadRecovery';
import { ROUTES } from '@/constants/routes';
import './AppUpdateScreen.css';

interface AppUpdateScreenProps {
  /** Start countdown + auto retry on mount (default true). */
  autoRetry?: boolean;
}

export function AppUpdateScreen({ autoRetry = true }: AppUpdateScreenProps) {
  const { t } = useTranslation();
  const totalSec = Math.max(1, Math.round(CHUNK_RETRY_WAIT_MS / 1000));
  const [seconds, setSeconds] = useState(totalSec);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!autoRetry) return;

    setSeconds(totalSec);
    const started = Date.now();
    const tick = window.setInterval(() => {
      const left = Math.max(0, totalSec - Math.floor((Date.now() - started) / 1000));
      setSeconds(left);
      if (left <= 0) {
        window.clearInterval(tick);
      }
    }, 250);

    const reloadTimer = window.setTimeout(() => {
      void runRetry();
    }, CHUNK_RETRY_WAIT_MS);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(reloadTimer);
    };
  }, [autoRetry, totalSec]);

  async function runRetry() {
    if (busy) return;
    setBusy(true);
    try {
      await manualChunkRecover();
    } finally {
      setBusy(false);
    }
  }

  function goHome() {
    const base = import.meta.env.BASE_URL || '/machinefit/';
    try {
      window.location.assign(base.endsWith('/') ? base : `${base}/`);
    } catch {
      window.location.href = ROUTES.HOME;
    }
  }

  return (
    <div className="app-update-screen" role="status" aria-live="polite">
      <div className="app-update-screen__card">
        <h1 className="app-update-screen__title">{t('appUpdate.title')}</h1>
        <p className="app-update-screen__desc">{t('appUpdate.desc')}</p>
        <p className="app-update-screen__countdown font-tabular" aria-label={String(seconds)}>
          {seconds}
        </p>
        <div className="app-update-screen__actions">
          <button
            type="button"
            className="btn btn--primary app-update-screen__btn"
            disabled={busy}
            onClick={() => void runRetry()}
          >
            {t('appUpdate.retryNow')}
          </button>
          <button
            type="button"
            className="btn app-update-screen__btn"
            disabled={busy}
            onClick={goHome}
          >
            {t('appUpdate.goHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
