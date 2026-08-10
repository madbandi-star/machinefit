import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  Check,
  ChevronRight,
  FileText,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  ShieldUser,
} from 'lucide-react';
import { LEGAL_DOC_VERSIONS, type AuthTokens, type User } from '@machinefit/shared';
import { authApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { syncGymScopeAfterAuth } from '@/utils/syncGymScope';
import { syncUserSettings } from '@/utils/syncUserSettings';
import {
  clearOAuthPending,
  clearTermsChecks,
  loadOAuthPending,
  loadTermsChecks,
  saveTermsChecks,
  type TermsCheckState,
} from '@/utils/oauthPending';
import { ROUTES } from '@/constants/routes';
import '@/styles/auth.css';

function getApiErrorMessage(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  const payload = error.response?.data as { error?: { message?: string } } | undefined;
  return payload?.error?.message;
}

function ConsentCheck({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`terms-agree__check${checked ? ' terms-agree__check--on' : ''}`}
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      {checked ? <Check size={14} strokeWidth={3} aria-hidden /> : null}
    </button>
  );
}

function ConsentRow({
  icon,
  required,
  title,
  docTo,
  checked,
  onChange,
  checkLabel,
}: {
  icon: ReactNode;
  required: boolean;
  title: string;
  docTo: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  checkLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="terms-agree__item">
      <span className="terms-agree__item-icon" aria-hidden>
        {icon}
      </span>
      <div className="terms-agree__item-text">
        <span
          className={`terms-agree__badge${
            required ? ' terms-agree__badge--required' : ' terms-agree__badge--optional'
          }`}
        >
          {required ? t('auth.required') : t('auth.optional')}
        </span>
        <span className="terms-agree__item-title">{title}</span>
      </div>
      <ConsentCheck checked={checked} onChange={onChange} label={checkLabel} />
      <Link
        to={docTo}
        className="terms-agree__doc"
        aria-label={`${title} ${t('auth.termsViewDoc')}`}
      >
        <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
      </Link>
    </div>
  );
}

