import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGAL_DOC_VERSIONS } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
import { ROUTES } from '@/constants/routes';
import { LegalDocSection } from './LegalDocSection';
import '@/styles/legal.css';

const TERMS_SECTIONS = ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'] as const;

export function TermsPage() {
  const { t } = useTranslation();
  const version = LEGAL_DOC_VERSIONS.terms;

  return (
    <PageShell title={t('legal.termsTitle')}>
      <article className="legal-doc">
        <p className="legal-doc__meta">
          {t('legal.version', { version })} · {t('legal.regionKr')}
        </p>
        <GuideProse text={t('legal.termsLead')} variant="lead" />
        {TERMS_SECTIONS.map((section) => (
          <LegalDocSection
            key={section}
            title={t(`legal.terms.${section}Title`)}
            body={t(`legal.terms.${section}Body`)}
          />
        ))}
        <p className="legal-doc__nav">
          <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
          {' · '}
          <Link to={ROUTES.REFUND}>{t('legal.footer.refund')}</Link>
        </p>
      </article>
    </PageShell>
  );
}
