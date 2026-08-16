import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { adApi } from '@/api/ad.api';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
import '@/styles/admin-ads.css';

type StatsRange = 'today' | 'yesterday' | '7d' | '30d';

const FLAG_ORDER = [
  'ADS_ENABLED',
  'INLINE_CMS_ENABLED',
  'INLINE_ENABLED',
  'NATIVE_AD_ENABLED',
  'STICKY_BANNER_ENABLED',
  'INTERSTITIAL_ENABLED',
  'PAGE_TRANSITION_AD_ENABLED',
  'REWARDED_AD_ENABLED',
] as const;

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

  const sortedFlags = useMemo(() => {
    const rows = flagsQuery.data ?? [];
    return [...rows].sort((a, b) => {
      const ai = FLAG_ORDER.indexOf(a.flagKey as (typeof FLAG_ORDER)[number]);
      const bi = FLAG_ORDER.indexOf(b.flagKey as (typeof FLAG_ORDER)[number]);
      const aRank = ai === -1 ? 99 : ai;
      const bRank = bi === -1 ? 99 : bi;
      return aRank - bRank || a.flagKey.localeCompare(b.flagKey);
    });
  }, [flagsQuery.data]);

  const selectedPlacement = useMemo(
    () => (placementsQuery.data ?? []).find((p) => p.id === selectedPlacementId) ?? null,
    [placementsQuery.data, selectedPlacementId]
  );

  const policiesForSelected = useMemo(() => {
    const all = policiesQuery.data ?? [];
    if (!selectedPlacementId) return [];
    return all.filter((p) => p.placementId === selectedPlacementId);
  }, [policiesQuery.data, selectedPlacementId]);

  const loading =
    flagsQuery.isLoading || placementsQuery.isLoading || policiesQuery.isLoading;

  const flagLabel = (key: string) =>
    t(`admin:ads.flagLabels.${key}`, { defaultValue: key });
  const flagHint = (key: string) =>
    t(`admin:ads.flagHints.${key}`, { defaultValue: '' });
  const placementWhere = (key: string) =>
    t(`admin:ads.placementWhere.${key}`, { defaultValue: '' });
  const adTypeLabel = (type: string) =>
    t(`admin:ads.adTypes.${type}`, { defaultValue: type });

  return (
    <AdminPageShell title={t('admin:ads.title')} subtitle={t('admin:ads.subtitle')}>
      <div className="admin-ads">
        <section className="admin-ads__guide" aria-labelledby="admin-ads-guide-title">
          <h2 id="admin-ads-guide-title" className="admin-ads__guide-title">
            {t('admin:ads.guideTitle')}
          </h2>
          <p className="admin-ads__guide-lead">{t('admin:ads.guideLead')}</p>
          <ol className="admin-ads__steps">
            <li>
              <strong>{t('admin:ads.step1Title')}</strong>
              <span>{t('admin:ads.step1Body')}</span>
            </li>
            <li>
              <strong>{t('admin:ads.step2Title')}</strong>
              <span>{t('admin:ads.step2Body')}</span>
            </li>
            <li>
              <strong>{t('admin:ads.step3Title')}</strong>
              <span>{t('admin:ads.step3Body')}</span>
            </li>
            <li>
              <strong>{t('admin:ads.step4Title')}</strong>
              <span>{t('admin:ads.step4Body')}</span>
            </li>
          </ol>
          <p className="admin-ads__guide-note">
            {t('admin:ads.guideBannerLinkBefore')}{' '}
            <Link to={ROUTES.ADMIN_BANNERS}>{t('admin:ads.guideBannerLink')}</Link>
            {t('admin:ads.guideBannerLinkAfter')}
          </p>
        </section>

        {loading ? <Skeleton count={3} height={72} /> : null}
        {flagsQuery.isError || placementsQuery.isError ? <QueryErrorMessage /> : null}

        <section className="admin-ads__section" aria-labelledby="admin-ads-stats">
          <div className="admin-ads__section-head">
            <h2 id="admin-ads-stats" className="admin-ads__section-title">
              {t('admin:ads.statsTitle')}
            </h2>
            <p className="admin-ads__section-hint">{t('admin:ads.statsHint')}</p>
          </div>
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
          <div className="admin-ads__stat-list">
            <h3 className="admin-ads__subhead">{t('admin:ads.byPlacement')}</h3>
            <ul>
              {(statsQuery.data?.byPlacement ?? []).map((row) => (
                <li key={row.placementKey}>
                  <span className="admin-ads__stat-key">
                    {t(`admin:ads.placementWhere.${row.placementKey}`, {
                      defaultValue: row.placementKey,
                    })}
                  </span>
                  <span className="admin-ads__stat-nums">
                    {t('admin:ads.impressionClick', {
                      impressions: row.impressions,
                      clicks: row.clicks,
                    })}
                  </span>
                </li>
              ))}
              {(statsQuery.data?.byPlacement ?? []).length === 0 ? (
                <li className="admin-ads__empty">{t('admin:ads.noStats')}</li>
              ) : null}
            </ul>
          </div>
        </section>

        <section className="admin-ads__section" aria-labelledby="admin-ads-flags">
          <div className="admin-ads__section-head">
            <h2 id="admin-ads-flags" className="admin-ads__section-title">
              {t('admin:ads.flagsTitle')}
            </h2>
            <p className="admin-ads__section-hint">{t('admin:ads.flagsHint')}</p>
          </div>
          <div className="admin-ads__cards">
            {sortedFlags.map((flag) => (
              <article key={flag.flagKey} className="admin-ads__card">
                <div className="admin-ads__card-top">
                  <div>
                    <h3 className="admin-ads__card-title">{flagLabel(flag.flagKey)}</h3>
                    <p className="admin-ads__card-code">{flag.flagKey}</p>
                  </div>
                  <label className="admin-ads__switch">
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
                {flagHint(flag.flagKey) ? (
                  <p className="admin-ads__card-hint">{flagHint(flag.flagKey)}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="admin-ads__section" aria-labelledby="admin-ads-placements">
          <div className="admin-ads__section-head">
            <h2 id="admin-ads-placements" className="admin-ads__section-title">
              {t('admin:ads.placementsTitle')}
            </h2>
            <p className="admin-ads__section-hint">{t('admin:ads.placementsHint')}</p>
          </div>
          <div className="admin-ads__cards">
            {(placementsQuery.data ?? []).map((p) => {
              const where = placementWhere(p.placementKey);
              const selected = selectedPlacementId === p.id;
              return (
                <article
                  key={p.id}
                  className={`admin-ads__card admin-ads__card--placement${
                    selected ? ' is-selected' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="admin-ads__card-select"
                    onClick={() => setSelectedPlacementId(p.id)}
                  >
                    <span className="admin-ads__card-title">{p.name}</span>
                    <span className="admin-ads__card-meta">
                      {adTypeLabel(p.adType)} · {p.placementKey}
                    </span>
                    {where ? <span className="admin-ads__card-where">{where}</span> : null}
                  </button>
                  <div className="admin-ads__card-actions">
                    <span className={`ag-pill ${p.enabled ? 'ag-pill--on' : 'ag-pill--off'}`}>
                      {p.enabled ? t('admin:ads.on') : t('admin:ads.off')}
                    </span>
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
              );
            })}
          </div>
        </section>

        <section className="admin-ads__section" aria-labelledby="admin-ads-policies">
          <div className="admin-ads__section-head">
            <h2 id="admin-ads-policies" className="admin-ads__section-title">
              {t('admin:ads.policiesTitle')}
            </h2>
            <p className="admin-ads__section-hint">{t('admin:ads.policiesHint')}</p>
          </div>

          {!selectedPlacementId ? (
            <p className="admin-ads__empty">{t('admin:ads.selectPlacementFirst')}</p>
          ) : (
            <>
              <p className="admin-ads__selected">
                {t('admin:ads.editingPlacement', {
                  name: selectedPlacement?.name ?? selectedPlacementId,
                })}
              </p>
              <div className="admin-ads__cards">
                {policiesForSelected.length === 0 ? (
                  <p className="admin-ads__empty">{t('admin:ads.noPolicy')}</p>
                ) : (
                  policiesForSelected.map((pol) => (
                    <article key={pol.id} className="admin-ads__card admin-ads__card--policy">
                      <h3 className="admin-ads__card-title">
                        {pol.eventType
                          ? t(`admin:ads.eventTypes.${pol.eventType}`, {
                              defaultValue: pol.eventType,
                            })
                          : t('admin:ads.defaultPolicy')}
                      </h3>
                      <p className="admin-ads__card-hint">{t('admin:ads.audienceHint')}</p>
                      <div className="admin-ads__audience">
                        {(
                          [
                            ['anonymousEnabled', 'audienceAnon'],
                            ['freeUserEnabled', 'audienceFree'],
                            ['paidUserEnabled', 'audiencePaid'],
                            ['adminEnabled', 'audienceAdmin'],
                          ] as const
                        ).map(([field, labelKey]) => (
                          <label key={field} className="admin-ads__check">
                            <input
                              type="checkbox"
                              checked={Boolean(pol[field])}
                              onChange={(e) =>
                                policyMutation.mutate({
                                  id: pol.id,
                                  patch: { [field]: e.target.checked },
                                })
                              }
                            />
                            <span>
                              <strong>{t(`admin:ads.${labelKey}`)}</strong>
                              <em>{t(`admin:ads.${labelKey}Hint`)}</em>
                            </span>
                          </label>
                        ))}
                      </div>
                      <label className="admin-ads__field">
                        <span className="admin-ads__field-label">
                          {t('admin:ads.minInterval')}
                          <em>{t('admin:ads.minIntervalHint')}</em>
                        </span>
                        <input
                          className="input"
                          type="number"
                          min={0}
                          defaultValue={pol.minIntervalSeconds}
                          key={`${pol.id}-${pol.minIntervalSeconds}`}
                          onBlur={(e) =>
                            policyMutation.mutate({
                              id: pol.id,
                              patch: { minIntervalSeconds: Number(e.target.value) || 0 },
                            })
                          }
                        />
                      </label>
                      <p className="admin-ads__limits">
                        {t('admin:ads.limitsSummary', {
                          session: pol.sessionLimit ?? t('admin:ads.unlimited'),
                          daily: pol.dailyLimit ?? t('admin:ads.unlimited'),
                        })}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </>
          )}
        </section>

        <p className="admin-ads__footnote">{t('admin:ads.marketingNote')}</p>
      </div>
    </AdminPageShell>
  );
}
