import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApiHealthStore } from '@/store/apiHealth.store';
import { useWorkoutSessionTimerStore } from '@/store/workoutSessionTimer.store';
import './ServiceUnavailableScreen.css';

function isWorkoutCriticalPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return (
    p.includes('/history') ||
    p.includes('/records') ||
    p.includes('/machines') ||
    p.includes('/easy') ||
    p.includes('/recommend')
  );
}

/**
 * Full-screen recovery UI for API / network outages.
 * Suppressed during active workout / records paths so users keep logging offline.
 */
export function ServiceUnavailableScreen() {
  const { t } = useTranslation();
  const location = useLocation();
  const outage = useApiHealthStore((s) => s.outage);
  const lastStatus = useApiHealthStore((s) => s.lastStatus);
  const clearOutage = useApiHealthStore((s) => s.clearOutage);
  const sessionRunning = useWorkoutSessionTimerStore((s) => s.status === 'running');

  if (!outage) return null;
  if (sessionRunning || isWorkoutCriticalPath(location.pathname)) return null;

  const titleKey =
    outage === 'network'
      ? 'serviceUnavailable.networkTitle'
      : lastStatus === 503
        ? 'serviceUnavailable.unavailableTitle'
        : 'serviceUnavailable.serverTitle';

  function refresh() {
    clearOutage();
    window.location.reload();
  }

  return (
    <div className="service-unavailable-screen" role="alert" aria-live="assertive">
      <div className="service-unavailable-screen__card">
        <h1 className="service-unavailable-screen__title">{t(titleKey)}</h1>
        <p className="service-unavailable-screen__desc">{t('serviceUnavailable.desc')}</p>
        <div className="service-unavailable-screen__actions">
          <button type="button" className="service-unavailable-screen__btn" onClick={refresh}>
            {t('serviceUnavailable.refresh')}
          </button>
        </div>
      </div>
    </div>
  );
}
