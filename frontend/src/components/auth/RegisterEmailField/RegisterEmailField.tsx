import { useTranslation } from 'react-i18next';
import {
  POPULAR_EMAIL_DOMAINS,
  type PopularEmailDomain,
} from '@/utils/demoRegisterDefaults';
import '@/styles/components.css';

export type EmailDomainPreset = PopularEmailDomain | 'custom';

interface RegisterEmailFieldProps {
  localPart: string;
  domainPreset: EmailDomainPreset;
  customDomain: string;
  onLocalPartChange: (value: string) => void;
  onDomainPresetChange: (preset: EmailDomainPreset) => void;
  onCustomDomainChange: (value: string) => void;
  invalid?: boolean;
}

export function RegisterEmailField({
  localPart,
  domainPreset,
  customDomain,
  onLocalPartChange,
  onDomainPresetChange,
  onCustomDomainChange,
  invalid = false,
}: RegisterEmailFieldProps) {
  const { t } = useTranslation();
  const isCustom = domainPreset === 'custom';
  const activeDomain = isCustom ? customDomain : domainPreset;

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
        {isCustom ? (
          <input
            id="register-email-domain-custom"
            className={`input register-email-field__domain-input${invalid ? ' input--invalid' : ''}`}
            type="text"
            inputMode="url"
            autoComplete="off"
            placeholder={t('auth.emailCustomDomainPlaceholder')}
            value={customDomain}
            onChange={(e) => onCustomDomainChange(e.target.value.replace(/^@+/, ''))}
          />
        ) : (
          <span className="register-email-field__domain-display">{activeDomain}</span>
        )}
      </div>
      <div className="register-email-field__domains" role="group" aria-label={t('auth.emailDomainLabel')}>
        {POPULAR_EMAIL_DOMAINS.map((option) => (
          <button
            key={option}
            type="button"
            className={`register-email-field__domain${
              domainPreset === option ? ' register-email-field__domain--active' : ''
            }`}
            aria-pressed={domainPreset === option}
            onClick={() => onDomainPresetChange(option)}
          >
            {option}
          </button>
        ))}
        <button
          type="button"
          className={`register-email-field__domain register-email-field__domain--custom${
            isCustom ? ' register-email-field__domain--active' : ''
          }`}
          aria-pressed={isCustom}
          onClick={() => onDomainPresetChange('custom')}
        >
          {t('auth.emailDomainCustom')}
        </button>
      </div>
    </div>
  );
}
