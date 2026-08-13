import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  PRIVACY_RIGHTS_USER_CANCELLABLE_TYPES,
  type PrivacyRightsRequest,
} from '@machinefit/shared';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/privacy-rights.css';
import '@/styles/components.css';

function statusLabel(t: (k: string) => string, status: string): string {
  return t(`compliance.rights.status.${status}`);
}

function typeLabel(t: (k: string) => string, type: string): string {
  return t(`compliance.rights.requestType.${type}`);
}

function canCancelRequest(r: PrivacyRightsRequest): boolean {
  if (
    !(PRIVACY_RIGHTS_USER_CANCELLABLE_TYPES as readonly string[]).includes(r.requestType)
  ) {
    return false;
  }
  if (r.requestType === 'processing_stop') {
    return r.status === 'completed';
  }
  return r.status === 'received' || r.status === 'reviewing';
}

function ConsentToggle({
  label,
  description,
  pressed,
  disabled,
  onToggle,
}: {
  label: string;
  description?: string;
  pressed: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="pr-toggle"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onToggle}
    >
      <span className="pr-toggle__copy">
        <span className="pr-toggle__label">{label}</span>
        {description ? <span className="pr-toggle__desc">{description}</span> : null}
      </span>
      <span className="pr-switch" aria-hidden />
    </button>
  );
}

