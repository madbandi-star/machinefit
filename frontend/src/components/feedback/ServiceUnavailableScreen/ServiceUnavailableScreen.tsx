import { useTranslation } from 'react-i18next';
import { useApiHealthStore } from '@/store/apiHealth.store';
import './ServiceUnavailableScreen.css';

/**
 * Full-screen recovery UI for API / network outages.
 * Mounted only when apiHealthStore.outage is set — does not alter normal screens.
 */
export function ServiceUnavailableScreen() {
  const { t } = useTranslation();
  const outage = useApiHealthStore((s) => s.outage);
  const lastStatus = useApiHealthStore((s) => s.lastStatus);
  const clearOutage = useApiHealthStore((s) => s.clearOutage);

  if (!outage) return null;

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
