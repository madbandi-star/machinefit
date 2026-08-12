import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Check, FileText, ShieldCheck, ShieldUser, Sparkles } from 'lucide-react';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
import { ROUTES } from '@/constants/routes';
import '@/styles/profile-data-consent.css';

export type ProfileConsentVariant = 'bodyMetrics' | 'birthProfile' | 'locationGym';

export type ProfileConsentChecks = {
  purpose: boolean;
  retention: boolean;
  rights: boolean;
  /** Birth-only: entertainment / non-medical disclaimer */
  entertainment?: boolean;
  /** Birth-only: age 14+ attestation */
  age14?: boolean;
};

type ProfileDataConsentBlockProps = {
  variant: ProfileConsentVariant;
  checks: ProfileConsentChecks;
  onChange: (next: ProfileConsentChecks) => void;
  /** When true, show compact “already agreed” state. */
  alreadyAgreed?: boolean;
  versionLabel?: string;
};

const VARIANT_I18N_PREFIX: Record<ProfileConsentVariant, string> = {
  bodyMetrics: 'settings.consentBody',
  birthProfile: 'settings.consentBirth',
  locationGym: 'settings.consentLocation',
};

function ConsentCheckRow({
  id,
  checked,
  onChange,
  label,
  icon,
  required = true,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: ReactNode;
  required?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <label
      className={`profile-consent__row${checked ? ' profile-consent__row--on' : ''}`}
      htmlFor={id}
    >
      <span className="profile-consent__check-wrap" aria-hidden={!checked}>
        <input
          id={id}
          type="checkbox"
          className="profile-consent__check"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        {checked ? (
          <span className="profile-consent__check-mark" aria-hidden>
            <Check size={12} strokeWidth={3.5} />
          </span>
        ) : null}
      </span>
      <span className="profile-consent__row-body">
        {required ? (
          <span className="profile-consent__badge">{t('auth.required')}</span>
        ) : (
          <span className="profile-consent__badge profile-consent__badge--optional">
            {t('auth.optional')}
          </span>
        )}
        <span className="profile-consent__row-label">{label}</span>
      </span>
      <span className="profile-consent__row-icon" aria-hidden>
        {icon}
      </span>
    </label>
  );
}

export function allProfileConsentsChecked(
  variant: ProfileConsentVariant,
  checks: ProfileConsentChecks
): boolean {
  if (!checks.purpose || !checks.retention || !checks.rights) return false;
  if (variant === 'birthProfile') {
    return Boolean(checks.entertainment && checks.age14);
  }
  return true;
}

export function emptyProfileConsentChecks(
  variant: ProfileConsentVariant
): ProfileConsentChecks {
  if (variant === 'birthProfile') {
    return {
      purpose: false,
      retention: false,
      rights: false,
      entertainment: false,
      age14: false,
    };
  }
  return { purpose: false, retention: false, rights: false };
}

/**
 * Required legal notices + checkboxes before saving body metrics, birth profile,
 * or location/home gym. Feature-scoped — does not replace global terms/privacy reconsent.
 */
export function ProfileDataConsentBlock({
  variant,
  checks,
  onChange,
  alreadyAgreed = false,
  versionLabel,
}: ProfileDataConsentBlockProps) {
  const { t } = useTranslation();
  const prefix = VARIANT_I18N_PREFIX[variant];

  if (alreadyAgreed) {
    return (
      <aside className="profile-consent profile-consent--done" role="status">
        <p className="profile-consent__done-title">{t(`${prefix}.doneTitle`)}</p>
        <GuideProse
          className="profile-consent__done-body"
          text={t(`${prefix}.doneBody`, { version: versionLabel ?? '' })}
          variant="compact"
        />
        <p className="profile-consent__links">
          <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
          <span aria-hidden>·</span>
          <Link to={ROUTES.PRIVACY_RIGHTS}>{t('settings.consentRightsLink')}</Link>
        </p>
      </aside>
    );
  }

  const set =
    (key: keyof ProfileConsentChecks) =>
    (value: boolean) =>
      onChange({ ...checks, [key]: value });

  return (
    <aside
      className="profile-consent"
      role="group"
      aria-label={t(`${prefix}.title`)}
    >
      <header className="profile-consent__header">
        <h3 className="profile-consent__title">{t(`${prefix}.title`)}</h3>
        <GuideProse className="profile-consent__intro" text={t(`${prefix}.intro`)} variant="muted" />
      </header>

      <ul className="profile-consent__notice-list">
        <li>{t(`${prefix}.noticePurpose`)}</li>
        <li>{t(`${prefix}.noticeItems`)}</li>
        <li>{t(`${prefix}.noticeRetention`)}</li>
        <li>{t(`${prefix}.noticeDisposal`)}</li>
        <li>{t(`${prefix}.noticeThirdParty`)}</li>
      </ul>

      <div className="profile-consent__checks">
        <ConsentCheckRow
          id={`${variant}-purpose`}
          checked={checks.purpose}
          onChange={set('purpose')}
          label={t(`${prefix}.checkPurpose`)}
          icon={<FileText size={20} strokeWidth={2} />}
        />
        <ConsentCheckRow
          id={`${variant}-retention`}
          checked={checks.retention}
          onChange={set('retention')}
          label={t(`${prefix}.checkRetention`)}
          icon={<CalendarDays size={20} strokeWidth={2} />}
        />
        <ConsentCheckRow
          id={`${variant}-rights`}
          checked={checks.rights}
          onChange={set('rights')}
          label={t(`${prefix}.checkRights`)}
          icon={<ShieldUser size={20} strokeWidth={2} />}
        />
        {variant === 'birthProfile' ? (
          <>
            <ConsentCheckRow
              id={`${variant}-entertainment`}
              checked={Boolean(checks.entertainment)}
              onChange={set('entertainment')}
              label={t(`${prefix}.checkEntertainment`)}
              icon={<Sparkles size={20} strokeWidth={2} />}
            />
            <ConsentCheckRow
              id={`${variant}-age14`}
              checked={Boolean(checks.age14)}
              onChange={set('age14')}
              label={t(`${prefix}.checkAge14`)}
              icon={<ShieldCheck size={20} strokeWidth={2} />}
            />
          </>
        ) : null}
      </div>

      <p className="profile-consent__links">
        <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
        <span aria-hidden>·</span>
        <Link to={ROUTES.TERMS}>{t('legal.termsTitle')}</Link>
        <span aria-hidden>·</span>
        <Link to={ROUTES.PRIVACY_RIGHTS}>{t('settings.consentRightsLink')}</Link>
      </p>
    </aside>
  );
}
