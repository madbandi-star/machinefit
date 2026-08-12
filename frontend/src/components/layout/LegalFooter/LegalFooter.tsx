import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BUSINESS_OPERATOR, Role, hasMinRole } from '@machinefit/shared';
import { Icon } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/legal.css';

function SupportContact({ email }: { email: string }) {
  const { t } = useTranslation();
  return (
    <a className="legal-footer__support" href={`mailto:${email}`}>
      <Icon name="mail" size={14} className="legal-footer__support-icon" />
      <span className="legal-footer__support-copy">
        <span className="legal-footer__support-label">{t('legal.footer.supportEmail')}</span>
        <span className="legal-footer__support-email">{email}</span>
      </span>
    </a>
  );
}

function BusinessFooterBlock() {
  const { t } = useTranslation();
  const roleCode = useAuthStore((s) => s.user?.roleCode);
  const isAdmin = hasMinRole(roleCode, Role.ADMIN);
  const supportEmail = BUSINESS_OPERATOR.supportEmail.trim();

  // Non-admin (and guests): customer center email only — hide operator registration fields.
  if (!isAdmin) {
    if (!supportEmail) return null;
    return <SupportContact email={supportEmail} />;
  }

  const rows: Array<{ label: string; value: string }> = [
    { label: t('legal.footer.tradeName'), value: BUSINESS_OPERATOR.tradeName },
    { label: t('legal.footer.representative'), value: BUSINESS_OPERATOR.representative },
    {
      label: t('legal.footer.registrationNumber'),
      value: BUSINESS_OPERATOR.businessRegistrationNumber,
    },
    {
      label: t('legal.footer.mailOrderNumber'),
      value: BUSINESS_OPERATOR.mailOrderRegistrationNumber,
    },
    { label: t('legal.footer.address'), value: BUSINESS_OPERATOR.address },
  ].filter((row) => Boolean(row.value.trim()));

  const hasBusinessFields = rows.length > 0;

  return (
    <div className="legal-footer__business">
      <p className="legal-footer__business-title">{t('legal.footer.businessTitle')}</p>
      {hasBusinessFields ? (
        <dl className="legal-footer__business-list">
          {rows.map((row) => (
            <div key={row.label} className="legal-footer__business-row">
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="legal-footer__business-pending">{t('legal.footer.pendingNotice')}</p>
      )}
      {supportEmail ? <SupportContact email={supportEmail} /> : null}
    </div>
  );
}

export function LegalFooter({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <footer className={`legal-footer${compact ? ' legal-footer--landing' : ''}`}>
      <div className="legal-footer__links">
        <Link to={ROUTES.TERMS}>{t('legal.termsTitle')}</Link>
        <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
        <Link to={ROUTES.REFUND}>{t('legal.footer.refund')}</Link>
        <Link to={ROUTES.LEGAL_LOCATION}>{t('legal.locationTitle')}</Link>
        <Link to={ROUTES.LEGAL_MARKETING}>{t('legal.marketingTitle')}</Link>
        <Link to={ROUTES.LEGAL_COMMERCE}>{t('legal.commerceTitle')}</Link>
        <Link to={ROUTES.LEGAL_COMMUNITY}>{t('legal.footer.community')}</Link>
        <Link to={ROUTES.LEGAL_COPYRIGHT}>{t('legal.copyrightTitle')}</Link>
        <Link to={ROUTES.LEGAL_SECURITY}>{t('legal.footer.security')}</Link>
        <Link to={ROUTES.LEGAL_ILLEGAL_USE}>{t('legal.footer.illegalUse')}</Link>
        <Link to={ROUTES.LEGAL_AI}>{t('legal.aiTitle')}</Link>
        <Link to={ROUTES.SUPPORT}>{t('support.title')}</Link>
      </div>
      <BusinessFooterBlock />
      <p className="legal-footer__trademark">{t('compliance.disclaimer.trademark')}</p>
      <p className="legal-footer__cookies">{t('legal.cookieNotice')}</p>
    </footer>
  );
}
