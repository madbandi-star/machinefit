import { useTranslation } from 'react-i18next';
import {
  POPULAR_EMAIL_DOMAINS,
  type PopularEmailDomain,
} from '@/utils/demoRegisterDefaults';
import '@/styles/components.css';

interface RegisterEmailFieldProps {
  localPart: string;
  domain: PopularEmailDomain;
  onLocalPartChange: (value: string) => void;
  onDomainChange: (domain: PopularEmailDomain) => void;
  invalid?: boolean;
}

export function RegisterEmailField({
  localPart,
  domain,
  onLocalPartChange,
  onDomainChange,
  invalid = false,
}: RegisterEmailFieldProps) {
  const { t } = useTranslation();

  return (
    <div className={`register-email-field${invalid ? ' register-email-field--invalid' : ''}`}>
      <label className="register-email-field__label" htmlFor="register-email-local">
        {t('auth.emailLabel')}
      </label>
      <div className="register-email-field__row">
        <input
          id="register-email-local"
          className={`input register-email-field__local${invalid ? ' input--invalid' : ''}`}
          type="text"
          inputMode="email"
          autoComplete="username"
          placeholder={t('auth.emailLocalPlaceholder')}
          value={localPart}
          onChange={(e) => onLocalPartChange(e.target.value)}
        />
        <span className="register-email-field__at" aria-hidden>
          @
        </span>
        <span className="register-email-field__domain-display">{domain}</span>
      </div>
      <div className="register-email-field__domains" role="group" aria-label={t('auth.emailDomainLabel')}>
        {POPULAR_EMAIL_DOMAINS.map((option) => (
          <button
            key={option}
            type="button"
            className={`register-email-field__domain${domain === option ? ' register-email-field__domain--active' : ''}`}
            aria-pressed={domain === option}
            onClick={() => onDomainChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
