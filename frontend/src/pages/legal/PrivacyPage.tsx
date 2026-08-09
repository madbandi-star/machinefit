import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGAL_DOC_VERSIONS } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ROUTES } from '@/constants/routes';
import '@/styles/legal.css';

export function PrivacyPage() {
  const { t } = useTranslation();
  const version = LEGAL_DOC_VERSIONS.privacy;

  return (
    <PageShell title={t('legal.privacyTitle')}>
      <article className="legal-doc">
        <p className="legal-doc__meta">
          {t('legal.version', { version })} · {t('legal.regionKr')}
        </p>
        <p className="legal-doc__lead">{t('legal.privacyLead')}</p>
        <h2>{t('legal.privacy.s1Title')}</h2>
        <p>{t('legal.privacy.s1Body')}</p>
        <h2>{t('legal.privacy.s2Title')}</h2>
        <p>{t('legal.privacy.s2Body')}</p>
        <h2>{t('legal.privacy.s3Title')}</h2>
        <p>{t('legal.privacy.s3Body')}</p>
        <h2>{t('legal.privacy.s4Title')}</h2>
        <p>{t('legal.privacy.s4Body')}</p>
        <h2>{t('legal.privacy.s5Title')}</h2>
        <p>{t('legal.privacy.s5Body')}</p>
        <h2>{t('legal.privacy.s6Title')}</h2>
        <p>{t('legal.privacy.s6Body')}</p>
        <h2>{t('legal.privacy.s7Title')}</h2>
        <p>{t('legal.privacy.s7Body')}</p>
        <h2>{t('legal.privacy.s8Title')}</h2>
        <p>{t('legal.privacy.s8Body')}</p>
        <p className="legal-doc__nav">
          <Link to={ROUTES.TERMS}>{t('legal.termsTitle')}</Link>
          {' · '}
          <Link to={ROUTES.LEGAL_SECURITY}>{t('legal.footer.security')}</Link>
          {' · '}
          <Link to={ROUTES.PRIVACY_RIGHTS}>{t('compliance.rights.title')}</Link>
        </p>
      </article>
    </PageShell>
  );
}
