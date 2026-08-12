import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEGAL_DOC_VERSIONS } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
import { ROUTES } from '@/constants/routes';
import { LegalDocSection } from './LegalDocSection';
import '@/styles/legal.css';

type DocKey =
  | 'location'
  | 'marketing'
  | 'commerce'
  | 'community'
  | 'copyright'
  | 'aiDisclaimer'
  | 'security'
  | 'illegalUse';

const DOC_META: Record<
  DocKey,
  {
    titleKey: string;
    leadKey: string;
    sections: string[];
    versionKey: keyof typeof LEGAL_DOC_VERSIONS;
    nav?: Array<{ to: string; labelKey: string }>;
  }
> = {
  location: {
    titleKey: 'legal.locationTitle',
    leadKey: 'legal.locationLead',
    sections: ['s1', 's2', 's3', 's4', 's5'],
    versionKey: 'location',
    nav: [
      { to: ROUTES.PRIVACY, labelKey: 'legal.privacyTitle' },
      { to: ROUTES.TERMS, labelKey: 'legal.termsTitle' },
    ],
  },
  marketing: {
    titleKey: 'legal.marketingTitle',
    leadKey: 'legal.marketingLead',
    sections: ['s1', 's2', 's3', 's4'],
    versionKey: 'marketing',
    nav: [
      { to: ROUTES.PRIVACY, labelKey: 'legal.privacyTitle' },
      { to: ROUTES.TERMS, labelKey: 'legal.termsTitle' },
    ],
  },
  commerce: {
    titleKey: 'legal.commerceTitle',
    leadKey: 'legal.commerceLead',
    sections: ['s1', 's2', 's3', 's4', 's5'],
    versionKey: 'commerce',
    nav: [
      { to: ROUTES.LEGAL_AI, labelKey: 'legal.aiTitle' },
      { to: ROUTES.SUPPORT, labelKey: 'support.title' },
    ],
  },
  community: {
    titleKey: 'legal.communityTitle',
    leadKey: 'legal.communityLead',
    sections: ['s1', 's2', 's3', 's4', 's5'],
    versionKey: 'community',
    nav: [{ to: ROUTES.LEGAL_COPYRIGHT, labelKey: 'legal.copyrightTitle' }],
  },
  copyright: {
    titleKey: 'legal.copyrightTitle',
    leadKey: 'legal.copyrightLead',
    sections: ['s1', 's2', 's3', 's4', 's5', 's6'],
    versionKey: 'copyright',
    nav: [{ to: ROUTES.SUPPORT, labelKey: 'support.title' }],
  },
  aiDisclaimer: {
    titleKey: 'legal.aiTitle',
    leadKey: 'legal.aiLead',
    sections: ['s1', 's2', 's3', 's4'],
    versionKey: 'ai',
    nav: [{ to: ROUTES.LEGAL_COMMERCE, labelKey: 'legal.commerceTitle' }],
  },
  security: {
    titleKey: 'legal.securityTitle',
    leadKey: 'legal.securityLead',
    sections: ['s1', 's2', 's3', 's4'],
    versionKey: 'security',
    nav: [
      { to: ROUTES.PRIVACY, labelKey: 'legal.privacyTitle' },
      { to: ROUTES.SUPPORT, labelKey: 'support.title' },
    ],
  },
  illegalUse: {
    titleKey: 'legal.illegalUseTitle',
    leadKey: 'legal.illegalUseLead',
    sections: ['s1', 's2', 's3', 's4'],
    versionKey: 'illegalUse',
    nav: [
      { to: ROUTES.TERMS, labelKey: 'legal.termsTitle' },
      { to: ROUTES.SUPPORT, labelKey: 'support.title' },
    ],
  },
};

const NS: Record<DocKey, string> = {
  location: 'locationDoc',
  marketing: 'marketingDoc',
  commerce: 'commerce',
  community: 'communityDoc',
  copyright: 'copyright',
  aiDisclaimer: 'ai',
  security: 'securityDoc',
  illegalUse: 'illegalUseDoc',
};

export function LegalSectionPage({ doc }: { doc: DocKey }) {
  const { t } = useTranslation();
  const meta = DOC_META[doc];
  const ns = NS[doc];
  const version = LEGAL_DOC_VERSIONS[meta.versionKey];

  return (
    <PageShell title={t(meta.titleKey)}>
      <article className="legal-doc">
        <p className="legal-doc__meta">
          {t('legal.version', { version })} · {t('legal.regionKr')}
        </p>
        <GuideProse text={t(meta.leadKey)} variant="lead" />
        {meta.sections.map((s) => (
          <LegalDocSection
            key={s}
            title={t(`legal.${ns}.${s}Title`)}
            body={t(`legal.${ns}.${s}Body`)}
          />
        ))}
        {meta.nav && meta.nav.length > 0 ? (
          <p className="legal-doc__nav">
            {meta.nav.map((n, i) => (
              <span key={n.to}>
                {i > 0 ? ' · ' : null}
                <Link to={n.to}>{t(n.labelKey)}</Link>
              </span>
            ))}
          </p>
        ) : null}
      </article>
    </PageShell>
  );
}

export function LocationLegalPage() {
  return <LegalSectionPage doc="location" />;
}
export function MarketingLegalPage() {
  return <LegalSectionPage doc="marketing" />;
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
export function SecurityLegalPage() {
  return <LegalSectionPage doc="security" />;
}
export function IllegalUseLegalPage() {
  return <LegalSectionPage doc="illegalUse" />;
}
