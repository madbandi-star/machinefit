import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';

const PREVIEW_KEYS = ['gatePreviewStars', 'gatePreviewParts', 'gatePreviewIndex'] as const;

/**
 * Locked empty state for /fortune/today when birth profile is missing.
 */
export function FortuneBirthGate() {
  const { t } = useTranslation('fortune');

  return (
    <div className="fr-page fr-gate">
      <header className="fr-gate__hero">
        <div className="fr-gate__glow" aria-hidden />
        <div className="fr-gate__orb" aria-hidden>
          <span className="fr-gate__orb-ring" />
          <span className="fr-gate__orb-core" />
          <span className="fr-gate__orb-glyph">✦</span>
        </div>
        <p className="fr-gate__brand">{t('title')}</p>
        <h2 className="fr-gate__headline">{t('gateHeadline')}</h2>
        <p className="fr-gate__lead">{t('needsBirth')}</p>
      </header>

      <section className="fr-gate__preview" aria-label={t('gatePreviewLabel')}>
        <p className="fr-gate__preview-label">{t('gatePreviewLabel')}</p>
        <ul className="fr-gate__preview-list">
          {PREVIEW_KEYS.map((key) => (
            <li key={key} className="fr-gate__preview-item">
              <span className="fr-gate__lock" aria-hidden />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="fr-gate__actions">
        <Link
          to={`${ROUTES.SETTINGS}#birth-profile`}
          className="btn btn--primary btn--block fr-gate__cta"
        >
          {t('enterBirth')}
        </Link>
        <p className="fr-gate__note">{t('gateNote')}</p>
      </div>
    </div>
  );
}
