import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  Check,
  ChevronRight,
  FileText,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  ShieldUser,
} from 'lucide-react';
import {
  LEGAL_DOC_VERSIONS,
  MIN_PLATFORM_AGE,
  yearsSinceBirthDate,
  type AuthTokens,
  type User,
} from '@machinefit/shared';
import { authApi } from '@/api';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
import { QUERY_KEYS } from '@/constants/query-keys';
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

function ConsentMark({ checked }: { checked: boolean }) {
  return (
    <span
      className={`terms-agree__check${checked ? ' terms-agree__check--on' : ''}`}
      aria-hidden
    >
      {checked ? <Check size={14} strokeWidth={3} /> : null}
    </span>
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
      <button
        type="button"
        className="terms-agree__item-hit"
        aria-pressed={checked}
        aria-label={checkLabel}
        onClick={() => onChange(!checked)}
      >
        <span className="terms-agree__item-icon" aria-hidden>
          {icon}
        </span>
        <span className="terms-agree__item-text">
          <span
            className={`terms-agree__badge${
              required ? ' terms-agree__badge--required' : ' terms-agree__badge--optional'
            }`}
          >
            {required ? t('auth.required') : t('auth.optional')}
          </span>
          <span className="terms-agree__item-title">{title}</span>
        </span>
        <ConsentMark checked={checked} />
      </button>
      <Link to={docTo} className="terms-agree__doc">
        <span>{t('auth.termsViewDoc')}</span>
        <ChevronRight size={16} strokeWidth={2.25} aria-hidden />
      </Link>
    </div>
  );
}

