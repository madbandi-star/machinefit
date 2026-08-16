import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adApi } from '@/api/ad.api';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

type StatsRange = 'today' | 'yesterday' | '7d' | '30d';

export function AdminAdsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [range, setRange] = useState<StatsRange>('today');
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);

  const flagsQuery = useQuery({
    queryKey: ['admin', 'ads', 'flags'],
    queryFn: async () => (await adApi.listFlags()).data.data,
  });
  const placementsQuery = useQuery({
    queryKey: ['admin', 'ads', 'placements'],
    queryFn: async () => (await adApi.listPlacements()).data.data,
  });
  const policiesQuery = useQuery({
    queryKey: ['admin', 'ads', 'policies'],
    queryFn: async () => (await adApi.listPolicies()).data.data,
  });
  const statsQuery = useQuery({
    queryKey: ['admin', 'ads', 'stats', range],
    queryFn: async () => (await adApi.getStats(range)).data.data,
  });

  const flagMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      adApi.setFlag(key, enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'ads', 'flags'] });
      showToast(t('admin:ads.saved'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const placementMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      adApi.updatePlacement(id, { enabled }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'ads', 'placements'] });
      showToast(t('admin:ads.saved'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const policyMutation = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Record<string, boolean | number | null | undefined>;
    }) => adApi.updatePolicy(id, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'ads', 'policies'] });
      showToast(t('admin:ads.saved'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const policiesForSelected = useMemo(() => {
    const all = policiesQuery.data ?? [];
    if (!selectedPlacementId) return all.slice(0, 8);
    return all.filter((p) => p.placementId === selectedPlacementId);
  }, [policiesQuery.data, selectedPlacementId]);

  const loading =
    flagsQuery.isLoading || placementsQuery.isLoading || policiesQuery.isLoading;

  return (
    <AdminPageShell title={t('admin:ads.title')} subtitle={t('admin:ads.subtitle')}>
      <div className="ag">
        {loading ? <Skeleton count={3} height={72} /> : null}
        {flagsQuery.isError || placementsQuery.isError ? <QueryErrorMessage /> : null}

        <section className="ag-panel">
          <h2 className="ag-editor__title">{t('admin:ads.flagsTitle')}</h2>
          <div className="ag-queue">
            {(flagsQuery.data ?? []).map((flag) => (
              <article key={flag.flagKey} className="ag-card">
                <div className="ag-card__main" style={{ cursor: 'default' }}>
                  <span className="ag-card__identity-text">
                    <span className="ag-card__title">{flag.flagKey}</span>
                  </span>
                  <label className="ag-check">
                    <input
                      type="checkbox"
                      checked={flag.enabled}
                      disabled={flagMutation.isPending}
                      onChange={(e) =>
                        flagMutation.mutate({ key: flag.flagKey, enabled: e.target.checked })
                      }
                    />
                    <span>{flag.enabled ? t('admin:ads.on') : t('admin:ads.off')}</span>
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ag-kpis ag-kpis--4" aria-label={t('admin:ads.statsTitle')}>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{statsQuery.data?.impressions ?? '—'}</span>
            <span className="ag-kpi__label">{t('admin:ads.impressions')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{statsQuery.data?.clicks ?? '—'}</span>
            <span className="ag-kpi__label">{t('admin:ads.clicks')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">
              {statsQuery.data?.interstitialImpressions ?? '—'}
            </span>
            <span className="ag-kpi__label">{t('admin:ads.interstitials')}</span>
          </div>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{statsQuery.data?.rewardCompletes ?? '—'}</span>
            <span className="ag-kpi__label">{t('admin:ads.rewards')}</span>
          </div>
        </section>

        <div className="ag-chips" role="group" aria-label={t('admin:ads.statsTitle')}>
          {(['today', 'yesterday', '7d', '30d'] as StatsRange[]).map((r) => (
            <button
              key={r}
              type="button"
              className={`ag-chip${range === r ? ' is-active' : ''}`}
              onClick={() => setRange(r)}
            >
              {t(`admin:ads.range.${r}`)}
            </button>
          ))}
        </div>

        <section className="ag-panel">
          <h2 className="ag-editor__title">{t('admin:ads.placementsTitle')}</h2>
          <div className="ag-queue">
            {(placementsQuery.data ?? []).map((p) => (
              <article
                key={p.id}
                className={`ag-card${selectedPlacementId === p.id ? ' is-selected' : ''}`}
              >
                <button
                  type="button"
                  className="ag-card__main"
                  onClick={() => setSelectedPlacementId(p.id)}
                >
                  <span className="ag-card__identity-text">
                    <span className="ag-card__title">{p.name}</span>
                    <span className="ag-card__meta">
                      {p.placementKey} · {p.adType}
                    </span>
                  </span>
                  <span className={`ag-pill ${p.enabled ? 'ag-pill--on' : 'ag-pill--off'}`}>
                    {p.enabled ? t('admin:ads.on') : t('admin:ads.off')}
                  </span>
                </button>
                <div className="ag-card__detail">
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm"
                    onClick={() =>
                      placementMutation.mutate({ id: p.id, enabled: !p.enabled })
                    }
                  >
                    {p.enabled ? t('admin:ads.disable') : t('admin:ads.enable')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ag-panel">
          <h2 className="ag-editor__title">{t('admin:ads.policiesTitle')}</h2>
          <div className="ag-queue">
            {policiesForSelected.map((pol) => (
              <article key={pol.id} className="ag-card">
                <div className="ag-card__main" style={{ cursor: 'default' }}>
                  <span className="ag-card__identity-text">
                    <span className="ag-card__title">
                      {pol.eventType || t('admin:ads.defaultPolicy')}
                    </span>
                    <span className="ag-card__meta">
                      min {pol.minIntervalSeconds}s · session {pol.sessionLimit ?? '∞'} · daily{' '}
                      {pol.dailyLimit ?? '∞'}
                    </span>
                  </span>
                </div>
                <div className="ag-card__detail">
                  <div className="ag-field-row">
                    <label className="ag-check">
                      <input
                        type="checkbox"
                        checked={pol.freeUserEnabled}
                        onChange={(e) =>
                          policyMutation.mutate({
                            id: pol.id,
                            patch: { freeUserEnabled: e.target.checked },
                          })
                        }
                      />
                      <span>FREE</span>
                    </label>
                    <label className="ag-check">
                      <input
                        type="checkbox"
                        checked={pol.paidUserEnabled}
                        onChange={(e) =>
                          policyMutation.mutate({
                            id: pol.id,
                            patch: { paidUserEnabled: e.target.checked },
                          })
                        }
                      />
                      <span>PAID</span>
                    </label>
                    <label className="ag-check">
                      <input
                        type="checkbox"
                        checked={pol.anonymousEnabled}
                        onChange={(e) =>
                          policyMutation.mutate({
                            id: pol.id,
                            patch: { anonymousEnabled: e.target.checked },
                          })
                        }
                      />
                      <span>ANON</span>
                    </label>
                    <label className="ag-check">
                      <input
                        type="checkbox"
                        checked={pol.adminEnabled}
                        onChange={(e) =>
                          policyMutation.mutate({
                            id: pol.id,
                            patch: { adminEnabled: e.target.checked },
                          })
                        }
                      />
                      <span>ADMIN</span>
                    </label>
                  </div>
                  <label className="ag-field">
                    <span>{t('admin:ads.minInterval')}</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      defaultValue={pol.minIntervalSeconds}
                      onBlur={(e) =>
                        policyMutation.mutate({
                          id: pol.id,
                          patch: { minIntervalSeconds: Number(e.target.value) || 0 },
                        })
                      }
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="ag-panel">
          <h2 className="ag-editor__title">{t('admin:ads.byPlacement')}</h2>
          <ul className="admin-banner-blockers">
            {(statsQuery.data?.byPlacement ?? []).map((row) => (
              <li key={row.placementKey}>
                {row.placementKey}: {row.impressions} / {row.clicks}
              </li>
            ))}
            {(statsQuery.data?.byPlacement ?? []).length === 0 ? (
              <li>{t('admin:ads.noStats')}</li>
            ) : null}
          </ul>
        </section>
      </div>
    </AdminPageShell>
  );
}