export function PrivacyRightsPage() {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  const [correctionField, setCorrectionField] = useState('displayName');
  const [correctionCurrent, setCorrectionCurrent] = useState('');
  const [correctionRequested, setCorrectionRequested] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [deletionAck, setDeletionAck] = useState(false);
  const [deletionConfirm, setDeletionConfirm] = useState(false);
  const [stopConfirm, setStopConfirm] = useState(false);
  const [openExercise, setOpenExercise] = useState<
    'correction' | 'deletion' | 'stop' | null
  >(null);

  const toggleExercise = (key: 'correction' | 'deletion' | 'stop') => {
    setOpenExercise((prev) => (prev === key ? null : key));
  };

  const summaryQuery = useQuery({
    queryKey: ['privacy-summary'],
    queryFn: async () => (await complianceApi.getPrivacySummary()).data.data,
  });

  const purposesQuery = useQuery({
    queryKey: ['privacy-purposes'],
    queryFn: async () => (await complianceApi.getProcessingPurposes()).data.data,
  });

  const requestsQuery = useQuery({
    queryKey: ['privacy-rights-requests'],
    queryFn: async () => (await complianceApi.listRightsRequests()).data.data,
  });

  const consentMutation = useMutation({
    mutationFn: complianceApi.updateConsents,
    onSuccess: (res) => {
      const data = res.data.data;
      updateUser({
        marketingOptIn: data.marketingOptIn,
        eventOptIn: data.eventOptIn,
        locationOptIn: data.locationOptIn,
        pushServiceOptIn: data.pushServiceOptIn,
      });
      queryClient.invalidateQueries({ queryKey: ['privacy-summary'] });
      queryClient.invalidateQueries({ queryKey: ['privacy-rights-requests'] });
      showToast(t('compliance.rights.saved'), 'success');
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const exportMutation = useMutation({
    mutationFn: async () => (await complianceApi.exportPrivacy()).data.data,
    onSuccess: (payload) => {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `machinefit-personal-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('compliance.rights.exportDone'), 'success');
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const rightsMutation = useMutation({
    mutationFn: complianceApi.createRightsRequest,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['privacy-rights-requests'] });
      queryClient.invalidateQueries({ queryKey: ['privacy-summary'] });
      const row = res.data.data;
      if (row.status === 'rejected') {
        showToast(row.resultMessage || t('compliance.rights.requestRejected'), 'error');
      } else {
        showToast(t('compliance.rights.requestSubmitted'), 'success');
      }
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => complianceApi.cancelRightsRequest(requestId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['privacy-rights-requests'] });
      queryClient.invalidateQueries({ queryKey: ['privacy-summary'] });
      showToast(
        res.data.data.resultMessage || t('compliance.rights.requestCancelled'),
        'success'
      );
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  if (summaryQuery.isLoading) {
    return (
      <PageShell title={t('compliance.rights.title')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  const summary = summaryQuery.data;
  const p = summary?.profile;
  const purposes = purposesQuery.data;
  const requests: PrivacyRightsRequest[] = requestsQuery.data ?? [];
  const locationLabel = summary?.location?.hasCoordinates
    ? t('compliance.rights.hasGps')
    : summary?.location
      ? t('compliance.rights.regionOnly')
      : t('location.pathUnset');

  return (
    <PageShell title={t('compliance.rights.title')} subtitle={t('compliance.rights.subtitle')}>
      <div className="pr-page">
        <nav className="pr-nav" aria-label={t('compliance.rights.title')}>
          <a href="#pr-view">{t('compliance.rights.navView')}</a>
          <a href="#pr-purpose">{t('compliance.rights.navPurpose')}</a>
          <a href="#pr-consent">{t('compliance.rights.navConsent')}</a>
          <a href="#pr-exercise">{t('compliance.rights.navExercise')}</a>
          <a href="#pr-requests">{t('compliance.rights.navRequests')}</a>
          <a href="#pr-account">{t('compliance.rights.navAccount')}</a>
        </nav>

        {p?.privacyProcessingSuspended ? (
          <p className="pr-banner" role="status">
            {t('compliance.rights.processingSuspendedBanner')}
          </p>
        ) : null}

        <section id="pr-view" className="pr-section">
          <header className="pr-section__head">
            <h2 className="pr-section__title">{t('compliance.rights.viewTitle')}</h2>
            <GuideProse
              className="pr-section__desc"
              text={t('compliance.rights.viewDesc')}
              variant="muted"
            />
          </header>

          {p ? (
            <div className="pr-grid">
              <div className="pr-fact">
                <span className="pr-fact__label">{t('auth.displayNamePlaceholder')}</span>
                <span className="pr-fact__value">{p.displayName}</span>
              </div>
              <div className="pr-fact">
                <span className="pr-fact__label">{t('auth.heightLabel')}</span>
                <span className="pr-fact__value">{p.heightCm ?? '—'}</span>
              </div>
              <div className="pr-fact">
                <span className="pr-fact__label">{t('auth.weightLabel')}</span>
                <span className="pr-fact__value">{p.weightKg ?? '—'}</span>
              </div>
              <div className="pr-fact">
                <span className="pr-fact__label">{t('auth.ageLabel')}</span>
                <span className="pr-fact__value">{p.age ?? '—'}</span>
              </div>
              <div className="pr-fact">
                <span className="pr-fact__label">{t('location.pathUnset')}</span>
                <span className="pr-fact__value">{locationLabel}</span>
              </div>
            </div>
          ) : null}

          <div className="pr-actions">
            <Link to={ROUTES.SETTINGS} className="btn btn--secondary">
              {t('compliance.rights.editInSettings')}
            </Link>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
            >
              {exportMutation.isPending ? '...' : t('compliance.rights.exportCta')}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={rightsMutation.isPending}
              onClick={() => rightsMutation.mutate({ requestType: 'access' })}
            >
              {t('compliance.rights.accessRequestCta')}
            </button>
          </div>
          <p className="pr-note">{t('compliance.rights.exportIncludes')}</p>
        </section>

        <section id="pr-purpose" className="pr-section">
          <header className="pr-section__head">
            <h2 className="pr-section__title">{t('compliance.rights.purposesTitle')}</h2>
            <GuideProse
              className="pr-section__desc"
              text={t('compliance.rights.purposesDesc')}
              variant="muted"
            />
          </header>
          <ul className="pr-purpose-list">
            {(purposes?.purposes ?? []).map((item) => (
              <li key={item.key} className="pr-purpose">
                <div className="pr-purpose__top">
                  <p className="pr-purpose__name">{t(item.titleKey)}</p>
                  <span className={`pr-badge${item.required ? '' : ' pr-badge--muted'}`}>
                    {item.required
                      ? t('compliance.rights.requiredTag')
                      : t('compliance.rights.optionalTag')}
                  </span>
                </div>
                <p className="pr-purpose__retention">{t(item.retentionKey)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="pr-consent" className="pr-section">
          <header className="pr-section__head">
            <h2 className="pr-section__title">{t('compliance.rights.consentsTitle')}</h2>
            <GuideProse
              className="pr-section__desc"
              text={t('compliance.rights.consentsDesc')}
              variant="muted"
            />
          </header>

          <div className="pr-toggles">
            <ConsentToggle
              label={t('settings.marketingOptIn')}
              description={t('compliance.rights.marketingOptInHint')}
              pressed={Boolean(p?.marketingOptIn)}
              disabled={consentMutation.isPending}
              onToggle={() =>
                consentMutation.mutate({ marketingOptIn: !p?.marketingOptIn })
              }
            />
            <ConsentToggle
              label={t('compliance.rights.eventOptIn')}
              description={t('compliance.rights.eventOptInHint')}
              pressed={Boolean(p?.eventOptIn)}
              disabled={consentMutation.isPending}
              onToggle={() => consentMutation.mutate({ eventOptIn: !p?.eventOptIn })}
            />
            <ConsentToggle
              label={t('compliance.rights.pushServiceOptIn')}
              pressed={p?.pushServiceOptIn !== false}
              disabled={consentMutation.isPending}
              onToggle={() =>
                consentMutation.mutate({
                  pushServiceOptIn: !(p?.pushServiceOptIn !== false),
                })
              }
            />
          </div>

          <p className="pr-note">{t('compliance.rights.essentialConsentNote')}</p>
          <div className="pr-actions">
            <button
              type="button"
              className="btn btn--secondary"
              disabled={rightsMutation.isPending}
              onClick={() =>
                rightsMutation.mutate({
                  requestType: 'consent_withdraw',
                  consentTarget: 'privacy_essential',
                })
              }
            >
              {t('compliance.rights.withdrawEssentialCta')}
            </button>
            <Link to={ROUTES.LEGAL_LOCATION} className="pr-link">
              {t('legal.locationTitle')}
            </Link>
          </div>
        </section>

        <section id="pr-exercise" className="pr-section">
          <header className="pr-section__head">
            <h2 className="pr-section__title">{t('compliance.rights.exerciseTitle')}</h2>
            <GuideProse
              className="pr-section__desc"
              text={t('compliance.rights.exerciseDesc')}
              variant="muted"
            />
          </header>

          <div className="pr-exercise">
            <article
              className={`pr-card${openExercise === 'correction' ? ' pr-card--open' : ''}`}
            >
              <button
                type="button"
                className="pr-card__head"
                aria-expanded={openExercise === 'correction'}
                onClick={() => toggleExercise('correction')}
              >
                <span className="pr-card__badge">{t('compliance.rights.correctionBadge')}</span>
                <span className="pr-card__titles">
                  <strong>{t('compliance.rights.correctionTitle')}</strong>
                  <span>{t('compliance.rights.correctionLead')}</span>
                </span>
                <span className="pr-card__chevron" aria-hidden />
              </button>
              {openExercise === 'correction' ? (
                <div className="pr-card__body">
                  <GuideProse
                    className="pr-section__desc"
                    text={t('compliance.rights.correctionDesc')}
                    variant="muted"
                  />
                  <Link to={ROUTES.SETTINGS} className="pr-link pr-link--inline">
                    {t('compliance.rights.editInSettings')}
                  </Link>
                  <div className="pr-form">
                    <label className="pr-field">
                      <span className="pr-field__label">
                        {t('compliance.rights.correctionField')}
                      </span>
                      <select
                        className="pr-field__control"
                        value={correctionField}
                        onChange={(e) => setCorrectionField(e.target.value)}
                      >
                        <option value="displayName">
                          {t('auth.displayNamePlaceholder')}
                        </option>
                        <option value="other">{t('compliance.rights.correctionOther')}</option>
                      </select>
                    </label>
                    <label className="pr-field">
                      <span className="pr-field__label">
                        {t('compliance.rights.correctionCurrent')}
                      </span>
                      <input
                        className="pr-field__control"
                        value={correctionCurrent}
                        onChange={(e) => setCorrectionCurrent(e.target.value)}
                      />
                    </label>
                    <label className="pr-field">
                      <span className="pr-field__label">
                        {t('compliance.rights.correctionRequested')}
                      </span>
                      <input
                        className="pr-field__control"
                        value={correctionRequested}
                        onChange={(e) => setCorrectionRequested(e.target.value)}
                      />
                    </label>
                    <label className="pr-field">
                      <span className="pr-field__label">
                        {t('compliance.rights.correctionReason')}
                      </span>
                      <textarea
                        className="pr-field__control pr-field__control--area"
                        rows={3}
                        value={correctionReason}
                        onChange={(e) => setCorrectionReason(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="pr-card__footer">
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={rightsMutation.isPending || !correctionRequested.trim()}
                      onClick={() =>
                        rightsMutation.mutate({
                          requestType: 'correction',
                          fieldKey: correctionField,
                          currentValue: correctionCurrent,
                          requestedValue: correctionRequested,
                          detail: correctionReason || undefined,
                        })
                      }
                    >
                      {t('compliance.rights.correctionCta')}
                    </button>
                  </div>
                </div>
              ) : null}
            </article>

            <article
              className={`pr-card pr-card--danger${
                openExercise === 'deletion' ? ' pr-card--open' : ''
              }`}
            >
              <button
                type="button"
                className="pr-card__head"
                aria-expanded={openExercise === 'deletion'}
                onClick={() => toggleExercise('deletion')}
              >
                <span className="pr-card__badge pr-card__badge--danger">
                  {t('compliance.rights.deletionBadge')}
                </span>
                <span className="pr-card__titles">
                  <strong>{t('compliance.rights.deletionTitle')}</strong>
                  <span>{t('compliance.rights.deletionLead')}</span>
                </span>
                <span className="pr-card__chevron" aria-hidden />
              </button>
              {openExercise === 'deletion' ? (
                <div className="pr-card__body">
                  <GuideProse
                    className="pr-section__desc"
                    text={t('compliance.rights.deletionDesc')}
                    variant="muted"
                  />
                  <p className="pr-note">{t('compliance.rights.deletionRetainedNote')}</p>
                  <div className="pr-inventory">
                    <div className="pr-inventory__col">
                      <h4>{t('compliance.rights.deletionDeletableTitle')}</h4>
                      <ul>
                        {(purposes?.deletionInventory.deletable ?? []).map((key) => (
                          <li key={key}>{t(`compliance.rights.inventory.${key}`)}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pr-inventory__col pr-inventory__col--retain">
                      <h4>{t('compliance.rights.deletionRetainedTitle')}</h4>
                      <ul>
                        {(purposes?.deletionInventory.retained ?? []).map((key) => (
                          <li key={key}>{t(`compliance.rights.inventory.${key}`)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="pr-checks">
                    <label className="pr-check">
                      <input
                        type="checkbox"
                        checked={deletionAck}
                        onChange={(e) => setDeletionAck(e.target.checked)}
                      />
                      <span>{t('compliance.rights.deletionAck')}</span>
                    </label>
                    <label className="pr-check">
                      <input
                        type="checkbox"
                        checked={deletionConfirm}
                        onChange={(e) => setDeletionConfirm(e.target.checked)}
                      />
                      <span>{t('compliance.rights.deletionConfirm')}</span>
                    </label>
                  </div>
                  <div className="pr-card__footer">
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={
                        rightsMutation.isPending || !deletionAck || !deletionConfirm
                      }
                      onClick={() =>
                        rightsMutation.mutate({
                          requestType: 'deletion',
                          acknowledgedInventory: true,
                          confirmed: true,
                        })
                      }
                    >
                      {t('compliance.rights.deletionCta')}
                    </button>
                  </div>
                  <p className="pr-note pr-note--soft">
                    {t('compliance.rights.deletionVsWithdraw')}
                  </p>
                </div>
              ) : null}
            </article>

            <article
              className={`pr-card${openExercise === 'stop' ? ' pr-card--open' : ''}`}
            >
              <button
                type="button"
                className="pr-card__head"
                aria-expanded={openExercise === 'stop'}
                onClick={() => toggleExercise('stop')}
              >
                <span className="pr-card__badge pr-card__badge--warn">
                  {t('compliance.rights.stopBadge')}
                </span>
                <span className="pr-card__titles">
                  <strong>{t('compliance.rights.stopTitle')}</strong>
                  <span>{t('compliance.rights.stopLead')}</span>
                </span>
                <span className="pr-card__chevron" aria-hidden />
              </button>
              {openExercise === 'stop' ? (
                <div className="pr-card__body">
                  <GuideProse
                    className="pr-section__desc"
                    text={t('compliance.rights.stopDesc')}
                    variant="muted"
                  />
                  <div className="pr-checks">
                    <label className="pr-check">
                      <input
                        type="checkbox"
                        checked={stopConfirm}
                        onChange={(e) => setStopConfirm(e.target.checked)}
                      />
                      <span>{t('compliance.rights.stopConfirm')}</span>
                    </label>
                  </div>
                  <div className="pr-card__footer">
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={rightsMutation.isPending || !stopConfirm}
                      onClick={() =>
                        rightsMutation.mutate({
                          requestType: 'processing_stop',
                          confirmed: true,
                        })
                      }
                    >
                      {t('compliance.rights.stopCta')}
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          </div>
        </section>

        <section id="pr-requests" className="pr-section">
          <header className="pr-section__head">
            <h2 className="pr-section__title">{t('compliance.rights.requestsTitle')}</h2>
            <GuideProse
              className="pr-section__desc"
              text={t('compliance.rights.requestsDesc')}
              variant="muted"
            />
          </header>
          {requests.length === 0 ? (
            <p className="pr-empty">{t('compliance.rights.requestsEmpty')}</p>
          ) : (
            <ul className="pr-request-list">
              {requests.map((r) => (
                <li key={r.id} className="pr-request">
                  <div className="pr-request__top">
                    <span className="pr-request__type">{typeLabel(t, r.requestType)}</span>
                    <span className={`pr-status pr-status--${r.status}`}>
                      {statusLabel(t, r.status)}
                    </span>
                  </div>
                  <div className="pr-request__meta">
                    {new Date(r.createdAt).toLocaleString()}
                    {r.processedAt
                      ? ` · ${t('compliance.rights.processedAt')}: ${new Date(
                          r.processedAt
                        ).toLocaleDateString()}`
                      : ''}
                  </div>
                  {r.resultMessage || r.rejectionReason ? (
                    <p className="pr-request__result">
                      {r.resultMessage}
                      {r.rejectionReason ? ` (${r.rejectionReason})` : ''}
                    </p>
                  ) : null}
                  {canCancelRequest(r) ? (
                    <div className="pr-request__actions">
                      <button
                        type="button"
                        className="btn btn--secondary pr-request__cancel"
                        disabled={cancelMutation.isPending}
                        onClick={() => {
                          const ok = window.confirm(
                            t('compliance.rights.cancelConfirm')
                          );
                          if (!ok) return;
                          cancelMutation.mutate(r.id);
                        }}
                      >
                        {t('compliance.rights.cancelRequest')}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="pr-account" className="pr-section">
          <header className="pr-section__head">
            <h2 className="pr-section__title">{t('compliance.rights.moreTitle')}</h2>
            <p className="pr-section__desc">{t('compliance.rights.withdrawSeparate')}</p>
          </header>
          <div className="pr-exit">
            <Link to={ROUTES.SUPPORT}>
              {t('support.title')}
              <span>{t('compliance.rights.exitSupportHint')}</span>
            </Link>
            <Link to={ROUTES.PRIVACY}>
              {t('legal.privacyTitle')}
              <span>{t('compliance.rights.exitPrivacyHint')}</span>
            </Link>
            <Link to={ROUTES.SETTINGS} className="pr-exit--danger">
              {t('settings.deleteAccount')}
              <span>{t('compliance.rights.exitWithdrawHint')}</span>
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
