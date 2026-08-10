import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RetentionPolicy, RetentionPolicyUpdateInput } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { dataRetentionApi } from '@/api/data-retention.api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-data-retention.css';

const CATEGORIES = [
  'personal',
  'payment',
  'service',
  'log',
  'community',
  'workout',
  'auth',
  'other',
] as const;

function formatPeriod(p: RetentionPolicy, t: (k: string) => string) {
  const unit =
    p.periodUnit === 'year'
      ? t('dataRetention.unitYear')
      : p.periodUnit === 'month'
        ? t('dataRetention.unitMonth')
        : t('dataRetention.unitDay');
  return `${p.periodValue} ${unit}`;
}

function ddayLabel(days: number, t: (k: string, o?: Record<string, unknown>) => string) {
  if (days < 0) return t('dataRetention.ddayOverdue', { n: Math.abs(days) });
  if (days === 0) return t('dataRetention.ddayToday');
  return t('dataRetention.dday', { n: days });
}

function ddayPillClass(days: number): string {
  if (days < 0) return 'admin-status-pill is-danger';
  if (days <= 7) return 'admin-status-pill is-pending';
  return 'admin-status-pill is-active';
}

export function AdminDataRetentionPage() {
  const { t } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editPeriod, setEditPeriod] = useState<{
    value: number;
    unit: 'day' | 'month' | 'year';
  }>({ value: 30, unit: 'day' });
  const [changeReason, setChangeReason] = useState('');
  const [impactPreview, setImpactPreview] = useState<{
    affectedRecords: number;
    scheduleChanged: number;
  } | null>(null);

  const summaryQuery = useQuery({
    queryKey: ['admin-retention-summary'],
    queryFn: async () => (await dataRetentionApi.summary()).data.data,
  });

  const policiesQuery = useQuery({
    queryKey: ['admin-retention-policies', search, category],
    queryFn: async () =>
      (
        await dataRetentionApi.listPolicies({
          q: search || undefined,
          dataCategory: category || undefined,
          limit: 100,
        })
      ).data.data,
  });

  const detailQuery = useQuery({
    queryKey: ['admin-retention-policy', selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () => (await dataRetentionApi.getPolicy(selectedId!)).data.data,
  });

  const syncMutation = useMutation({
    mutationFn: () => dataRetentionApi.syncWithdrawn(),
    onSuccess: (res) => {
      showToast(t('dataRetention.syncDone', { n: res.data.data.upserted }), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-retention-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-retention-scheduled'] });
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      body: RetentionPolicyUpdateInput;
    }) => (await dataRetentionApi.updatePolicy(payload.id, payload.body)).data.data,
    onSuccess: (data) => {
      if ('requiresConfirmation' in data && data.requiresConfirmation) {
        setImpactPreview({
          affectedRecords: data.impact.affectedRecords,
          scheduleChanged: data.impact.scheduleChanged,
        });
        showToast(t('dataRetention.confirmImpactNeeded'), 'info');
        return;
      }
      setImpactPreview(null);
      setChangeReason('');
      showToast(t('saved'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-retention-policies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-retention-policy', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['admin-retention-summary'] });
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const selected = detailQuery.data?.policy;
  const kpi = useMemo(() => summaryQuery.data, [summaryQuery.data]);
  const policies = policiesQuery.data?.items ?? [];

  const selectPolicy = (p: RetentionPolicy) => {
    setSelectedId(p.id);
    setEditPeriod({ value: p.periodValue, unit: p.periodUnit });
    setImpactPreview(null);
  };

  if (summaryQuery.isLoading || policiesQuery.isLoading) {
    return (
      <AdminPageShell title={t('dataRetention.title')} subtitle={t('dataRetention.subtitle')}>
        <Skeleton count={5} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={t('dataRetention.title')} subtitle={t('dataRetention.subtitle')}>
      <div className="admin-retention">
        <AdminPanel title={t('dataRetention.overview')}>
          <div className="admin-stats admin-retention__stats">
            <div className="admin-stat">
              <div className="admin-stat__value">{kpi?.policyTotal ?? 0}</div>
              <div className="admin-stat__label">{t('dataRetention.kpiTotal')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{kpi?.policyActive ?? 0}</div>
              <div className="admin-stat__label">{t('dataRetention.kpiActive')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{kpi?.scheduledTotal ?? 0}</div>
              <div className="admin-stat__label">{t('dataRetention.kpiScheduled')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{kpi?.dueIn7Days ?? 0}</div>
              <div className="admin-stat__label">{t('dataRetention.kpiDue7')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{kpi?.deleteFailed ?? 0}</div>
              <div className="admin-stat__label">{t('dataRetention.kpiFailed')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{kpi?.onHold ?? 0}</div>
              <div className="admin-stat__label">{t('dataRetention.kpiHold')}</div>
            </div>
            <div className="admin-stat">
              <div className="admin-stat__value">{kpi?.anonymized ?? 0}</div>
              <div className="admin-stat__label">{t('dataRetention.kpiAnonymized')}</div>
            </div>
          </div>
          <div className="admin-retention__quick">
            <Link className="btn btn--secondary" to={ROUTES.ADMIN_DATA_RETENTION_SCHEDULED}>
              {t('dataRetention.navScheduled')}
            </Link>
            <Link className="btn btn--secondary" to={ROUTES.ADMIN_DATA_RETENTION_LOGS}>
              {t('dataRetention.navLogs')}
            </Link>
            <Link className="btn btn--secondary" to={ROUTES.ADMIN_DATA_RETENTION_AUDIT}>
              {t('dataRetention.navAudit')}
            </Link>
            <button
              type="button"
              className="btn btn--primary"
              disabled={syncMutation.isPending}
              onClick={() => syncMutation.mutate()}
            >
              {t('dataRetention.syncWithdrawn')}
            </button>
          </div>
        </AdminPanel>

        <div className="admin-retention__layout">
          <AdminPanel
            title={t('dataRetention.policies')}
            count={policies.length}
            countLabel={t('listCount', { count: policies.length })}
          >
            <div className="admin-toolbar admin-retention__toolbar">
              <input
                className="input"
                type="search"
                value={q}
                placeholder={t('dataRetention.search')}
                aria-label={t('dataRetention.search')}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSearch(q.trim());
                }}
              />
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setSearch(q.trim())}
              >
                {t('dataRetention.searchAction')}
              </button>
            </div>

            <div
              className="admin-retention__chips"
              role="group"
              aria-label={t('dataRetention.colCategory')}
            >
              <button
                type="button"
                className={`admin-retention__chip${category === '' ? ' admin-retention__chip--active' : ''}`}
                aria-pressed={category === ''}
                onClick={() => setCategory('')}
              >
                {t('dataRetention.allCategories')}
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`admin-retention__chip${category === c ? ' admin-retention__chip--active' : ''}`}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {t(`dataRetention.category.${c}`)}
                </button>
              ))}
            </div>

            {policies.length === 0 ? (
              <div className="admin-empty">{t('dataRetention.emptyPolicies')}</div>
            ) : (
              <div className="admin-retention__list">
                <div className="admin-retention__head" aria-hidden>
                  <span>{t('dataRetention.colName')}</span>
                  <span>{t('dataRetention.colMeta')}</span>
                  <span>{t('dataRetention.colStatus')}</span>
                </div>
                {policies.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`admin-retention__row${selectedId === p.id ? ' is-selected' : ''}`}
                    onClick={() => selectPolicy(p)}
                  >
                    <div className="admin-retention__main">
                      <div className="admin-retention__title-row">
                        <h3 className="admin-retention__name">{p.name}</h3>
                        <span
                          className={`admin-status-pill${p.isActive ? ' is-active' : ' is-inactive'}`}
                        >
                          {p.isActive
                            ? t('dataRetention.colActive')
                            : t('dataRetention.inactive')}
                        </span>
                      </div>
                      <p className="admin-retention__code">{p.code}</p>
                    </div>
                    <dl className="admin-retention__facts">
                      <div className="admin-retention__fact">
                        <dt>{t('dataRetention.colCategory')}</dt>
                        <dd>{t(`dataRetention.category.${p.dataCategory}`)}</dd>
                      </div>
                      <div className="admin-retention__fact">
                        <dt>{t('dataRetention.colPeriod')}</dt>
                        <dd>{formatPeriod(p, t)}</dd>
                      </div>
                      <div className="admin-retention__fact">
                        <dt>{t('dataRetention.colSampleDday')}</dt>
                        <dd>
                          <span className={ddayPillClass(p.sampleDaysRemaining)}>
                            {ddayLabel(p.sampleDaysRemaining, t)}
                          </span>
                        </dd>
                      </div>
                      <div className="admin-retention__fact">
                        <dt>{t('dataRetention.colAuto')}</dt>
                        <dd>
                          {p.autoDelete
                            ? t('dataRetention.autoOn')
                            : t('dataRetention.autoOff')}
                        </dd>
                      </div>
                    </dl>
                    <div className="admin-retention__actions">
                      <span className="admin-status-pill is-verified">v{p.currentVersion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </AdminPanel>

          {selected ? (
            <AdminPanel
              className="admin-retention__detail-sticky"
              title={selected.name}
              desc={selected.description || t('dataRetention.noDesc')}
            >
              <div className="admin-retention__detail">
                <dl className="admin-retention__dl">
                  <div>
                    <dt>{t('dataRetention.colCategory')}</dt>
                    <dd>{t(`dataRetention.category.${selected.dataCategory}`)}</dd>
                  </div>
                  <div>
                    <dt>{t('dataRetention.colReason')}</dt>
                    <dd>{t(`dataRetention.reason.${selected.retentionReason}`)}</dd>
                  </div>
                  <div>
                    <dt>{t('dataRetention.legalBasis')}</dt>
                    <dd>{selected.legalBasisNote || '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('dataRetention.colConsent')}</dt>
                    <dd>{selected.consentNameKo ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('dataRetention.tables')}</dt>
                    <dd>{selected.tableNames.join(', ') || '—'}</dd>
                  </div>
                  <div>
                    <dt>{t('dataRetention.colPeriod')}</dt>
                    <dd>{formatPeriod(selected, t)}</dd>
                  </div>
                  <div>
                    <dt>{t('dataRetention.colBasis')}</dt>
                    <dd>{t(`dataRetention.basis.${selected.startBasis}`)}</dd>
                  </div>
                  <div>
                    <dt>{t('dataRetention.sampleSchedule')}</dt>
                    <dd>
                      {selected.sampleScheduledDeletionAt.slice(0, 10)} (
                      {ddayLabel(selected.sampleDaysRemaining, t)})
                    </dd>
                  </div>
                  <div>
                    <dt>{t('dataRetention.deletionMethod')}</dt>
                    <dd>{t(`dataRetention.method.${selected.deletionMethod}`)}</dd>
                  </div>
                  <div>
                    <dt>{t('dataRetention.colVersion')}</dt>
                    <dd>v{selected.currentVersion}</dd>
                  </div>
                </dl>

                <div className="admin-retention__edit">
                  <h3 className="admin-retention__edit-title">{t('dataRetention.editPeriod')}</h3>
                  <p className="admin-retention__detail-desc">{t('dataRetention.editPeriodHint')}</p>
                  <div className="admin-form-grid">
                    <label className="admin-form-card">
                      <span className="admin-form-card__label">
                        {t('dataRetention.colPeriod')}
                      </span>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        value={editPeriod.value}
                        onChange={(e) =>
                          setEditPeriod((prev) => ({
                            ...prev,
                            value: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </label>
                    <label className="admin-form-card">
                      <span className="admin-form-card__label">
                        {t('dataRetention.periodUnit')}
                      </span>
                      <select
                        className="admin-select"
                        value={editPeriod.unit}
                        onChange={(e) =>
                          setEditPeriod((prev) => ({
                            ...prev,
                            unit: e.target.value as 'day' | 'month' | 'year',
                          }))
                        }
                      >
                        <option value="day">{t('dataRetention.unitDay')}</option>
                        <option value="month">{t('dataRetention.unitMonth')}</option>
                        <option value="year">{t('dataRetention.unitYear')}</option>
                      </select>
                    </label>
                    <label className="admin-form-card admin-form-card--full">
                      <span className="admin-form-card__label">
                        {t('dataRetention.changeReason')}
                      </span>
                      <input
                        className="input"
                        type="text"
                        value={changeReason}
                        onChange={(e) => setChangeReason(e.target.value)}
                        placeholder={t('dataRetention.changeReason')}
                      />
                    </label>
                  </div>

                  {impactPreview ? (
                    <p className="admin-retention__impact">
                      {t('dataRetention.impactPreview', {
                        affected: impactPreview.affectedRecords,
                        changed: impactPreview.scheduleChanged,
                      })}
                    </p>
                  ) : null}

                  <div className="admin-retention__actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      disabled={!changeReason.trim() || updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: selected.id,
                          body: {
                            periodValue: editPeriod.value,
                            periodUnit: editPeriod.unit,
                            changeReason,
                            confirmImpact: false,
                          },
                        })
                      }
                    >
                      {t('dataRetention.previewImpact')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      disabled={
                        !changeReason.trim() || !impactPreview || updateMutation.isPending
                      }
                      onClick={() =>
                        updateMutation.mutate({
                          id: selected.id,
                          body: {
                            periodValue: editPeriod.value,
                            periodUnit: editPeriod.unit,
                            changeReason,
                            confirmImpact: true,
                          },
                        })
                      }
                    >
                      {t('dataRetention.applyPeriod')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      disabled={updateMutation.isPending}
                      onClick={() =>
                        updateMutation.mutate({
                          id: selected.id,
                          body: {
                            isActive: !selected.isActive,
                            changeReason: selected.isActive
                              ? 'deactivate policy'
                              : 'activate policy',
                          },
                        })
                      }
                    >
                      {selected.isActive
                        ? t('dataRetention.deactivate')
                        : t('dataRetention.activate')}
                    </button>
                  </div>
                </div>

                {(detailQuery.data?.versions.length ?? 0) > 0 ? (
                  <div>
                    <h3 className="admin-retention__edit-title">{t('dataRetention.versions')}</h3>
                    <ul className="admin-retention__versions">
                      {detailQuery.data!.versions.map((v) => (
                        <li key={v.id}>
                          v{v.version} · {v.changeReason || '—'} ·{' '}
                          {new Date(v.effectiveFrom).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </AdminPanel>
          ) : (
            <AdminPanel title={t('dataRetention.detailEmptyTitle')}>
              <div className="admin-empty">{t('dataRetention.detailEmpty')}</div>
            </AdminPanel>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}
