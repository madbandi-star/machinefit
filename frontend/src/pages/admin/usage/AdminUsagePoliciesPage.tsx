import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { UsagePolicy, UsagePolicyUpdateInput } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminUsageApi } from '@/api/usage.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

type PolicyFilter = 'all' | 'enforced' | 'active';

function LimitInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="ag-field">
      <span>{label}</span>
      <input
        className="input"
        type="number"
        min={0}
        placeholder="∞"
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === '' ? null : Math.max(0, Number(raw) || 0));
        }}
      />
    </label>
  );
}

export function AdminUsagePoliciesPage() {
  const { t } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<UsagePolicyUpdateInput | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<PolicyFilter>('all');

  const policiesQuery = useQuery({
    queryKey: ['admin-usage-policies'],
    queryFn: async () => (await adminUsageApi.listPolicies()).data.data,
  });

  const policies = policiesQuery.data ?? [];

  const stats = useMemo(() => {
    const total = policies.length;
    const enforced = policies.filter((p) => p.limitsEnforced).length;
    const active = policies.filter((p) => p.isActive).length;
    const unlimitedFreeDaily = policies.filter((p) => p.freeDailyLimit == null).length;
    return { total, enforced, active, unlimitedFreeDaily };
  }, [policies]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return policies.filter((p) => {
      if (filter === 'enforced' && !p.limitsEnforced) return false;
      if (filter === 'active' && !p.isActive) return false;
      if (!needle) return true;
      return (
        p.featureName.toLowerCase().includes(needle) ||
        p.featureCode.toLowerCase().includes(needle) ||
        (p.description ?? '').toLowerCase().includes(needle)
      );
    });
  }, [policies, filter, q]);

  const selected = policies.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected || !editorOpen) {
      if (!selected) setDraft(null);
      return;
    }
    setDraft({
      featureName: selected.featureName,
      description: selected.description,
      freeAllowed: selected.freeAllowed,
      freeDailyLimit: selected.freeDailyLimit,
      freeMonthlyLimit: selected.freeMonthlyLimit,
      premiumAllowed: selected.premiumAllowed,
      premiumDailyLimit: selected.premiumDailyLimit,
      premiumMonthlyLimit: selected.premiumMonthlyLimit,
      limitsEnforced: selected.limitsEnforced,
      isActive: selected.isActive,
    });
  }, [selected, editorOpen]);

  const saveMutation = useMutation({
    mutationFn: async (payload: { id: string; body: UsagePolicyUpdateInput }) =>
      (await adminUsageApi.updatePolicy(payload.id, payload.body)).data.data,
    onSuccess: () => {
      showToast(t('saved'), 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-usage-policies'] });
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const openEdit = (p: UsagePolicy) => {
    setSelectedId(p.id);
    setExpandedId(p.id);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setDraft(null);
  };

  if (policiesQuery.isLoading) {
    return (
      <AdminPageShell title={t('usage.policiesTitle')} subtitle={t('usage.policiesSubtitle')}>
        <Skeleton count={5} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={t('usage.policiesTitle')} subtitle={t('usage.policiesSubtitle')}>
      <div className="ag">
        <p className="ag-banner">{t('usage.policyBanner')}</p>

        <section className="ag-kpis ag-kpis--4" aria-label={t('usage.policyList')}>
          <button
            type="button"
            className={`ag-kpi${filter === 'all' ? ' is-active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span className="ag-kpi__value">{stats.total}</span>
            <span className="ag-kpi__label">{t('usage.kpiPolicyTotal')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${filter === 'enforced' ? ' is-active' : ''}${
              stats.enforced > 0 ? ' is-warn' : ''
            }`}
            onClick={() => setFilter('enforced')}
          >
            <span className="ag-kpi__value">{stats.enforced}</span>
            <span className="ag-kpi__label">{t('usage.kpiPolicyEnforced')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${filter === 'active' ? ' is-active' : ''}`}
            onClick={() => setFilter('active')}
          >
            <span className="ag-kpi__value">{stats.active}</span>
            <span className="ag-kpi__label">{t('usage.kpiPolicyActive')}</span>
          </button>
          <div className={`ag-kpi${stats.unlimitedFreeDaily > 0 ? ' is-muted' : ''}`}>
            <span className="ag-kpi__value">{stats.unlimitedFreeDaily}</span>
            <span className="ag-kpi__label">{t('usage.kpiUnlimitedFreeDaily')}</span>
          </div>
        </section>

        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              className="ag-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('usage.policySearchPlaceholder')}
              aria-label={t('usage.policySearchPlaceholder')}
            />
            <div className="ag-chips" role="group" aria-label={t('usage.policyFilter')}>
              <button
                type="button"
                className={`ag-chip${filter === 'all' ? ' is-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                {t('usage.filterAll')}
                <span className="ag-chip__count">{stats.total}</span>
              </button>
              <button
                type="button"
                className={`ag-chip${filter === 'enforced' ? ' is-active' : ''}`}
                onClick={() => setFilter('enforced')}
              >
                {t('usage.filterEnforced')}
                <span className="ag-chip__count">{stats.enforced}</span>
              </button>
              <button
                type="button"
                className={`ag-chip${filter === 'active' ? ' is-active' : ''}`}
                onClick={() => setFilter('active')}
              >
                {t('usage.filterActive')}
                <span className="ag-chip__count">{stats.active}</span>
              </button>
            </div>
          </div>

          <div className={`ag-layout${editorOpen ? ' is-editing' : ''}`}>
            <div className="ag-main">
              {filtered.length === 0 ? (
                <p className="ag-empty">{t('usage.noPolicies')}</p>
              ) : (
                <div className="ag-queue">
                  {filtered.map((p) => {
                    const open = expandedId === p.id;
                    const selectedRow = selectedId === p.id && editorOpen;
                    return (
                      <article
                        key={p.id}
                        className={[
                          'ag-card',
                          p.isActive ? 'is-on' : 'is-off',
                          p.limitsEnforced ? 'is-warn' : '',
                          selectedRow ? 'is-selected' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <button
                          type="button"
                          className="ag-card__main"
                          onClick={() =>
                            setExpandedId((prev) => (prev === p.id ? null : p.id))
                          }
                        >
                          <span className="ag-card__identity">
                            <span className="ag-card__title">{p.featureName}</span>
                            <span className="ag-card__meta">
                              {p.featureCode}
                              {' · '}
                              {p.freeDailyLimit == null
                                ? t('usage.unlimited')
                                : t('usage.freeDailyShort', { n: p.freeDailyLimit })}
                            </span>
                          </span>
                          <span
                            className={`ag-pill ${
                              p.limitsEnforced ? 'ag-pill--warn' : 'ag-pill--off'
                            }`}
                          >
                            {p.limitsEnforced ? t('usage.enforcedOn') : t('usage.enforcedOff')}
                          </span>
                          <span
                            className={`ag-pill ${p.isActive ? 'ag-pill--on' : 'ag-pill--off'}`}
                          >
                            {p.isActive ? t('usage.isActive') : t('usage.inactive')}
                          </span>
                          <span className="ag-card__chevron" aria-hidden>
                            {open ? '▾' : '▸'}
                          </span>
                        </button>
                        {open ? (
                          <div className="ag-card__detail">
                            <p className="ag-card__excerpt">
                              {p.description?.trim()
                                ? p.description
                                : t('usage.noDescription')}
                            </p>
                            <div className="ag-card__actions">
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                onClick={() => openEdit(p)}
                              >
                                {t('usage.editPolicy')}
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

            {editorOpen && selected && draft ? (
              <aside className="ag-editor" aria-label={t('usage.policyEdit')}>
                <div className="ag-editor__head">
                  <div>
                    <h2 className="ag-editor__title">{t('usage.policyEdit')}</h2>
                    <p className="ag-editor__hint">{selected.featureCode}</p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={closeEditor}
                  >
                    {t('usage.closeDetail')}
                  </button>
                </div>

                <form
                  className="ag-editor__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveMutation.mutate({ id: selected.id, body: draft });
                  }}
                >
                  <label className="ag-field">
                    <span>{t('usage.fieldName')}</span>
                    <input
                      className="input"
                      value={draft.featureName ?? ''}
                      onChange={(e) => setDraft({ ...draft, featureName: e.target.value })}
                    />
                  </label>
                  <label className="ag-field ag-field--full">
                    <span>{t('usage.fieldDesc')}</span>
                    <textarea
                      className="input"
                      rows={2}
                      value={draft.description ?? ''}
                      onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    />
                  </label>

                  <label className="ag-check">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.freeAllowed)}
                      onChange={(e) => setDraft({ ...draft, freeAllowed: e.target.checked })}
                    />
                    <span>{t('usage.freeAllowed')}</span>
                  </label>
                  <label className="ag-check">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.premiumAllowed)}
                      onChange={(e) => setDraft({ ...draft, premiumAllowed: e.target.checked })}
                    />
                    <span>{t('usage.premiumAllowed')}</span>
                  </label>
                  <label className="ag-check">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.limitsEnforced)}
                      onChange={(e) => setDraft({ ...draft, limitsEnforced: e.target.checked })}
                    />
                    <span>{t('usage.limitsEnforced')}</span>
                  </label>
                  <label className="ag-check">
                    <input
                      type="checkbox"
                      checked={Boolean(draft.isActive)}
                      onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                    />
                    <span>{t('usage.isActive')}</span>
                  </label>

                  <div className="ag-field-row">
                    <LimitInput
                      label={t('usage.freeDaily')}
                      value={draft.freeDailyLimit ?? null}
                      onChange={(v) => setDraft({ ...draft, freeDailyLimit: v })}
                    />
                    <LimitInput
                      label={t('usage.freeMonthly')}
                      value={draft.freeMonthlyLimit ?? null}
                      onChange={(v) => setDraft({ ...draft, freeMonthlyLimit: v })}
                    />
                  </div>
                  <div className="ag-field-row">
                    <LimitInput
                      label={t('usage.premiumDaily')}
                      value={draft.premiumDailyLimit ?? null}
                      onChange={(v) => setDraft({ ...draft, premiumDailyLimit: v })}
                    />
                    <LimitInput
                      label={t('usage.premiumMonthly')}
                      value={draft.premiumMonthlyLimit ?? null}
                      onChange={(v) => setDraft({ ...draft, premiumMonthlyLimit: v })}
                    />
                  </div>

                  <div className="ag-editor__actions">
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={saveMutation.isPending}
                    >
                      {t('usage.save')}
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={closeEditor}>
                      {t('usage.closeDetail')}
                    </button>
                  </div>
                </form>
              </aside>
            ) : null}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
