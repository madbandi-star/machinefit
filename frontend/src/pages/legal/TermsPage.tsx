import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGAL_DOC_VERSIONS } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ROUTES } from '@/constants/routes';
import '@/styles/legal.css';

export function TermsPage() {
  const { t } = useTranslation();
  const version = LEGAL_DOC_VERSIONS.terms;

  return (
    <PageShell title={t('legal.termsTitle')}>
      <article className="legal-doc">
        <p className="legal-doc__meta">
          {t('legal.version', { version })} · {t('legal.regionKr')}
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
        <h2>{t('legal.terms.s6Title')}</h2>
        <p>{t('legal.terms.s6Body')}</p>
        <h2>{t('legal.terms.s7Title')}</h2>
        <p>{t('legal.terms.s7Body')}</p>
        <h2>{t('legal.terms.s8Title')}</h2>
        <p>{t('legal.terms.s8Body')}</p>
        <h2>{t('legal.terms.s9Title')}</h2>
        <p>{t('legal.terms.s9Body')}</p>
        <h2>{t('legal.terms.s10Title')}</h2>
        <p>{t('legal.terms.s10Body')}</p>
        <p className="legal-doc__nav">
          <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
          {' · '}
          <Link to={ROUTES.REFUND}>{t('legal.footer.refund')}</Link>
        </p>
      </article>
    </PageShell>
  );
}
