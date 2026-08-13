import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PrivacyRightsRequest } from '@machinefit/shared';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/legal.css';
import '@/styles/components.css';

function statusLabel(
  t: (k: string) => string,
  status: string
): string {
  return t(`compliance.rights.status.${status}`);
}

function typeLabel(t: (k: string) => string, type: string): string {
  return t(`compliance.rights.requestType.${type}`);
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

  return (
    <PageShell title={t('compliance.rights.title')} subtitle={t('compliance.rights.subtitle')}>
      <section className="legal-doc">
        <h2>{t('compliance.rights.viewTitle')}</h2>
        <GuideProse text={t('compliance.rights.viewDesc')} variant="lead" />
        {p && (
          <dl className="privacy-summary">
            <div>
              <dt>{t('auth.emailLabel')}</dt>
              <dd>{p.email}</dd>
            </div>
            <div>
              <dt>{t('auth.displayNamePlaceholder')}</dt>
              <dd>{p.displayName}</dd>
            </div>
            <div>
              <dt>{t('auth.heightLabel')}</dt>
              <dd>{p.heightCm ?? '—'}</dd>
            </div>
            <div>
              <dt>{t('auth.weightLabel')}</dt>
              <dd>{p.weightKg ?? '—'}</dd>
            </div>
            <div>
              <dt>{t('auth.ageLabel')}</dt>
              <dd>{p.age ?? '—'}</dd>
            </div>
            <div>
              <dt>{t('location.pathUnset')}</dt>
              <dd>
                {summary?.location?.hasCoordinates
                  ? t('compliance.rights.hasGps')
                  : summary?.location
                    ? t('compliance.rights.regionOnly')
                    : t('location.pathUnset')}
              </dd>
            </div>
          </dl>
        )}
        {p?.privacyProcessingSuspended ? (
          <p className="form-section__desc">{t('compliance.rights.processingSuspendedBanner')}</p>
        ) : null}
        <p>
          <Link to={ROUTES.SETTINGS}>{t('compliance.rights.editInSettings')}</Link>
        </p>
        <button
          type="button"
          className="btn btn--secondary"
          style={{ marginTop: 'var(--space-sm)' }}
          disabled={rightsMutation.isPending}
          onClick={() => rightsMutation.mutate({ requestType: 'access' })}
        >
          {t('compliance.rights.accessRequestCta')}
        </button>
      </section>

      <section className="form-section">
        <h3 className="form-section__title">{t('compliance.rights.purposesTitle')}</h3>
        <GuideProse
          className="form-section__desc"
          text={t('compliance.rights.purposesDesc')}
          variant="muted"
        />
        <ul className="legal-link-list">
          {(purposes?.purposes ?? []).map((item) => (
            <li key={item.key}>
              <strong>{t(item.titleKey)}</strong>
              {' — '}
              {t(item.retentionKey)}
              {item.required ? ` (${t('compliance.rights.requiredTag')})` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section className="form-section">
        <h3 className="form-section__title">{t('compliance.rights.consentsTitle')}</h3>
        <GuideProse
          className="form-section__desc"
          text={t('compliance.rights.consentsDesc')}
          variant="muted"
        />
        <label className="consent-row">
          <input
            type="checkbox"
            checked={Boolean(p?.marketingOptIn)}
            disabled={consentMutation.isPending}
            onChange={(e) => consentMutation.mutate({ marketingOptIn: e.target.checked })}
          />
          <span>{t('settings.marketingOptIn')}</span>
        </label>
        <label className="consent-row">
          <input
            type="checkbox"
            checked={Boolean(p?.eventOptIn)}
            disabled={consentMutation.isPending}
            onChange={(e) => consentMutation.mutate({ eventOptIn: e.target.checked })}
          />
          <span>{t('compliance.rights.eventOptIn')}</span>
        </label>
        <label className="consent-row">
          <input
            type="checkbox"
            checked={p?.pushServiceOptIn !== false}
            disabled={consentMutation.isPending}
            onChange={(e) => consentMutation.mutate({ pushServiceOptIn: e.target.checked })}
          />
          <span>{t('compliance.rights.pushServiceOptIn')}</span>
        </label>
        <p className="form-section__desc">{t('compliance.rights.essentialConsentNote')}</p>
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
        <p className="form-section__desc">
          <Link to={ROUTES.LEGAL_LOCATION}>{t('legal.locationTitle')}</Link>
        </p>
      </section>

      <section className="form-section">
        <h3 className="form-section__title">{t('compliance.rights.correctionTitle')}</h3>
        <GuideProse
          className="form-section__desc"
          text={t('compliance.rights.correctionDesc')}
          variant="muted"
        />
        <p>
          <Link to={ROUTES.SETTINGS}>{t('compliance.rights.editInSettings')}</Link>
        </p>
        <label className="form-field">
          <span>{t('compliance.rights.correctionField')}</span>
          <select
            value={correctionField}
            onChange={(e) => setCorrectionField(e.target.value)}
          >
            <option value="displayName">{t('auth.displayNamePlaceholder')}</option>
            <option value="email">{t('auth.emailLabel')}</option>
            <option value="other">{t('compliance.rights.correctionOther')}</option>
          </select>
        </label>
        <label className="form-field">
          <span>{t('compliance.rights.correctionCurrent')}</span>
          <input
            value={correctionCurrent}
            onChange={(e) => setCorrectionCurrent(e.target.value)}
          />
        </label>
        <label className="form-field">
          <span>{t('compliance.rights.correctionRequested')}</span>
          <input
            value={correctionRequested}
            onChange={(e) => setCorrectionRequested(e.target.value)}
          />
        </label>
        <label className="form-field">
          <span>{t('compliance.rights.correctionReason')}</span>
          <input
            value={correctionReason}
            onChange={(e) => setCorrectionReason(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn btn--secondary"
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
      </section>

      <section className="form-section">
        <h3 className="form-section__title">{t('compliance.rights.deletionTitle')}</h3>
        <GuideProse
          className="form-section__desc"
          text={t('compliance.rights.deletionDesc')}
          variant="muted"
        />
        <GuideProse
          className="form-section__desc"
          text={t('compliance.rights.deletionRetainedNote')}
          variant="muted"
        />
        <ul className="legal-link-list">
          {(purposes?.deletionInventory.deletable ?? []).map((key) => (
            <li key={key}>{t(`compliance.rights.inventory.${key}`)}</li>
          ))}
        </ul>
        <p className="form-section__desc">{t('compliance.rights.deletionRetainedTitle')}</p>
        <ul className="legal-link-list">
          {(purposes?.deletionInventory.retained ?? []).map((key) => (
            <li key={key}>{t(`compliance.rights.inventory.${key}`)}</li>
          ))}
        </ul>
        <label className="consent-row">
          <input
            type="checkbox"
            checked={deletionAck}
            onChange={(e) => setDeletionAck(e.target.checked)}
          />
          <span>{t('compliance.rights.deletionAck')}</span>
        </label>
        <label className="consent-row">
          <input
            type="checkbox"
            checked={deletionConfirm}
            onChange={(e) => setDeletionConfirm(e.target.checked)}
          />
          <span>{t('compliance.rights.deletionConfirm')}</span>
        </label>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={rightsMutation.isPending || !deletionAck || !deletionConfirm}
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
        <p className="form-section__desc">{t('compliance.rights.deletionVsWithdraw')}</p>
      </section>

      <section className="form-section">
        <h3 className="form-section__title">{t('compliance.rights.stopTitle')}</h3>
        <GuideProse
          className="form-section__desc"
          text={t('compliance.rights.stopDesc')}
          variant="muted"
        />
        <label className="consent-row">
          <input
            type="checkbox"
            checked={stopConfirm}
            onChange={(e) => setStopConfirm(e.target.checked)}
          />
          <span>{t('compliance.rights.stopConfirm')}</span>
        </label>
        <button
          type="button"
          className="btn btn--secondary"
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
      </section>

      <section className="form-section">
        <h3 className="form-section__title">{t('compliance.rights.exportTitle')}</h3>
        <GuideProse className="form-section__desc" text={t('compliance.rights.exportDesc')} variant="muted" />
        <GuideProse className="form-section__desc" text={t('compliance.rights.exportIncludes')} variant="muted" />
        <button
          type="button"
          className="btn btn--secondary"
          disabled={exportMutation.isPending}
          onClick={() => exportMutation.mutate()}
        >
          {exportMutation.isPending ? '...' : t('compliance.rights.exportCta')}
        </button>
      </section>

      <section className="form-section">
        <h3 className="form-section__title">{t('compliance.rights.requestsTitle')}</h3>
        <GuideProse
          className="form-section__desc"
          text={t('compliance.rights.requestsDesc')}
          variant="muted"
        />
        {requests.length === 0 ? (
          <p className="form-section__desc">{t('compliance.rights.requestsEmpty')}</p>
        ) : (
          <ul className="legal-link-list">
            {requests.map((r) => (
              <li key={r.id}>
                <strong>{typeLabel(t, r.requestType)}</strong>
                {' · '}
                {statusLabel(t, r.status)}
                {' · '}
                {new Date(r.createdAt).toLocaleDateString()}
                {r.resultMessage ? ` — ${r.resultMessage}` : ''}
                {r.rejectionReason ? ` (${r.rejectionReason})` : ''}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="form-section">
        <h3 className="form-section__title">{t('compliance.rights.moreTitle')}</h3>
        <ul className="legal-link-list">
          <li>
            <Link to={ROUTES.SUPPORT}>{t('support.title')}</Link>
          </li>
          <li>
            <Link to={ROUTES.SETTINGS}>{t('settings.deleteAccount')}</Link>
            <span className="form-section__desc"> — {t('compliance.rights.withdrawSeparate')}</span>
          </li>
          <li>
            <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
          </li>
        </ul>
      </section>
    </PageShell>
  );
}
