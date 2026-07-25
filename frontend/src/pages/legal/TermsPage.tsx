import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGAL_DOC_VERSION } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ROUTES } from '@/constants/routes';
import '@/styles/legal.css';

export function TermsPage() {
  const { t } = useTranslation();
  return (
    <PageShell title={t('legal.termsTitle')}>
      <article className="legal-doc">
        <p className="legal-doc__meta">
          {t('legal.version', { version: LEGAL_DOC_VERSION })}
        </p>
        <p className="legal-doc__lead">{t('legal.termsLead')}</p>
        <h2>{t('legal.terms.s1Title')}</h2>
        <p>{t('legal.terms.s1Body')}</p>
        <h2>{t('legal.terms.s2Title')}</h2>
        <p>{t('legal.terms.s2Body')}</p>
        <h2>{t('legal.terms.s3Title')}</h2>
        <p>{t('legal.terms.s3Body')}</p>
        <h2>{t('legal.terms.s4Title')}</h2>
        <p>{t('legal.terms.s4Body')}</p>
        <h2>{t('legal.terms.s5Title')}</h2>
        <p>{t('legal.terms.s5Body')}</p>
        <p className="legal-doc__note">{t('legal.disclaimer')}</p>
        <p className="legal-doc__nav">
          <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
        </p>
      </article>
    </PageShell>
  );
}
