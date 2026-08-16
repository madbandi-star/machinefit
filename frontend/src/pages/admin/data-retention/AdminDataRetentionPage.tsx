import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RetentionPolicy, RetentionPolicyUpdateInput } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { dataRetentionApi } from '@/api/data-retention.api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';
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

type KpiFilter = 'all' | 'active' | 'due7' | 'failed' | 'hold' | 'scheduled';

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
  if (days < 0) return 'ag-pill ag-pill--danger';
  if (days <= 7) return 'ag-pill ag-pill--warn';
  return 'ag-pill ag-pill--on';
}

export function AdminDataRetentionPage() {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>('all');
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
  const kpi = summaryQuery.data;
  const policies = policiesQuery.data?.items ?? [];

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of policies) {
      map.set(p.dataCategory, (map.get(p.dataCategory) ?? 0) + 1);
    }
    return map;
  }, [policies]);

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      if (kpiFilter === 'active' && !p.isActive) return false;
      if (kpiFilter === 'due7' && p.sampleDaysRemaining > 7) return false;
      return true;
    });
  }, [policies, kpiFilter]);

  const selectPolicy = (p: RetentionPolicy) => {
    setSelectedId(p.id);
    setEditPeriod({ value: p.periodValue, unit: p.periodUnit });
    setImpactPreview(null);
    setChangeReason('');
  };

  const closeEditor = () => {
    setSelectedId(null);
    setImpactPreview(null);
    setChangeReason('');
  };

  const onKpiClick = (next: KpiFilter) => {
    if (next === 'failed') {
      navigate(ROUTES.ADMIN_DATA_RETENTION_LOGS);
      return;
    }
    if (next === 'hold' || next === 'scheduled') {
      navigate(ROUTES.ADMIN_DATA_RETENTION_SCHEDULED);
      return;
    }
    setKpiFilter(next);
  };

  const loading = summaryQuery.isLoading || policiesQuery.isLoading;

  return (
    <AdminPageShell
      title={t('dataRetention.title')}
      subtitle={t('dataRetention.subtitle')}
      actions={
        <div className="adr-quick">
          <Link className="btn btn--secondary btn--sm" to={ROUTES.ADMIN_DATA_RETENTION_SCHEDULED}>
            {t('dataRetention.navScheduled')}
          </Link>
          <Link className="btn btn--secondary btn--sm" to={ROUTES.ADMIN_DATA_RETENTION_LOGS}>
            {t('dataRetention.navLogs')}
          </Link>
          <Link className="btn btn--secondary btn--sm" to={ROUTES.ADMIN_DATA_RETENTION_AUDIT}>
            {t('dataRetention.navAudit')}
          </Link>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            disabled={syncMutation.isPending}
            onClick={() => syncMutation.mutate()}
          >
            {t('dataRetention.syncWithdrawn')}
          </button>
        </div>
      }
    >
      <div className="ag">
        {loading ? <Skeleton count={1} height={72} /> : null}
        {!loading && kpi ? (
          <section className="ag-kpis" aria-label={t('dataRetention.overview')}>
            <button
              type="button"
              className={`ag-kpi${kpiFilter === 'all' ? ' is-active' : ''}`}
              onClick={() => onKpiClick('all')}
            >
              <span className="ag-kpi__value">{kpi.policyTotal}</span>
              <span className="ag-kpi__label">{t('dataRetention.kpiTotal')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${kpiFilter === 'active' ? ' is-active' : ''}`}
              onClick={() => onKpiClick('active')}
            >
              <span className="ag-kpi__value">{kpi.policyActive}</span>
              <span className="ag-kpi__label">{t('dataRetention.kpiActive')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${kpiFilter === 'due7' ? ' is-active' : ''}${
                kpi.dueIn7Days > 0 ? ' is-warn' : ''
              }`}
              onClick={() => onKpiClick('due7')}
            >
              <span className="ag-kpi__value">{kpi.dueIn7Days}</span>
              <span className="ag-kpi__label">{t('dataRetention.kpiDue7')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${kpi.deleteFailed > 0 ? ' is-danger' : ''}`}
              onClick={() => onKpiClick('failed')}
            >
              <span className="ag-kpi__value">{kpi.deleteFailed}</span>
              <span className="ag-kpi__label">{t('dataRetention.kpiFailed')}</span>
            </button>
            <button
              type="button"
              className={`ag-kpi${kpi.onHold > 0 ? ' is-warn' : ''}`}
              onClick={() => onKpiClick('hold')}
            >
              <span className="ag-kpi__value">{kpi.onHold}</span>
              <span className="ag-kpi__label">{t('dataRetention.kpiHold')}</span>
            </button>
            <button type="button" className="ag-kpi" onClick={() => onKpiClick('scheduled')}>
              <span className="ag-kpi__value">{kpi.scheduledTotal}</span>
              <span className="ag-kpi__label">{t('dataRetention.kpiScheduled')}</span>
            </button>
          </section>
        ) : null}

        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              className="ag-search"
              type="search"
              value={search}
              placeholder={t('dataRetention.search')}
              aria-label={t('dataRetention.search')}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="ag-chips" role="group" aria-label={t('dataRetention.colCategory')}>
              <button
                type="button"
                className={`ag-chip${category === '' ? ' is-active' : ''}`}
                onClick={() => setCategory('')}
              >
                {t('dataRetention.allCategories')}
                <span className="ag-chip__count">{policies.length}</span>
              </button>
              {CATEGORIES.map((c) => {
                const count = categoryCounts.get(c) ?? 0;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`ag-chip${category === c ? ' is-active' : ''}`}
                    onClick={() => setCategory(c)}
                  >
                    {t(`dataRetention.category.${c}`)}
                    {count > 0 ? <span className="ag-chip__count">{count}</span> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`ag-layout${selectedId ? ' is-editing' : ''}`}>
            <div className="ag-main">
              {policiesQuery.isError ? (
                <QueryErrorMessage onRetry={() => void policiesQuery.refetch()} />
              ) : null}
              {loading ? <Skeleton count={5} height={52} /> : null}
              {!loading && !policiesQuery.isError && filtered.length === 0 ? (
                <p className="ag-empty">{t('dataRetention.emptyPolicies')}</p>
              ) : null}
              {!loading && filtered.length > 0 ? (
                <div className="ag-queue">
                  {filtered.map((p) => {
                    const open = selectedId === p.id;
                    return (
                      <article
                        key={p.id}
                        className={[
                          'ag-card',
                          p.isActive ? 'is-on' : 'is-off',
                          open ? 'is-selected' : '',
                          p.sampleDaysRemaining <= 7 ? 'is-warn' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <button
                          type="button"
                          className="ag-card__main"
                          onClick={() => (open ? closeEditor() : selectPolicy(p))}
                        >
                          <span className="ag-card__identity">
                            <span className="ag-card__title">{p.name}</span>
                            <span className="ag-card__meta">
                              {t(`dataRetention.category.${p.dataCategory}`)}
                              {' · '}
                              {formatPeriod(p, t)}
                              {' · '}
                              {ddayLabel(p.sampleDaysRemaining, t)}
                              {' · '}
                              {p.autoDelete
                                ? t('dataRetention.autoOn')
                                : t('dataRetention.autoOff')}
                              {' · '}v{p.currentVersion}
                            </span>
                          </span>
                          <span
                            className={`ag-pill ${p.isActive ? 'ag-pill--on' : 'ag-pill--off'}`}
                          >
                            {p.isActive
                              ? t('dataRetention.colActive')
                              : t('dataRetention.inactive')}
                          </span>
                          <span className={ddayPillClass(p.sampleDaysRemaining)}>
                            {ddayLabel(p.sampleDaysRemaining, t)}
                          </span>
                          <span className="ag-card__chevron" aria-hidden>
                            {open ? '▾' : '▸'}
                          </span>
                        </button>
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {selected ? (
              <aside className="ag-editor" aria-label={selected.name}>
                <div className="ag-editor__head">
                  <div>
                    <h2 className="ag-editor__title">{selected.name}</h2>
                    <p className="ag-editor__hint">
                      {selected.description || t('dataRetention.noDesc')}
                    </p>
                  </div>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={closeEditor}>
                    {t('dataRetention.cancel')}
                  </button>
                </div>

                {detailQuery.isLoading ? <Skeleton count={3} height={40} /> : null}

                <dl className="adr-dl">
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

                <div className="ag-editor__form">
                  <h3 className="adr-section-title">{t('dataRetention.editPeriod')}</h3>
                  <p className="ag-editor__hint">{t('dataRetention.editPeriodHint')}</p>
                  <div className="ag-field-row">
                    <label className="ag-field">
                      <span>{t('dataRetention.colPeriod')}</span>
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
                    <label className="ag-field">
                      <span>{t('dataRetention.periodUnit')}</span>
                      <select
                        className="input"
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
                  </div>
                  <label className="ag-field ag-field--full">
                    <span>{t('dataRetention.changeReason')}</span>
                    <input
                      className="input"
                      type="text"
                      value={changeReason}
                      onChange={(e) => setChangeReason(e.target.value)}
                      placeholder={t('dataRetention.changeReason')}
                    />
                  </label>

                  {impactPreview ? (
                    <p className="ag-banner">
                      {t('dataRetention.impactPreview', {
                        affected: impactPreview.affectedRecords,
                        changed: impactPreview.scheduleChanged,
                      })}
                    </p>
                  ) : null}

                  <div className="ag-editor__actions">
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
                    <h3 className="adr-section-title">{t('dataRetention.versions')}</h3>
                    <ul className="adr-versions">
                      {detailQuery.data!.versions.map((v) => (
                        <li key={v.id}>
                          v{v.version} · {v.changeReason || '—'} ·{' '}
                          {new Date(v.effectiveFrom).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </aside>
            ) : null}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
