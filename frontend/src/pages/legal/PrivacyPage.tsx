import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGAL_DOC_VERSIONS } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
import { ROUTES } from '@/constants/routes';
import { LegalDocSection } from './LegalDocSection';
import '@/styles/legal.css';

const PRIVACY_SECTIONS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] as const;

export function PrivacyPage() {
  const { t } = useTranslation();
  const version = LEGAL_DOC_VERSIONS.privacy;

  return (
    <PageShell title={t('legal.privacyTitle')}>
      <article className="legal-doc">
        <p className="legal-doc__meta">
          {t('legal.version', { version })} · {t('legal.regionKr')}
        </p>
        <GuideProse text={t('legal.privacyLead')} variant="lead" />
        {PRIVACY_SECTIONS.map((section) => (
          <LegalDocSection
            key={section}
            title={t(`legal.privacy.${section}Title`)}
            body={t(`legal.privacy.${section}Body`)}
          />
        ))}
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
