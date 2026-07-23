import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface EasyWizardShellProps {
  step: 1 | 2 | 3;
  onBack: () => void;
  onClose: () => void;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryHint?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  primaryPending?: boolean;
}

export function EasyWizardShell({
  step,
  onBack,
  onClose,
  children,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryHint,
  secondaryLabel,
  onSecondary,
  primaryPending,
}: EasyWizardShellProps) {
  const { t } = useTranslation();
  const stepLabels = [
    t('easyMode.stepMachine'),
    t('easyMode.stepRecommend'),
    t('easyMode.stepLog'),
  ];

  return (
    <div className="easy-shell">
      <div className="easy-shell__top">
        <button type="button" className="easy-shell__icon-btn" onClick={onBack} aria-label={t('easyMode.back')}>
          ←
        </button>
        <h1 className="easy-shell__title">{t('easyMode.wizardTitle')}</h1>
        <button type="button" className="easy-shell__icon-btn" onClick={onClose} aria-label={t('easyMode.close')}>
          ✕
        </button>
      </div>

      <div className="easy-shell__progress" aria-hidden>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`easy-shell__dot${n <= step ? ' easy-shell__dot--on' : ''}`}
          />
        ))}
      </div>
      <p className="easy-shell__steps-label">
        {step}/3 · {stepLabels[step - 1]}
      </p>

      <div className="easy-shell__body">{children}</div>

      <div className="easy-shell__footer">
        {primaryHint ? <p className="easy-hint">{primaryHint}</p> : null}
        <button
          type="button"
          className="easy-btn easy-btn--primary"
          onClick={onPrimary}
          disabled={primaryDisabled || primaryPending}
        >
          {primaryPending ? t('easyMode.working') : primaryLabel}
        </button>
        {secondaryLabel && onSecondary ? (
          <button type="button" className="easy-btn easy-btn--ghost" onClick={onSecondary}>
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
