import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { LEGAL_DOC_VERSIONS, type AuthTokens, type User } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
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
        };
      }
      const requiredAndOptional =
        next.agreeTerms && next.agreePrivacy && next.agreeLocation && next.agreeMarketing;
      return { ...next, agreeAll: requiredAndOptional };
    });
  };

  const requiredOk = checks.agreeTerms && checks.agreePrivacy;

  const finishAuth = (user: User, tokens: AuthTokens) => {
    clearOAuthPending();
    clearTermsChecks();
    setAuth(user, tokens);
    updateUser({ ...user, needsConsent: false });
    syncUserSettings(user);
    syncGymScopeAfterAuth(user);
    showToast(
      isSignup ? t('auth.accountCreated') : t('auth.consentUpdated'),
      'success'
    );
    navigate(ROUTES.HOME, { replace: true });
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        agreeTerms: checks.agreeTerms,
        agreePrivacy: checks.agreePrivacy,
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
    <PageShell title={t('auth.termsAgreeTitle')}>
      <section className="terms-agree" aria-labelledby="terms-agree-title">
        <h1 id="terms-agree-title" className="terms-agree__title">
          {t('auth.termsAgreeTitle')}
        </h1>
        <p className="terms-agree__desc">
          {isSignup ? t('auth.termsAgreeDescSignup') : t('auth.termsAgreeDescUpdate')}
        </p>

        <div className="terms-agree__list" role="group" aria-label={t('auth.consentGroup')}>
          <label className="terms-agree__row terms-agree__row--all">
            <input
              type="checkbox"
              checked={checks.agreeAll}
              onChange={(e) => setField('agreeAll', e.target.checked)}
            />
            <span>{t('auth.agreeAll')}</span>
          </label>

          <label className="terms-agree__row">
            <input
              type="checkbox"
              checked={checks.agreeTerms}
              onChange={(e) => setField('agreeTerms', e.target.checked)}
            />
            <span className="terms-agree__label">
              <span className="terms-agree__badge terms-agree__badge--required">
                {t('auth.required')}
              </span>
              <Link to={ROUTES.TERMS} className="terms-agree__link">
                {t('legal.termsTitle')}
              </Link>
            </span>
          </label>

          <label className="terms-agree__row">
            <input
              type="checkbox"
              checked={checks.agreePrivacy}
              onChange={(e) => setField('agreePrivacy', e.target.checked)}
            />
            <span className="terms-agree__label">
              <span className="terms-agree__badge terms-agree__badge--required">
                {t('auth.required')}
              </span>
              <Link to={ROUTES.PRIVACY} className="terms-agree__link">
                {t('legal.privacyTitle')}
              </Link>
            </span>
          </label>

          <label className="terms-agree__row">
            <input
              type="checkbox"
              checked={checks.agreeLocation}
              onChange={(e) => setField('agreeLocation', e.target.checked)}
            />
            <span className="terms-agree__label">
              <span className="terms-agree__badge">{t('auth.optional')}</span>
              <Link to={ROUTES.LEGAL_LOCATION} className="terms-agree__link">
                {t('legal.locationTitle')}
              </Link>
            </span>
          </label>

          <label className="terms-agree__row">
            <input
              type="checkbox"
              checked={checks.agreeMarketing}
              onChange={(e) => setField('agreeMarketing', e.target.checked)}
            />
            <span className="terms-agree__label">
              <span className="terms-agree__badge">{t('auth.optional')}</span>
              <Link to={ROUTES.LEGAL_MARKETING} className="terms-agree__link">
                {t('legal.marketingTitle')}
              </Link>
            </span>
          </label>
        </div>

        <button
          type="button"
          className="btn btn--primary btn--block terms-agree__submit"
          disabled={!requiredOk || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? '...' : t('auth.termsAgreeContinue')}
        </button>
      </section>
    </PageShell>
  );
}
