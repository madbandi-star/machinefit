import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/legal.css';
import '@/styles/components.css';

export function PrivacyRightsPage() {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const updateUser = useAuthStore((s) => s.updateUser);
  const queryClient = useQueryClient();

  const summaryQuery = useQuery({
    queryKey: ['privacy-summary'],
    queryFn: async () => (await complianceApi.getPrivacySummary()).data.data,
  });

  const consentMutation = useMutation({
    mutationFn: complianceApi.updateConsents,
    onSuccess: (res) => {
      const data = res.data.data;
      updateUser({
        marketingOptIn: data.marketingOptIn,
        locationOptIn: data.locationOptIn,
        pushServiceOptIn: data.pushServiceOptIn,
      });
      queryClient.invalidateQueries({ queryKey: ['privacy-summary'] });
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

  if (summaryQuery.isLoading) {
    return (
      <PageShell title={t('compliance.rights.title')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  const summary = summaryQuery.data;
  const p = summary?.profile;

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
        <p>
          <Link to={ROUTES.SETTINGS}>{t('compliance.rights.editInSettings')}</Link>
        </p>
      </section>

      <section className="form-section">
        <h3 className="form-section__title">{t('compliance.rights.consentsTitle')}</h3>
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
            checked={p?.pushServiceOptIn !== false}
            disabled={consentMutation.isPending}
            onChange={(e) => consentMutation.mutate({ pushServiceOptIn: e.target.checked })}
          />
          <span>{t('compliance.rights.pushServiceOptIn')}</span>
        </label>
        <p className="form-section__desc">
          <Link to={ROUTES.LEGAL_LOCATION}>{t('legal.locationTitle')}</Link>
        </p>
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
        <h3 className="form-section__title">{t('compliance.rights.moreTitle')}</h3>
        <ul className="legal-link-list">
          <li>
            <Link to={ROUTES.SUPPORT}>{t('support.title')}</Link>
          </li>
          <li>
            <Link to={ROUTES.SETTINGS}>{t('settings.deleteAccount')}</Link>
          </li>
          <li>
            <Link to={ROUTES.PRIVACY}>{t('legal.privacyTitle')}</Link>
          </li>
        </ul>
      </section>
    </PageShell>
  );
}
