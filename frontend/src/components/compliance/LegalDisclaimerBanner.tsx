import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, ChevronRight, Info } from 'lucide-react';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
import { ROUTES } from '@/constants/routes';
import './LegalDisclaimerBanner.css';

type Variant = 'ai' | 'health' | 'pt' | 'commerce' | 'sponsored' | 'trademark';

const VARIANT_TO_ROUTE: Record<Variant, string> = {
  ai: ROUTES.LEGAL_AI,
  health: ROUTES.LEGAL_AI,
  pt: ROUTES.LEGAL_AI,
  commerce: ROUTES.LEGAL_COMMERCE,
  sponsored: ROUTES.LEGAL_COMMUNITY,
  trademark: ROUTES.LEGAL_COPYRIGHT,
};

interface LegalDisclaimerBannerProps {
  variant: Variant;
  compact?: boolean;
  /** Sit at end of page content, above MainLayout legal footer (does not invade it). */
  pageBottom?: boolean;
}

export function LegalDisclaimerBanner({
  variant,
  compact,
  pageBottom,
}: LegalDisclaimerBannerProps) {
  const { t } = useTranslation();

  if (variant === 'ai') {
    return (
      <aside
        className={[
          'legal-disclaimer',
          'legal-disclaimer--ai-card',
          compact ? 'legal-disclaimer--compact' : '',
          pageBottom ? 'legal-disclaimer--page-bottom' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="note"
      >
        <div className="legal-disclaimer__icon" aria-hidden>
          <BrainCircuit size={20} strokeWidth={1.75} />
        </div>
        <div className="legal-disclaimer__body">
          <p className="legal-disclaimer__eyebrow">{t('compliance.disclaimer.aiTitle')}</p>
          <p className="legal-disclaimer__lead">{t('compliance.disclaimer.aiCardBody')}</p>
          <p className="legal-disclaimer__caution">
            <Info size={14} strokeWidth={2.25} aria-hidden />
            <span>{t('compliance.disclaimer.aiCardHighlight')}</span>
          </p>
          <Link className="legal-disclaimer__more" to={VARIANT_TO_ROUTE.ai}>
            {t('compliance.disclaimer.learnMoreCard')}
            <ChevronRight size={14} strokeWidth={2.25} aria-hidden />
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={[
        'legal-disclaimer',
        compact ? 'legal-disclaimer--compact' : '',
        pageBottom ? 'legal-disclaimer--page-bottom' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="note"
    >
      <GuideProse text={t(`compliance.disclaimer.${variant}`)} variant="compact" />
      <Link className="legal-disclaimer__more" to={VARIANT_TO_ROUTE[variant]}>
        {t('compliance.disclaimer.learnMore')}
        <ChevronRight size={14} strokeWidth={2.25} aria-hidden />
      </Link>
    </aside>
  );
}

export function SponsoredBadge() {
  const { t } = useTranslation();
  return <span className="sponsored-badge">{t('compliance.sponsoredBadge')}</span>;
}
