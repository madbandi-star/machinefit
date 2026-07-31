import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
      <p>{t(`compliance.disclaimer.${variant}`)}</p>
      <Link to={VARIANT_TO_ROUTE[variant]}>{t('compliance.disclaimer.learnMore')}</Link>
    </aside>
  );
}

export function SponsoredBadge() {
  const { t } = useTranslation();
  return <span className="sponsored-badge">{t('compliance.sponsoredBadge')}</span>;
}
