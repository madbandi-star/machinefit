import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { FortuneContentCategory, FortuneContentItem } from '@machinefit/shared';
import { adminFortuneApi } from '@/api/fortune.api';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { ScrollCarousel } from '@/components/navigation/ScrollCarousel/ScrollCarousel';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-fortune.css';

const CATEGORIES: FortuneContentCategory[] = [
  'keyword',
  'headline',
  'strategy',
  'pre_workout',
  'post_workout',
  'avoid',
  'one_liner',
  'style',
  'condition',
  'body_part',
];

type ActiveFilter = 'all' | 'active' | 'inactive';

const emptyForm = {
  category: 'headline' as FortuneContentCategory,
  code: '',
  locale: 'ko',
  title: '',
  body: '',
  priority: 100,
  isActive: true,
  dataConditionsText: '',
  scoreWeightsText: '',
};

function parseJsonObject(raw: string): Record<string, unknown> | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function categoryLabel(t: (key: string, opts?: { defaultValue?: string }) => string, category: string) {
  return t(`fortuneAdmin.categories.${category}`, { defaultValue: category });
}

export function AdminFortunePage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<FortuneContentItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin', 'fortune-content'],
    queryFn: async () => {
      const res = await adminFortuneApi.list({
        locale: 'ko',
        includeInactive: true,
      });
      return res.data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const dataConditions = parseJsonObject(form.dataConditionsText);
      const scoreWeightsRaw = parseJsonObject(form.scoreWeightsText);
      if (form.dataConditionsText.trim() && dataConditions === null) {
        throw new Error('bad_conditions');
      }
      if (form.scoreWeightsText.trim() && scoreWeightsRaw === null) {
        throw new Error('bad_weights');
      }
      const scoreWeights =
        scoreWeightsRaw == null
          ? scoreWeightsRaw
          : (Object.fromEntries(
              Object.entries(scoreWeightsRaw).map(([k, v]) => [k, Number(v)])
            ) as Record<string, number>);

      const payload = {
        category: form.category,
        code: form.code.trim().toUpperCase(),
        locale: form.locale,
        title: form.title.trim(),
        body: form.body,
        priority: Number(form.priority) || 100,
        isActive: form.isActive,
        dataConditions: dataConditions ?? null,
        scoreWeights: scoreWeights ?? null,
      };
      if (editing) {
        return adminFortuneApi.update(editing.id, payload);
      }
      return adminFortuneApi.create(payload);
    },
    onSuccess: async () => {
      showToast(t('fortuneAdmin.saved'), 'success');
      closeEditor();
      await queryClient.invalidateQueries({ queryKey: ['admin', 'fortune-content'] });
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message.startsWith('bad_')) {
        showToast(t('fortuneAdmin.invalidJson'), 'error');
        return;
      }
      showToast(t('common:errors.submitFailed'), 'error');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      adminFortuneApi.update(id, { isActive }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'fortune-content'] });
      showToast(t('fortuneAdmin.saved'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminFortuneApi.remove(id),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['admin', 'fortune-content'] });
      showToast(t('fortuneAdmin.deleted'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const rows = listQuery.data ?? [];
  const busy = saveMutation.isPending || toggleActiveMutation.isPending || deleteMutation.isPending;

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.isActive).length;
    const inactive = rows.length - active;
    const byCategory = new Map<string, number>();
    for (const row of rows) {
      byCategory.set(row.category, (byCategory.get(row.category) ?? 0) + 1);
    }
    return { total: rows.length, active, inactive, byCategory };
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (category && row.category !== category) return false;
        if (activeFilter === 'active' && !row.isActive) return false;
        if (activeFilter === 'inactive' && row.isActive) return false;
        if (!needle) return true;
        return (
          row.title.toLowerCase().includes(needle) ||
          row.code.toLowerCase().includes(needle) ||
          row.body.toLowerCase().includes(needle)
        );
      })
      .sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        if (a.priority !== b.priority) return a.priority - b.priority;
        return a.code.localeCompare(b.code);
      });
  }, [rows, category, activeFilter, q]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  const openEdit = (row: FortuneContentItem) => {
    setEditing(row);
    setForm({
      category: row.category,
      code: row.code,
      locale: row.locale,
      title: row.title,
      body: row.body,
      priority: row.priority,
      isActive: row.isActive,
      dataConditionsText: row.dataConditions
        ? JSON.stringify(row.dataConditions, null, 2)
        : '',
      scoreWeightsText: row.scoreWeights
        ? JSON.stringify(row.scoreWeights, null, 2)
        : '',
    });
    setExpandedId(row.id);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  return (
    <AdminPageShell
      title={t('fortuneAdmin.nav')}
      subtitle={t('fortuneAdmin.subtitle')}
      actions={
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          {t('fortuneAdmin.create')}
        </button>
      }
    >
      <div className="aft">
        {listQuery.isLoading ? <Skeleton count={1} height={72} /> : null}
        {!listQuery.isLoading ? (
          <section className="aft-kpis" aria-label={t('fortuneAdmin.stats')}>
            <button
              type="button"
              className={`aft-kpi${activeFilter === 'all' ? ' is-active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span className="aft-kpi__value">{stats.total}</span>
              <span className="aft-kpi__label">{t('fortuneAdmin.statTotal')}</span>
            </button>
            <button
              type="button"
              className={`aft-kpi${activeFilter === 'active' ? ' is-active' : ''}`}
              onClick={() => setActiveFilter('active')}
            >
              <span className="aft-kpi__value">{stats.active}</span>
              <span className="aft-kpi__label">{t('fortuneAdmin.statActive')}</span>
            </button>
            <button
              type="button"
              className={`aft-kpi${activeFilter === 'inactive' ? ' is-active' : ''}${
                stats.inactive > 0 ? ' is-muted' : ''
              }`}
              onClick={() => setActiveFilter('inactive')}
            >
              <span className="aft-kpi__value">{stats.inactive}</span>
              <span className="aft-kpi__label">{t('fortuneAdmin.statInactive')}</span>
            </button>
            <div className="aft-kpi">
              <span className="aft-kpi__value">{CATEGORIES.length}</span>
              <span className="aft-kpi__label">{t('fortuneAdmin.statCategories')}</span>
            </div>
          </section>
        ) : null}

        <section className="aft-panel">
          <div className="aft-toolbar">
            <input
              className="aft-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('fortuneAdmin.searchPlaceholder')}
              aria-label={t('fortuneAdmin.searchPlaceholder')}
            />
            <ScrollCarousel
              className="chip-carousel"
              scrollerClassName="aft-chips"
              scrollerProps={{ role: 'group', 'aria-label': t('fortuneAdmin.category') }}
            >
              <button
                type="button"
                className={`aft-chip${category === '' ? ' is-active' : ''}`}
                onClick={() => setCategory('')}
              >
                {t('fortuneAdmin.allCategories')}
                <span className="aft-chip__count">{stats.total}</span>
              </button>
              {CATEGORIES.map((c) => {
                const count = stats.byCategory.get(c) ?? 0;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`aft-chip${category === c ? ' is-active' : ''}`}
                    onClick={() => setCategory(c)}
                  >
                    {categoryLabel(t, c)}
                    <span className="aft-chip__count">{count}</span>
                  </button>
                );
              })}
            </ScrollCarousel>
          </div>

          <div className={`aft-layout${editorOpen ? ' is-editing' : ''}`}>
            <div className="aft-main">
              {listQuery.isLoading ? <Skeleton count={5} height={52} /> : null}
              {listQuery.isError ? (
                <QueryErrorMessage onRetry={() => void listQuery.refetch()} />
              ) : null}
              {!listQuery.isLoading && !listQuery.isError && filtered.length === 0 ? (
                <p className="aft-empty">{t('fortuneAdmin.empty')}</p>
              ) : null}
              {!listQuery.isLoading && filtered.length > 0 ? (
                <div className="aft-queue">
                  {filtered.map((row) => {
                    const open = expandedId === row.id;
                    return (
                      <article
                        key={row.id}
                        className={[
                          'aft-card',
                          row.isActive ? 'is-on' : 'is-off',
                          open ? 'is-open' : '',
                          editing?.id === row.id ? 'is-selected' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        <button
                          type="button"
                          className="aft-card__main"
                          onClick={() =>
                            setExpandedId((prev) => (prev === row.id ? null : row.id))
                          }
                        >
                          <span className="aft-card__cat">{categoryLabel(t, row.category)}</span>
                          <span className="aft-card__identity">
                            <span className="aft-card__title">{row.title}</span>
                            <span className="aft-card__meta">
                              {row.code}
                              {' · '}P{row.priority}
                              {' · '}
                              {row.locale}
                            </span>
                          </span>
                          <span
                            className={`aft-pill ${row.isActive ? 'aft-pill--on' : 'aft-pill--off'}`}
                          >
                            {row.isActive
                              ? t('fortuneAdmin.active')
                              : t('fortuneAdmin.inactive')}
                          </span>
                          <span className="aft-card__chevron" aria-hidden>
                            {open ? '▾' : '▸'}
                          </span>
                        </button>
                        {open ? (
                          <div className="aft-card__detail">
                            {row.body ? (
                              <p className="aft-card__excerpt">
                                {row.body.length > 180
                                  ? `${row.body.slice(0, 180)}…`
                                  : row.body}
                              </p>
                            ) : (
                              <p className="aft-card__excerpt aft-card__excerpt--empty">
                                {t('fortuneAdmin.noBody')}
                              </p>
                            )}
                            <div className="aft-card__actions">
                              <button
                                type="button"
                                className="btn btn--secondary btn--sm"
                                disabled={busy}
                                onClick={() => openEdit(row)}
                              >
                                {t('fortuneAdmin.edit')}
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm"
                                disabled={busy}
                                onClick={() =>
                                  toggleActiveMutation.mutate({
                                    id: row.id,
                                    isActive: !row.isActive,
                                  })
                                }
                              >
                                {row.isActive
                                  ? t('fortuneAdmin.deactivate')
                                  : t('fortuneAdmin.activate')}
                              </button>
                              <button
                                type="button"
                                className="btn btn--ghost btn--sm aft-btn--danger"
                                disabled={busy}
                                onClick={() => setPendingDelete(row.id)}
                              >
                                {t('common:actions.delete')}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : null}
            </div>

            {editorOpen ? (
              <aside
                className="aft-editor"
                aria-label={editing ? t('fortuneAdmin.edit') : t('fortuneAdmin.create')}
              >
                <div className="aft-editor__head">
                  <div>
                    <h2 className="aft-editor__title">
                      {editing ? t('fortuneAdmin.edit') : t('fortuneAdmin.create')}
                    </h2>
                    <p className="aft-editor__hint">
                      {editing
                        ? t('fortuneAdmin.editHint', { code: editing.code })
                        : t('fortuneAdmin.createHint')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={closeEditor}
                  >
                    {t('common:actions.close')}
                  </button>
                </div>

                <form
                  className="aft-editor__form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveMutation.mutate();
                  }}
                >
                  <label className="aft-field">
                    <span>{t('fortuneAdmin.category')}</span>
                    <select
                      className="input"
                      value={form.category}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          category: e.target.value as FortuneContentCategory,
                        }))
                      }
                      required
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {categoryLabel(t, c)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="aft-field">
                    <span>{t('fortuneAdmin.code')}</span>
                    <input
                      className="input"
                      value={form.code}
                      onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="UPPER_SNAKE"
                      required
                    />
                  </label>

                  <label className="aft-field aft-field--full">
                    <span>{t('fortuneAdmin.titleField')}</span>
                    <input
                      className="input"
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </label>

                  <label className="aft-field aft-field--full">
                    <span>{t('fortuneAdmin.body')}</span>
                    <textarea
                      className="input aft-textarea"
                      value={form.body}
                      onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                      rows={4}
                    />
                  </label>

                  <div className="aft-field-row">
                    <label className="aft-field">
                      <span>{t('fortuneAdmin.priority')}</span>
                      <input
                        className="input"
                        type="number"
                        value={form.priority}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            priority: Number(e.target.value) || 0,
                          }))
                        }
                      />
                    </label>
                    <label className="aft-field aft-field--check">
                      <span>{t('fortuneAdmin.active')}</span>
                      <span className="aft-check">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                          }
                        />
                        <span>{t('fortuneAdmin.activeHint')}</span>
                      </span>
                    </label>
                  </div>

                  <details className="aft-advanced">
                    <summary>{t('fortuneAdmin.advanced')}</summary>
                    <label className="aft-field aft-field--full">
                      <span>{t('fortuneAdmin.dataConditions')}</span>
                      <textarea
                        className="input aft-textarea aft-textarea--code"
                        value={form.dataConditionsText}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            dataConditionsText: e.target.value,
                          }))
                        }
                        placeholder="{}"
                        rows={3}
                        spellCheck={false}
                      />
                    </label>
                    <label className="aft-field aft-field--full">
                      <span>{t('fortuneAdmin.scoreWeights')}</span>
                      <textarea
                        className="input aft-textarea aft-textarea--code"
                        value={form.scoreWeightsText}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            scoreWeightsText: e.target.value,
                          }))
                        }
                        placeholder="{}"
                        rows={3}
                        spellCheck={false}
                      />
                    </label>
                  </details>

                  <div className="aft-editor__actions">
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={saveMutation.isPending}
                    >
                      {t('common:actions.save')}
                    </button>
                    <button type="button" className="btn btn--secondary" onClick={closeEditor}>
                      {t('common:actions.cancel')}
                    </button>
                  </div>
                </form>
              </aside>
            ) : null}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('common:actions.delete')}
        message={t('fortuneAdmin.deleteConfirm')}
        confirmLabel={t('common:actions.delete')}
        confirmVariant="danger"
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
        onClose={() => setPendingDelete(null)}
      />
    </AdminPageShell>
  );
}
