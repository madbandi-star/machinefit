import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RetentionPolicy, RetentionPolicyUpdateInput } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { dataRetentionApi } from '@/api/data-retention.api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

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

export function AdminDataRetentionPage() {
  const { t } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
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
    queryKey: ['admin-retention-policies', q, category],
    queryFn: async () =>
      (
        await dataRetentionApi.listPolicies({
          q: q || undefined,
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

  if (summaryQuery.isLoading || policiesQuery.isLoading) {
    return (
      <AdminPageShell title={t('dataRetention.title')} subtitle={t('dataRetention.subtitle')}>
        <Skeleton count={5} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={t('dataRetention.title')} subtitle={t('dataRetention.subtitle')}>
      <section className="admin-panel">
        <div className="admin-stats">
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
        <div className="admin-row__actions" style={{ marginTop: 12 }}>
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
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel__title">{t('dataRetention.policies')}</h2>
        <div className="admin-filters">
          <input
            type="search"
            placeholder={t('dataRetention.search')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">{t('dataRetention.allCategories')}</option>
            {(
              [
                'personal',
                'payment',
                'service',
                'log',
                'community',
                'workout',
                'auth',
                'other',
              ] as const
            ).map((c) => (
              <option key={c} value={c}>
                {t(`dataRetention.category.${c}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-table-wrap admin-table-wrap--desktop">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('dataRetention.colName')}</th>
                <th>{t('dataRetention.colCategory')}</th>
                <th>{t('dataRetention.colReason')}</th>
                <th>{t('dataRetention.colConsent')}</th>
                <th>{t('dataRetention.colPeriod')}</th>
                <th>{t('dataRetention.colBasis')}</th>
                <th>{t('dataRetention.colSampleDday')}</th>
                <th>{t('dataRetention.colAuto')}</th>
                <th>{t('dataRetention.colActive')}</th>
                <th>{t('dataRetention.colVersion')}</th>
              </tr>
            </thead>
            <tbody>
              {(policiesQuery.data?.items ?? []).map((p) => (
                <tr
                  key={p.id}
                  className={selectedId === p.id ? 'is-selected' : undefined}
                  onClick={() => {
                    setSelectedId(p.id);
                    setEditPeriod({
                      value: p.periodValue,
                      unit: p.periodUnit,
                    });
                    setImpactPreview(null);
                  }}
                >
                  <td>
                    <strong>{p.name}</strong>
                    <div className="admin-muted">{p.code}</div>
                  </td>
                  <td>{t(`dataRetention.category.${p.dataCategory}`)}</td>
                  <td>{t(`dataRetention.reason.${p.retentionReason}`)}</td>
                  <td>{p.consentNameKo ?? '—'}</td>
                  <td>{formatPeriod(p, t)}</td>
                  <td>{t(`dataRetention.basis.${p.startBasis}`)}</td>
                  <td>{ddayLabel(p.sampleDaysRemaining, t)}</td>
                  <td>{p.autoDelete ? 'ON' : 'OFF'}</td>
                  <td>{p.isActive ? 'ON' : 'OFF'}</td>
                  <td>v{p.currentVersion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-card-list admin-card-list--mobile">
          {(policiesQuery.data?.items ?? []).map((p) => (
            <button
              key={p.id}
              type="button"
              className="admin-card"
              onClick={() => {
                setSelectedId(p.id);
                setEditPeriod({ value: p.periodValue, unit: p.periodUnit });
                setImpactPreview(null);
              }}
            >
              <strong>{p.name}</strong>
              <div>
                {t(`dataRetention.category.${p.dataCategory}`)} · {formatPeriod(p, t)}
              </div>
              <div>
                {ddayLabel(p.sampleDaysRemaining, t)} ·{' '}
                {p.autoDelete ? t('dataRetention.autoOn') : t('dataRetention.autoOff')}
              </div>
            </button>
          ))}
        </div>
      </section>

      {selected && (
        <section className="admin-panel">
          <h2 className="admin-panel__title">{selected.name}</h2>
          <p className="admin-muted">{selected.description || t('dataRetention.noDesc')}</p>
          <dl className="admin-dl">
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

          <h3 className="admin-panel__title">{t('dataRetention.editPeriod')}</h3>
          <p className="admin-muted">{t('dataRetention.editPeriodHint')}</p>
          <div className="admin-filters">
            <input
              type="number"
              min={0}
              value={editPeriod.value}
              onChange={(e) =>
                setEditPeriod((prev) => ({ ...prev, value: Number(e.target.value) || 0 }))
              }
            />
            <select
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
            <input
              type="text"
              placeholder={t('dataRetention.changeReason')}
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
            />
          </div>
          {impactPreview && (
            <p className="admin-muted">
              {t('dataRetention.impactPreview', {
                affected: impactPreview.affectedRecords,
                changed: impactPreview.scheduleChanged,
              })}
            </p>
          )}
          <div className="admin-row__actions">
            <button
              type="button"
              className="btn btn--secondary"
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
              className="btn btn--primary"
              disabled={!changeReason.trim() || !impactPreview || updateMutation.isPending}
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
              className="btn btn--secondary"
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
              {selected.isActive ? t('dataRetention.deactivate') : t('dataRetention.activate')}
            </button>
          </div>

          {(detailQuery.data?.versions.length ?? 0) > 0 && (
            <>
              <h3 className="admin-panel__title">{t('dataRetention.versions')}</h3>
              <ul className="admin-list">
                {detailQuery.data!.versions.map((v) => (
                  <li key={v.id}>
                    v{v.version} · {v.changeReason || '—'} ·{' '}
                    {new Date(v.effectiveFrom).toLocaleString()}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </AdminPageShell>
  );
}
