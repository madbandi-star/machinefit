import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PointPolicy, PointPolicyUpdateInput } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminPointsApi } from '@/api/points.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

type StatusFilter = 'all' | 'enabled' | 'disabled';

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatLimit(n: number | null | undefined): string {
  return n == null ? '∞' : String(n);
}

export function AdminPointsPoliciesPage() {
  const { t } = useTranslation(['admin', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PointPolicyUpdateInput | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const policiesQuery = useQuery({
    queryKey: ['admin-points-policies'],
    queryFn: async () => (await adminPointsApi.listPolicies()).data.data,
  });

  const rows = policiesQuery.data ?? [];
  const selected = rows.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) {
      setDraft(null);
      return;
    }
    setDraft({
      actionName: selected.actionName,
      points: selected.points,
      dailyLimit: selected.dailyLimit,
      userLimit: selected.userLimit,
      cooldownSeconds: selected.cooldownSeconds,
      enabled: selected.enabled,
      startAt: selected.startAt,
      endAt: selected.endAt,
      description: selected.description,
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: string; body: PointPolicyUpdateInput }) =>
      (await adminPointsApi.updatePolicy(payload.id, payload.body)).data.data,
    onSuccess: () => {
      showToast(t('admin:saved'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-points-policies'] });
    },
    onError: () => showToast(t('admin:error'), 'error'),
  });

  const stats = useMemo(() => {
    const enabled = rows.filter((p) => p.enabled).length;
    const disabled = rows.length - enabled;
    const avgPoints =
      rows.length === 0
        ? 0
        : Math.round(rows.reduce((sum, p) => sum + p.points, 0) / rows.length);
    return { total: rows.length, enabled, disabled, avgPoints };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((p) => {
      if (statusFilter === 'enabled' && !p.enabled) return false;
      if (statusFilter === 'disabled' && p.enabled) return false;
      if (!needle) return true;
      return (
        p.actionName.toLowerCase().includes(needle) ||
        String(p.actionCode).toLowerCase().includes(needle)
      );
    });
  }, [rows, q, statusFilter]);

  const selectPolicy = (p: PointPolicy) => {
    setSelectedId(p.id);
    setExpandedId(p.id);
  };

  const closeEditor = () => {
    setSelectedId(null);
    setDraft(null);
  };

  if (policiesQuery.isLoading) {
    return (
      <AdminPageShell title={t('admin:points.policiesTitle')} subtitle={t('admin:points.policiesSubtitle')}>
        <Skeleton count={5} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={t('admin:points.policiesTitle')} subtitle={t('admin:points.policiesSubtitle')}>
      <div className="ag">
        <section className="ag-kpis ag-kpis--4" aria-label={t('admin:points.stats')}>
          <button
            type="button"
            className={`ag-kpi${statusFilter === 'all' ? ' is-active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span className="ag-kpi__value">{stats.total}</span>
            <span className="ag-kpi__label">{t('admin:points.statTotal')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${statusFilter === 'enabled' ? ' is-active' : ''}`}
            onClick={() => setStatusFilter('enabled')}
          >
            <span className="ag-kpi__value">{stats.enabled}</span>
            <span className="ag-kpi__label">{t('admin:points.statEnabled')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${statusFilter === 'disabled' ? ' is-active' : ''}${
              stats.disabled > 0 ? ' is-muted' : ''
            }`}
            onClick={() => setStatusFilter('disabled')}
          >
            <span className="ag-kpi__value">{stats.disabled}</span>
            <span className="ag-kpi__label">{t('admin:points.statDisabled')}</span>
          </button>
          <div className="ag-kpi">
            <span className="ag-kpi__value">{stats.avgPoints}</span>
            <span className="ag-kpi__label">{t('admin:points.statAvgPoints')}</span>
          </div>
        </section>

        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              className="ag-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('admin:points.searchPlaceholder')}
              aria-label={t('admin:points.searchPlaceholder')}
            />
            <div className="ag-chips" role="group" aria-label={t('admin:points.enabled')}>
              <button
                type="button"
                className={`ag-chip${statusFilter === 'all' ? ' is-active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                {t('admin:points.statTotal')}
                <span className="ag-chip__count">{stats.total}</span>
              </button>
              <button
                type="button"
                className={`ag-chip${statusFilter === 'enabled' ? ' is-active' : ''}`}
                onClick={() => setStatusFilter('enabled')}
              >
                {t('admin:points.enabled')}
                <span className="ag-chip__count">{stats.enabled}</span>
              </button>
              <button
                type="button"
                className={`ag-chip${statusFilter === 'disabled' ? ' is-active' : ''}`}
                onClick={() => setStatusFilter('disabled')}
              >
                {t('admin:points.disabled')}
                <span className="ag-chip__count">{stats.disabled}</span>
              </button>
            </div>
          </div>

          <div className={`ag-layout${selected ? ' is-editing' : ''}`}>
            <div className="ag-main">
              {filtered.length === 0 ? (
                <p className="ag-empty">{t('admin:points.emptyPolicies')}</p>
              ) : (
                <div className="ag-queue">
                  {filtered.map((p) => {
                    const open = expandedId === p.id;
                    const isSelected = selectedId === p.id;
                    return (
                      <article
                        key={p.id}
                        className={[
                          'ag-card',
                          p.enabled ? 'is-on' : 'is-off',
                          isSelected ? 'is-selected' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <button
                          type="button"
                          className="ag-card__main"
                          onClick={() => {
                            const nextOpen = expandedId !== p.id;
                            setSelectedId(p.id);
                            setExpandedId(nextOpen ? p.id : null);
                          }}
                        >
                          <span className="ag-card__identity">
                            <span className="ag-card__title">{p.actionName}</span>
                            <span className="ag-card__meta">
                              {p.points}P
                              {' · '}
                              {t('admin:points.dailyLimitShort', {
                                count: formatLimit(p.dailyLimit),
                              })}
                              {' / '}
                              {t('admin:points.userLimitShort', {
                                count: formatLimit(p.userLimit),
                              })}
                            </span>
                          </span>
                          <span className={`ag-pill ${p.enabled ? 'ag-pill--on' : 'ag-pill--off'}`}>
                            {p.enabled ? t('admin:points.enabled') : t('admin:points.disabled')}
                          </span>
                          <span className="ag-card__chevron" aria-hidden>
                            {open ? '▾' : '▸'}
                          </span>
                        </button>
                        {open ? (
                          <div className="ag-card__detail">
                            <p className="ag-card__excerpt">
                              <code>{p.actionCode}</code>
                              {p.description ? ` · ${p.description}` : ''}
                              {' · '}
                              {t('admin:points.cooldown')}: {p.cooldownSeconds}s
                            </p>
                            <div className="ag-card__actions">
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={() => selectPolicy(p)}
                              >
                                {t('admin:points.policyEdit')}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>

            {selected && draft ? (
              <aside className="ag-editor" aria-label={t('admin:points.policyEdit')}>
                <div className="ag-editor__head">
                  <div>
                    <h2 className="ag-editor__title">{t('admin:points.policyEdit')}</h2>
                    <p className="ag-editor__hint">
                      {selected.actionName}
                      {' · '}
                      <code>{selected.actionCode}</code>
                    </p>
                  </div>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={closeEditor}>
                    {t('common:actions.close')}
                  </button>
                </div>

                <div className="ag-editor__form">
                  <label className="ag-field">
                    <span>{t('admin:points.actionName')}</span>
                    <input
                      className="input"
                      value={draft.actionName ?? ''}
                      onChange={(e) => setDraft({ ...draft, actionName: e.target.value })}
                    />
                  </label>
                  <label className="ag-field">
                    <span>{t('admin:points.points')}</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={draft.points ?? 0}
                      onChange={(e) =>
                        setDraft({ ...draft, points: Math.max(0, Number(e.target.value) || 0) })
                      }
                    />
                  </label>
                  <div className="ag-field-row">
                    <label className="ag-field">
                      <span>{t('admin:points.dailyLimit')}</span>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        placeholder="∞"
                        value={draft.dailyLimit ?? ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            dailyLimit:
                              e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </label>
                    <label className="ag-field">
                      <span>{t('admin:points.userLimit')}</span>
                      <input
                        className="input"
                        type="number"
                        min={0}
                        placeholder="∞"
                        value={draft.userLimit ?? ''}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            userLimit:
                              e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="ag-field">
                    <span>{t('admin:points.cooldown')}</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={draft.cooldownSeconds ?? 0}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          cooldownSeconds: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </label>
                  <div className="ag-field-row">
                    <label className="ag-field">
                      <span>{t('admin:points.startAt')}</span>
                      <input
                        className="input"
                        type="datetime-local"
                        value={toLocalInput(draft.startAt)}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            startAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                          })
                        }
                      />
                    </label>
                    <label className="ag-field">
                      <span>{t('admin:points.endAt')}</span>
                      <input
                        className="input"
                        type="datetime-local"
                        value={toLocalInput(draft.endAt)}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            endAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                          })
                        }
                      />
                    </label>
                  </div>
                  <label className="ag-field">
                    <span>{t('admin:points.description')}</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={draft.description ?? ''}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                  </label>
                  <label className="ag-check">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.enabled)}
                      onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
                    />
                    <span>{t('admin:points.enabled')}</span>
                  </label>
                  <div className="ag-editor__actions">
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={saveMutation.isPending}
                      onClick={() => saveMutation.mutate({ id: selected.id, body: draft })}
                    >
                      {t('admin:save')}
                    </button>
                  </div>
                </div>
              </aside>
            ) : null}
          </div>
          {!selected ? <p className="ag-banner">{t('admin:points.pickPolicy')}</p> : null}
        </section>
      </div>
    </AdminPageShell>
  );
}