export function TermsAgreementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const updateUser = useAuthStore((s) => s.updateUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const needsConsent = useAuthStore((s) => s.user?.needsConsent);
  const showToast = useUIStore((s) => s.showToast);

  const [checks, setChecks] = useState<TermsCheckState>(() => loadTermsChecks());
  const pending = loadOAuthPending();
  const isSignup = Boolean(pending?.pendingToken);
  const isRejoin = pending?.reason === 'rejoin';
  const canStay = isSignup || (isAuthenticated && needsConsent);

  useEffect(() => {
    if (!canStay) {
      navigate(isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN, { replace: true });
    }
  }, [canStay, isAuthenticated, navigate]);

  useEffect(() => {
    saveTermsChecks(checks);
  }, [checks]);

  const setField = (key: keyof TermsCheckState, value: boolean) => {
    setChecks((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'agreeAll') {
        return {
          agreeAll: value,
          agreeTerms: value,
          agreePrivacy: value,
          agreeLocation: value,
          agreeMarketing: value,
          agreeAge14: value,
        };
      }
      const requiredAndOptional =
        next.agreeTerms &&
        next.agreePrivacy &&
        next.agreeLocation &&
        next.agreeMarketing &&
        next.agreeAge14;
      return { ...next, agreeAll: requiredAndOptional };
    });
  };

  const requiredOk = checks.agreeTerms && checks.agreePrivacy && checks.agreeAge14;

  const finishAuth = (user: User, tokens: AuthTokens) => {
    clearOAuthPending();
    clearTermsChecks();
    setAuth(user, tokens);
    updateUser({ ...user, needsConsent: false });
    syncUserSettings(user);
    syncGymScopeAfterAuth(user);
    if (isSignup) {
      navigate(ROUTES.AUTH_SIGNUP_COMPLETE, { replace: true });
      return;
    }
    showToast(t('auth.consentUpdated'), 'success');
    navigate(ROUTES.HOME, { replace: true });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        agreeTerms: checks.agreeTerms,
        agreePrivacy: checks.agreePrivacy,
        agreeAge14: checks.agreeAge14,
        agreeLocation: checks.agreeLocation,
        agreeMarketing: checks.agreeMarketing,
        termsVersion: LEGAL_DOC_VERSIONS.terms,
        privacyVersion: LEGAL_DOC_VERSIONS.privacy,
        locationVersion: LEGAL_DOC_VERSIONS.location,
        marketingVersion: LEGAL_DOC_VERSIONS.marketing,
      };
      if (isSignup && pending) {
        return authApi.completeOAuthSignup({
          pendingToken: pending.pendingToken,
          ...body,
        });
      }
      return authApi.acceptConsents(body);
    },
    onSuccess: (res) => {
      const { user, tokens } = res.data.data as { user: User; tokens: AuthTokens };
      finishAuth(user, tokens);
    },
    onError: (error) => {
      const message = getApiErrorMessage(error);
      showToast(message || t('auth.consentFailed'), 'error');
      if (axios.isAxiosError(error) && error.response?.status === 401 && isSignup) {
        clearOAuthPending();
        navigate(ROUTES.LOGIN, { replace: true });
      }
    },
  });

  if (!canStay) return null;

  return (
    <section className="terms-agree" aria-labelledby="terms-agree-title">
      <div className="terms-agree__hero" aria-hidden>
        <span className="terms-agree__hero-icon">
          <ShieldCheck size={36} strokeWidth={1.75} />
        </span>
      </div>

      <h1 id="terms-agree-title" className="terms-agree__title">
        <Trans
          i18nKey="auth.termsAgreeTitle"
          components={{
            highlight: <span className="terms-agree__title-accent" />,
          }}
        />
      </h1>
      <p className="terms-agree__desc">
        {isRejoin
          ? t('auth.termsAgreeDescRejoin')
          : isSignup
            ? t('auth.termsAgreeDescSignup')
            : t('auth.termsAgreeDescUpdate')}
      </p>

      {isRejoin ? (
        <aside className="terms-agree__rejoin" role="note">
          <p className="terms-agree__rejoin-title">{t('auth.rejoinTitle')}</p>
          <p>{t('auth.rejoinBody')}</p>
          <p>{t('auth.rejoinNoRestore')}</p>
        </aside>
      ) : null}

      <div className="terms-agree__card" role="group" aria-label={t('auth.consentGroup')}>
        <div className="terms-agree__all">
          <span className="terms-agree__all-mark" aria-hidden>
            <Check size={16} strokeWidth={3} />
          </span>
          <div className="terms-agree__all-text">
            <strong>{t('auth.agreeAll')}</strong>
            <span>{t('auth.agreeAllDesc')}</span>
          </div>
          <ConsentCheck
            checked={checks.agreeAll}
            onChange={(v) => setField('agreeAll', v)}
            label={t('auth.agreeAll')}
          />
        </div>

        <div className="terms-agree__divider" aria-hidden />

        <ConsentRow
          icon={<FileText size={18} strokeWidth={2} />}
          required
          title={t('legal.termsTitle')}
          docTo={ROUTES.TERMS}
          checked={checks.agreeTerms}
          onChange={(v) => setField('agreeTerms', v)}
          checkLabel={`${t('auth.required')} ${t('legal.termsTitle')}`}
        />
        <ConsentRow
          icon={<ShieldUser size={18} strokeWidth={2} />}
          required
          title={t('legal.privacyTitle')}
          docTo={ROUTES.PRIVACY}
          checked={checks.agreePrivacy}
          onChange={(v) => setField('agreePrivacy', v)}
          checkLabel={`${t('auth.required')} ${t('legal.privacyTitle')}`}
        />
        <ConsentRow
          icon={<MapPin size={18} strokeWidth={2} />}
          required={false}
          title={t('legal.locationTitle')}
          docTo={ROUTES.LEGAL_LOCATION}
          checked={checks.agreeLocation}
          onChange={(v) => setField('agreeLocation', v)}
          checkLabel={`${t('auth.optional')} ${t('legal.locationTitle')}`}
        />
        <ConsentRow
          icon={<Mail size={18} strokeWidth={2} />}
          required={false}
          title={t('legal.marketingTitle')}
          docTo={ROUTES.LEGAL_MARKETING}
          checked={checks.agreeMarketing}
          onChange={(v) => setField('agreeMarketing', v)}
          checkLabel={`${t('auth.optional')} ${t('legal.marketingTitle')}`}
        />
        <div className="terms-agree__item">
          <span className="terms-agree__item-icon" aria-hidden>
            <ShieldCheck size={18} strokeWidth={2} />
          </span>
          <div className="terms-agree__item-text">
            <span className="terms-agree__badge terms-agree__badge--required">
              {t('auth.required')}
            </span>
            <span className="terms-agree__item-title">{t('auth.agreeAge14')}</span>
          </div>
          <ConsentCheck
            checked={checks.agreeAge14}
            onChange={(v) => setField('agreeAge14', v)}
            label={`${t('auth.required')} ${t('auth.agreeAge14')}`}
          />
        </div>
      </div>

      {isSignup ? <p className="terms-agree__trial">{t('auth.trialNoticeSignup')}</p> : null}

      <p className="terms-agree__secure">
        <Lock size={14} strokeWidth={2.25} aria-hidden />
        <span>{t('auth.termsSecureNotice')}</span>
      </p>

      <button
        type="button"
        className="terms-agree__submit"
        disabled={!requiredOk || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? '...' : t('auth.termsAgreeContinue')}
      </button>
    </section>
  );
}
