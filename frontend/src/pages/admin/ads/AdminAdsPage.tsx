import { useEffect, useMemo, useState } from 'react';
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

const PRIMARY_FLAGS = ['ADS_ENABLED', 'INLINE_CMS_ENABLED'] as const;
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

const CMS_KEYS = new Set([
  'MAIN_BOTTOM',
  'MY_BOTTOM',
  'WORKOUT_BOTTOM',
  'MACHINE_BOTTOM',
  'COMMUNITY_BOTTOM',
]);

export function AdminAdsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [range, setRange] = useState<StatsRange>('today');
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [showMoreFlags, setShowMoreFlags] = useState(false);

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
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [flagsQuery.data]);

  const sortedPlacements = useMemo(() => {
    const rows = placementsQuery.data ?? [];
    return [...rows].sort((a, b) => {
      const aCms = CMS_KEYS.has(a.placementKey) ? 0 : 1;
      const bCms = CMS_KEYS.has(b.placementKey) ? 0 : 1;
      if (aCms !== bCms) return aCms - bCms;
      return a.name.localeCompare(b.name, 'ko');
    });
  }, [placementsQuery.data]);

  useEffect(() => {
    if (selectedPlacementId || sortedPlacements.length === 0) return;
    const firstCms = sortedPlacements.find((p) => CMS_KEYS.has(p.placementKey));
    setSelectedPlacementId((firstCms ?? sortedPlacements[0]).id);
  }, [sortedPlacements, selectedPlacementId]);

  const selectedPlacement = useMemo(
    () => sortedPlacements.find((p) => p.id === selectedPlacementId) ?? null,
    [sortedPlacements, selectedPlacementId]
  );

  const policiesForSelected = useMemo(() => {
    if (!selectedPlacementId) return [];
    return (policiesQuery.data ?? []).filter((p) => p.placementId === selectedPlacementId);
  }, [policiesQuery.data, selectedPlacementId]);

  const primaryFlags = sortedFlags.filter((f) =>
    (PRIMARY_FLAGS as readonly string[]).includes(f.flagKey)
  );
  const extraFlags = sortedFlags.filter(
    (f) => !(PRIMARY_FLAGS as readonly string[]).includes(f.flagKey)
  );

  const adsMasterOn = sortedFlags.find((f) => f.flagKey === 'ADS_ENABLED')?.enabled;
  const cmsOn = sortedFlags.find((f) => f.flagKey === 'INLINE_CMS_ENABLED')?.enabled;
  const cmsPlacementsOn = sortedPlacements.filter(
    (p) => CMS_KEYS.has(p.placementKey) && p.enabled
  ).length;

  const loading =
    flagsQuery.isLoading || placementsQuery.isLoading || policiesQuery.isLoading;

  const flagLabel = (key: string) =>
    t(`admin:ads.flagLabels.${key}`, { defaultValue: key });
  const placementWhere = (key: string) =>
    t(`admin:ads.placementWhere.${key}`, { defaultValue: key });
  const adTypeLabel = (type: string) =>
    t(`admin:ads.adTypes.${type}`, { defaultValue: type });

  return (
    <AdminPageShell title={t('admin:ads.title')} subtitle={t('admin:ads.subtitle')}>
      <div className="admin-ads">
        <details className="admin-ads__tip">
          <summary>{t('admin:ads.guideTitle')}</summary>
          <p>{t('admin:ads.guideLead')}</p>
          <p>
            {t('admin:ads.guideBannerLinkBefore')}{' '}
            <Link to={ROUTES.ADMIN_BANNERS}>{t('admin:ads.guideBannerLink')}</Link>
            {t('admin:ads.guideBannerLinkAfter')}
          </p>
        </details>

        {loading ? <Skeleton count={2} height={64} /> : null}
        {flagsQuery.isError || placementsQuery.isError ? <QueryErrorMessage /> : null}

        <section className="admin-ads__status" aria-label={t('admin:ads.statusStrip')}>
          <div className={`admin-ads__status-pill${adsMasterOn ? ' is-on' : ''}`}>
            {t('admin:ads.statusAds', { state: adsMasterOn ? t('admin:ads.on') : t('admin:ads.off') })}
          </div>
          <div className={`admin-ads__status-pill${cmsOn ? ' is-on' : ''}`}>
            {t('admin:ads.statusCms', { state: cmsOn ? t('admin:ads.on') : t('admin:ads.off') })}
          </div>
          <div className="admin-ads__status-pill">
            {t('admin:ads.statusCmsSlots', { count: cmsPlacementsOn })}
          </div>
          <Link to={ROUTES.ADMIN_BANNERS} className="admin-ads__status-link">
            {t('admin:ads.guideBannerLink')} →
          </Link>
        </section>

        <section className="admin-ads__block" aria-labelledby="admin-ads-stats">
          <div className="admin-ads__block-bar">
            <h2 id="admin-ads-stats">{t('admin:ads.statsTitle')}</h2>
            <div className="admin-ads__range" role="group">
              {(['today', 'yesterday', '7d', '30d'] as StatsRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`admin-ads__range-btn${range === r ? ' is-active' : ''}`}
                  onClick={() => setRange(r)}
                >
                  {t(`admin:ads.range.${r}`)}
                </button>
              ))}
            </div>
          </div>
          <div className="admin-ads__kpis">
            <div>
              <strong>{statsQuery.data?.impressions ?? '—'}</strong>
              <span>{t('admin:ads.impressions')}</span>
            </div>
            <div>
              <strong>{statsQuery.data?.clicks ?? '—'}</strong>
              <span>{t('admin:ads.clicks')}</span>
            </div>
            <div>
              <strong>{statsQuery.data?.interstitialImpressions ?? '—'}</strong>
              <span>{t('admin:ads.interstitials')}</span>
            </div>
            <div>
              <strong>{statsQuery.data?.rewardCompletes ?? '—'}</strong>
              <span>{t('admin:ads.rewards')}</span>
            </div>
          </div>
        </section>

        <section className="admin-ads__block" aria-labelledby="admin-ads-flags">
          <div className="admin-ads__block-bar">
            <h2 id="admin-ads-flags">{t('admin:ads.flagsTitleShort')}</h2>
            <p>{t('admin:ads.flagsHintShort')}</p>
          </div>
          <div className="admin-ads__toggles">
            {primaryFlags.map((flag) => (
              <label
                key={flag.flagKey}
                className={`admin-ads__toggle${flag.enabled ? ' is-on' : ''}`}
                title={flag.flagKey}
              >
                <input
                  type="checkbox"
                  checked={flag.enabled}
                  disabled={flagMutation.isPending}
                  onChange={(e) =>
                    flagMutation.mutate({ key: flag.flagKey, enabled: e.target.checked })
                  }
                />
                <span>{flagLabel(flag.flagKey)}</span>
              </label>
            ))}
            <button
              type="button"
              className="admin-ads__more-btn"
              onClick={() => setShowMoreFlags((v) => !v)}
            >
              {showMoreFlags ? t('admin:ads.hideMoreFlags') : t('admin:ads.showMoreFlags')}
            </button>
          </div>
          {showMoreFlags ? (
            <div className="admin-ads__toggles admin-ads__toggles--extra">
              {extraFlags.map((flag) => (
                <label
                  key={flag.flagKey}
                  className={`admin-ads__toggle${flag.enabled ? ' is-on' : ''}`}
                  title={flag.flagKey}
                >
                  <input
                    type="checkbox"
                    checked={flag.enabled}
                    disabled={flagMutation.isPending}
                    onChange={(e) =>
                      flagMutation.mutate({ key: flag.flagKey, enabled: e.target.checked })
                    }
                  />
                  <span>{flagLabel(flag.flagKey)}</span>
                </label>
              ))}
            </div>
          ) : null}
        </section>

        <div className="admin-ads__split">
          <section className="admin-ads__block" aria-labelledby="admin-ads-placements">
            <div className="admin-ads__block-bar">
              <h2 id="admin-ads-placements">{t('admin:ads.placementsTitleShort')}</h2>
              <p>{t('admin:ads.placementsHintShort')}</p>
            </div>
            <ul className="admin-ads__list">
              {sortedPlacements.map((p) => {
                const selected = selectedPlacementId === p.id;
                return (
                  <li key={p.id} className={selected ? 'is-selected' : ''}>
                    <button
                      type="button"
                      className="admin-ads__row"
                      onClick={() => setSelectedPlacementId(p.id)}
                    >
                      <span
                        className={`admin-ads__dot${p.enabled ? ' is-on' : ''}`}
                        aria-hidden
                      />
                      <span className="admin-ads__row-text">
                        <strong>{p.name}</strong>
                        <em>{placementWhere(p.placementKey)}</em>
                      </span>
                      <span className="admin-ads__row-type">{adTypeLabel(p.adType)}</span>
                    </button>
                    <button
                      type="button"
                      className={`admin-ads__row-switch${p.enabled ? ' is-on' : ''}`}
                      onClick={() =>
                        placementMutation.mutate({ id: p.id, enabled: !p.enabled })
                      }
                    >
                      {p.enabled ? t('admin:ads.on') : t('admin:ads.off')}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="admin-ads__block admin-ads__policy" aria-labelledby="admin-ads-policies">
            <div className="admin-ads__block-bar">
              <h2 id="admin-ads-policies">{t('admin:ads.policiesTitleShort')}</h2>
              <p>
                {selectedPlacement
                  ? t('admin:ads.editingPlacement', { name: selectedPlacement.name })
                  : t('admin:ads.selectPlacementFirst')}
              </p>
            </div>

            {!selectedPlacement ? (
              <p className="admin-ads__empty">{t('admin:ads.selectPlacementFirst')}</p>
            ) : policiesForSelected.length === 0 ? (
              <p className="admin-ads__empty">{t('admin:ads.noPolicy')}</p>
            ) : (
              policiesForSelected.map((pol) => (
                <div key={pol.id} className="admin-ads__policy-body">
                  <p className="admin-ads__policy-name">
                    {pol.eventType
                      ? t(`admin:ads.eventTypes.${pol.eventType}`, {
                          defaultValue: pol.eventType,
                        })
                      : t('admin:ads.defaultPolicy')}
                  </p>
                  <div className="admin-ads__audience-grid">
                    {(
                      [
                        ['anonymousEnabled', 'audienceAnon'],
                        ['freeUserEnabled', 'audienceFree'],
                        ['paidUserEnabled', 'audiencePaid'],
                        ['adminEnabled', 'audienceAdmin'],
                      ] as const
                    ).map(([field, labelKey]) => (
                      <label
                        key={field}
                        className={`admin-ads__chip${pol[field] ? ' is-on' : ''}`}
                      >
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
                        <span>{t(`admin:ads.${labelKey}`)}</span>
                      </label>
                    ))}
                  </div>
                  <label className="admin-ads__interval">
                    <span>{t('admin:ads.minIntervalShort')}</span>
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
                    <em>{t('admin:ads.minIntervalHintShort')}</em>
                  </label>
                </div>
              ))
            )}
          </section>
        </div>

        <p className="admin-ads__footnote">{t('admin:ads.marketingNote')}</p>
      </div>
    </AdminPageShell>
  );
}
