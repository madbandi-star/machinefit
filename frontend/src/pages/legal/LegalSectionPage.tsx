import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGAL_DOC_VERSION } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ROUTES } from '@/constants/routes';
import '@/styles/legal.css';

type DocKey =
  | 'location'
  | 'commerce'
  | 'community'
  | 'copyright'
  | 'aiDisclaimer';

const DOC_META: Record<
  DocKey,
  { titleKey: string; leadKey: string; sections: string[]; nav?: Array<{ to: string; labelKey: string }> }
> = {
  location: {
    titleKey: 'legal.locationTitle',
    leadKey: 'legal.locationLead',
    sections: ['s1', 's2', 's3', 's4', 's5'],
    nav: [
      { to: ROUTES.PRIVACY, labelKey: 'legal.privacyTitle' },
      { to: ROUTES.TERMS, labelKey: 'legal.termsTitle' },
    ],
  },
  commerce: {
    titleKey: 'legal.commerceTitle',
    leadKey: 'legal.commerceLead',
    sections: ['s1', 's2', 's3', 's4', 's5'],
    nav: [{ to: ROUTES.LEGAL_AI, labelKey: 'legal.aiTitle' }],
  },
  community: {
    titleKey: 'legal.communityTitle',
    leadKey: 'legal.communityLead',
    sections: ['s1', 's2', 's3', 's4', 's5'],
    nav: [{ to: ROUTES.LEGAL_COPYRIGHT, labelKey: 'legal.copyrightTitle' }],
  },
  copyright: {
    titleKey: 'legal.copyrightTitle',
    leadKey: 'legal.copyrightLead',
    sections: ['s1', 's2', 's3', 's4', 's5'],
    nav: [{ to: ROUTES.SUPPORT, labelKey: 'support.title' }],
  },
  aiDisclaimer: {
    titleKey: 'legal.aiTitle',
    leadKey: 'legal.aiLead',
    sections: ['s1', 's2', 's3', 's4'],
    nav: [{ to: ROUTES.LEGAL_COMMERCE, labelKey: 'legal.commerceTitle' }],
  },
};

const NS: Record<DocKey, string> = {
  location: 'locationDoc',
  commerce: 'commerce',
  community: 'communityDoc',
  copyright: 'copyright',
  aiDisclaimer: 'ai',
};

export function LegalSectionPage({ doc }: { doc: DocKey }) {
  const { t } = useTranslation();
  const meta = DOC_META[doc];
  const ns = NS[doc];

  return (
    <PageShell title={t(meta.titleKey)}>
      <article className="legal-doc">
        <p className="legal-doc__meta">
          {t('legal.version', { version: LEGAL_DOC_VERSION })} · {t('legal.regionKr')}
        </p>
        <p className="legal-doc__lead">{t(meta.leadKey)}</p>
        {meta.sections.map((s) => (
          <section key={s}>
            <h2>{t(`legal.${ns}.${s}Title`)}</h2>
            <p>{t(`legal.${ns}.${s}Body`)}</p>
          </section>
        ))}
        <p className="legal-doc__note">{t('legal.disclaimer')}</p>
        {meta.nav && meta.nav.length > 0 && (
          <p className="legal-doc__nav">
            {meta.nav.map((n, i) => (
              <span key={n.to}>
                {i > 0 ? ' · ' : null}
                <Link to={n.to}>{t(n.labelKey)}</Link>
              </span>
            ))}
          </p>
        )}
      </article>
    </PageShell>
  );
}

export function LocationLegalPage() {
  return <LegalSectionPage doc="location" />;
}
export function CommerceLegalPage() {
  return <LegalSectionPage doc="commerce" />;
}
export function CommunityLegalPage() {
  return <LegalSectionPage doc="community" />;
}
export function CopyrightLegalPage() {
  return <LegalSectionPage doc="copyright" />;
}
export function AiDisclaimerLegalPage() {
  return <LegalSectionPage doc="aiDisclaimer" />;
}