export function TermsAgreementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const updateUser = useAuthStore((s) => s.updateUser);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const needsConsent = useAuthStore((s) => s.user?.needsConsent);
  const showToast = useUIStore((s) => s.showToast);

  const [checks, setChecks] = useState<TermsCheckState>(() => loadTermsChecks());
  const [birthDate, setBirthDate] = useState('');
  const [ageBlocked, setAgeBlocked] = useState(false);
  const pending = loadOAuthPending();
  const isSignup = Boolean(pending?.pendingToken);
  const isRejoin = pending?.reason === 'rejoin';
  const canStay = isSignup || (isAuthenticated && needsConsent);
  const now = new Date();
  const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const ageYears = yearsSinceBirthDate(birthDate);
  const under14 = Boolean(birthDate && (ageYears == null || ageYears < MIN_PLATFORM_AGE));
  const showAgeBlock = isSignup && (under14 || ageBlocked);

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
          agreeLocation: false,
          agreeMarketing: value,
          agreeAge14: value,
        };
      }
      const requiredAndOptional =
        next.agreeTerms && next.agreePrivacy && next.agreeMarketing && next.agreeAge14;
      return { ...next, agreeAll: requiredAndOptional };
    });
  };

  const dobOk = !isSignup || (Boolean(birthDate) && ageYears != null && ageYears >= MIN_PLATFORM_AGE);
  const requiredOk =
    checks.agreeTerms && checks.agreePrivacy && checks.agreeAge14 && dobOk && !showAgeBlock;

  const finishAuth = (user: User, tokens: AuthTokens) => {
    clearOAuthPending();
    clearTermsChecks();
    const next = { ...user, needsConsent: false };
    void queryClient.cancelQueries({ queryKey: QUERY_KEYS.me });
    queryClient.setQueryData(QUERY_KEYS.me, next);
    setAuth(next, tokens);
    updateUser(next);
    syncUserSettings(next);
    syncGymScopeAfterAuth(next);
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
        agreeLocation: false,
        agreeMarketing: checks.agreeMarketing,
        termsVersion: LEGAL_DOC_VERSIONS.terms,
        privacyVersion: LEGAL_DOC_VERSIONS.privacy,
        locationVersion: LEGAL_DOC_VERSIONS.location,
        marketingVersion: LEGAL_DOC_VERSIONS.marketing,
      };
      if (isSignup && pending) {
        return authApi.completeOAuthSignup({
          pendingToken: pending.pendingToken,
          birthDate,
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
      const code = axios.isAxiosError(error)
        ? (error.response?.data as { error?: { code?: string } } | undefined)?.error?.code
        : undefined;
      if (code === 'AGE_RESTRICTED') {
        setAgeBlocked(true);
        showToast(t('errors.ageRestricted'), 'error');
        return;
      }
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
    <section
      className={`terms-agree${isRejoin ? ' terms-agree--rejoin' : ''}`}
      aria-labelledby="terms-agree-title"
    >
      <header className="terms-agree__header">
        <p className="terms-agree__brand" aria-hidden>
          Machine<span>Fit</span>
        </p>
        <h1 id="terms-agree-title" className="terms-agree__title">
          <Trans
            i18nKey="auth.termsAgreeTitle"
            components={{
              highlight: <span className="terms-agree__title-accent" />,
            }}
          />
        </h1>
        <GuideProse
          className="terms-agree__desc"
          text={
            isRejoin
              ? t('auth.termsAgreeDescRejoin')
              : isSignup
                ? t('auth.termsAgreeDescSignup')
                : t('auth.termsAgreeDescUpdate')
          }
          variant="muted"
        />
      </header>

      {isRejoin ? (
        <aside className="terms-agree__rejoin" role="note">
          <div className="terms-agree__rejoin-head">
            <span className="terms-agree__rejoin-icon" aria-hidden>
              <RotateCcw size={18} strokeWidth={2.2} />
            </span>
            <p className="terms-agree__rejoin-title">{t('auth.rejoinTitle')}</p>
          </div>
          <ul className="terms-agree__rejoin-facts">
            <li>{t('auth.rejoinBody')}</li>
            <li>{t('auth.rejoinNoRestore')}</li>
          </ul>
        </aside>
      ) : null}

      <div className="terms-agree__card" role="group" aria-label={t('auth.consentGroup')}>
        <button
          type="button"
          className={`terms-agree__all${checks.agreeAll ? ' terms-agree__all--on' : ''}`}
          aria-pressed={checks.agreeAll}
          onClick={() => setField('agreeAll', !checks.agreeAll)}
        >
          <div className="terms-agree__all-text">
            <strong>{t('auth.agreeAll')}</strong>
            <span>{t('auth.agreeAllDesc')}</span>
          </div>
          <ConsentMark checked={checks.agreeAll} />
        </button>

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
          icon={<Mail size={18} strokeWidth={2} />}
          required={false}
          title={t('legal.marketingTitle')}
          docTo={ROUTES.LEGAL_MARKETING}
          checked={checks.agreeMarketing}
          onChange={(v) => setField('agreeMarketing', v)}
          checkLabel={`${t('auth.optional')} ${t('legal.marketingTitle')}`}
        />
        {isSignup ? (
          <div className="terms-agree__dob">
            <label className="terms-agree__dob-label" htmlFor="signup-birth-date">
              <span className="terms-agree__badge terms-agree__badge--required">
                {t('auth.required')}
              </span>
              <span>{t('auth.signupBirthDate')}</span>
            </label>
            <GuideProse
              className="terms-agree__dob-hint"
              text={t('auth.signupBirthDateHint')}
              variant="compact"
            />
            <input
              id="signup-birth-date"
              type="date"
              className="terms-agree__dob-input"
              value={birthDate}
              max={todayYmd}
              onChange={(e) => {
                setAgeBlocked(false);
                setBirthDate(e.target.value);
              }}
              required
            />
          </div>
        ) : null}
        <div className="terms-agree__item">
          <button
            type="button"
            className="terms-agree__item-hit"
            aria-pressed={checks.agreeAge14}
            aria-label={`${t('auth.required')} ${t('auth.agreeAge14')}`}
            onClick={() => setField('agreeAge14', !checks.agreeAge14)}
          >
            <span className="terms-agree__item-icon" aria-hidden>
              <ShieldCheck size={18} strokeWidth={2} />
            </span>
            <span className="terms-agree__item-text">
              <span className="terms-agree__badge terms-agree__badge--required">
                {t('auth.required')}
              </span>
              <span className="terms-agree__item-title">{t('auth.agreeAge14')}</span>
            </span>
            <ConsentMark checked={checks.agreeAge14} />
          </button>
        </div>
      </div>

      {showAgeBlock ? (
        <aside className="terms-agree__age-block" role="alert">
          <p className="terms-agree__age-block-title">{t('auth.ageRestrictedTitle')}</p>
          <GuideProse text={t('auth.ageRestrictedBody')} variant="compact" />
          <button
            type="button"
            className="terms-agree__age-block-back"
            onClick={() => {
              clearOAuthPending();
              clearTermsChecks();
              navigate(ROUTES.LOGIN, { replace: true });
            }}
          >
            {t('auth.ageRestrictedBack')}
          </button>
        </aside>
      ) : null}

      <div className="terms-agree__bottom">
        <aside className="terms-agree__notice" role="note">
          <p className="terms-agree__notice-title">{t('legal.illegalUseTitle')}</p>
          <p>
            <Trans
              i18nKey="auth.illegalUseNotice"
              components={{
                doc: <Link to={ROUTES.LEGAL_ILLEGAL_USE} className="terms-agree__notice-link" />,
              }}
            />
          </p>
        </aside>

        {isSignup ? (
          <GuideProse className="terms-agree__trial" text={t('auth.trialNoticeSignup')} variant="compact" />
        ) : null}

        <p className="terms-agree__secure">
          <Lock size={14} strokeWidth={2.25} aria-hidden />
          <span>{t('auth.termsSecureNotice')}</span>
        </p>

        {showAgeBlock ? null : (
          <button
            type="button"
            className="terms-agree__submit"
            disabled={!requiredOk || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? '...' : t('auth.termsAgreeContinue')}
          </button>
        )}
      </div>
    </section>
  );
}
