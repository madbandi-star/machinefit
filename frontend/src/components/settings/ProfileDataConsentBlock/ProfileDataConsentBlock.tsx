import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  required = true,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  required?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <label className="profile-consent__row" htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        className="profile-consent__check"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="profile-consent__row-text">
        {required ? (
          <span className="profile-consent__badge">{t('auth.required')}</span>
        ) : null}
        {label}
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
        <p className="profile-consent__done-body">
          {t(`${prefix}.doneBody`, { version: versionLabel ?? '' })}
        </p>
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
        <p className="profile-consent__intro">{t(`${prefix}.intro`)}</p>
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
        />
        <ConsentCheckRow
          id={`${variant}-retention`}
          checked={checks.retention}
          onChange={set('retention')}
          label={t(`${prefix}.checkRetention`)}
        />
        <ConsentCheckRow
          id={`${variant}-rights`}
          checked={checks.rights}
          onChange={set('rights')}
          label={t(`${prefix}.checkRights`)}
        />
        {variant === 'birthProfile' ? (
          <>
            <ConsentCheckRow
              id={`${variant}-entertainment`}
              checked={Boolean(checks.entertainment)}
              onChange={set('entertainment')}
              label={t(`${prefix}.checkEntertainment`)}
            />
            <ConsentCheckRow
              id={`${variant}-age14`}
              checked={Boolean(checks.age14)}
              onChange={set('age14')}
              label={t(`${prefix}.checkAge14`)}
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
