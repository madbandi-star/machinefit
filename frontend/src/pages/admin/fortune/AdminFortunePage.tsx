import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { FortuneContentCategory, FortuneContentItem } from '@machinefit/shared';
import { adminFortuneApi } from '@/api/fortune.api';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
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
  const [category, setCategory] = useState('');
  const [includeInactive, setIncludeInactive] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<FortuneContentItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin', 'fortune-content', category, includeInactive],
    queryFn: async () => {
      const res = await adminFortuneApi.list({
        locale: 'ko',
        category: category || undefined,
        includeInactive,
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
      setForm(emptyForm);
      setEditing(null);
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
  const activeCount = useMemo(() => rows.filter((r) => r.isActive).length, [rows]);

  const startEdit = (row: FortuneContentItem) => {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  return (
    <AdminPageShell title={t('fortuneAdmin.nav')} subtitle={t('fortuneAdmin.desc')}>
      <div className="admin-fortune">
        <AdminPanel
          title={editing ? t('fortuneAdmin.edit') : t('fortuneAdmin.create')}
          desc={
            editing
              ? t('fortuneAdmin.editHint', { code: editing.code })
              : t('fortuneAdmin.createHint')
          }
        >
          <form
            className="admin-fortune__form"
            onSubmit={(e) => {
              e.preventDefault();
              saveMutation.mutate();
            }}
          >
            <div className="admin-form-grid">
              <label className="admin-form-card">
                <span className="admin-form-card__label">{t('fortuneAdmin.category')}</span>
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

              <label className="admin-form-card">
                <span className="admin-form-card__label">{t('fortuneAdmin.code')}</span>
                <input
                  className="input"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="UPPER_SNAKE"
                  required
                />
              </label>

              <label className="admin-form-card admin-form-card--full">
                <span className="admin-form-card__label">{t('fortuneAdmin.titleField')}</span>
                <input
                  className="input"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  required
                />
              </label>

              <label className="admin-form-card admin-form-card--full">
                <span className="admin-form-card__label">{t('fortuneAdmin.body')}</span>
                <textarea
                  className="input admin-fortune__textarea"
                  value={form.body}
                  onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
                  rows={4}
                />
              </label>

              <label className="admin-form-card">
                <span className="admin-form-card__label">{t('fortuneAdmin.priority')}</span>
                <input
                  className="input"
                  type="number"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, priority: Number(e.target.value) || 0 }))
                  }
                />
              </label>

              <label className="admin-form-card admin-fortune__check-card">
                <span className="admin-form-card__label">{t('fortuneAdmin.active')}</span>
                <span className="admin-fortune__check">
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

              <label className="admin-form-card admin-form-card--full">
                <span className="admin-form-card__label">{t('fortuneAdmin.dataConditions')}</span>
                <textarea
                  className="input admin-fortune__textarea admin-fortune__textarea--code"
                  value={form.dataConditionsText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dataConditionsText: e.target.value }))
                  }
                  placeholder="{}"
                  rows={3}
                  spellCheck={false}
                />
              </label>

              <label className="admin-form-card admin-form-card--full">
                <span className="admin-form-card__label">{t('fortuneAdmin.scoreWeights')}</span>
                <textarea
                  className="input admin-fortune__textarea admin-fortune__textarea--code"
                  value={form.scoreWeightsText}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, scoreWeightsText: e.target.value }))
                  }
                  placeholder="{}"
                  rows={3}
                  spellCheck={false}
                />
              </label>
            </div>

            <div className="admin-fortune__form-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={saveMutation.isPending}
              >
                {t('common:actions.save')}
              </button>
              {editing ? (
                <button type="button" className="btn btn--secondary" onClick={resetForm}>
                  {t('common:actions.cancel')}
                </button>
              ) : null}
            </div>
          </form>
        </AdminPanel>

        <AdminPanel
          title={t('fortuneAdmin.listTitle')}
          count={rows.length}
          countLabel={t('fortuneAdmin.listCount', {
            total: rows.length,
            active: activeCount,
          })}
        >
          <div className="admin-fortune__toolbar">
            <div
              className="admin-fortune__chips"
              role="group"
              aria-label={t('fortuneAdmin.category')}
            >
              <button
                type="button"
                className={`admin-fortune__chip${category === '' ? ' admin-fortune__chip--active' : ''}`}
                aria-pressed={category === ''}
                onClick={() => setCategory('')}
              >
                {t('fortuneAdmin.allCategories')}
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`admin-fortune__chip${category === c ? ' admin-fortune__chip--active' : ''}`}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {categoryLabel(t, c)}
                </button>
              ))}
            </div>
            <label className="admin-fortune__check admin-fortune__check--toolbar">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              <span>{t('fortuneAdmin.includeInactive')}</span>
            </label>
          </div>

          {listQuery.isLoading ? <Skeleton count={4} height={56} /> : null}
          {listQuery.isError ? (
            <QueryErrorMessage onRetry={() => void listQuery.refetch()} />
          ) : null}

          {!listQuery.isLoading && !listQuery.isError ? (
            rows.length === 0 ? (
              <div className="admin-empty">{t('fortuneAdmin.empty')}</div>
            ) : (
              <div className="admin-fortune__list">
                <div className="admin-fortune__head" aria-hidden>
                  <span>{t('fortuneAdmin.colContent')}</span>
                  <span>{t('fortuneAdmin.colMeta')}</span>
                  <span>{t('fortuneAdmin.colActions')}</span>
                </div>
                {rows.map((row) => (
                  <article
                    key={row.id}
                    className={`admin-fortune__row${row.isActive ? '' : ' admin-fortune__row--inactive'}`}
                  >
                    <div className="admin-fortune__content">
                      <div className="admin-fortune__title-row">
                        <h3 className="admin-fortune__title">{row.title}</h3>
                        <span
                          className={`admin-status-pill${row.isActive ? ' is-active' : ' is-inactive'}`}
                        >
                          {row.isActive
                            ? t('fortuneAdmin.active')
                            : t('fortuneAdmin.inactive')}
                        </span>
                      </div>
                      <p className="admin-fortune__code">{row.code}</p>
                      {row.body ? (
                        <p className="admin-fortune__body-preview">
                          {row.body.length > 120 ? `${row.body.slice(0, 120)}…` : row.body}
                        </p>
                      ) : null}
                    </div>

                    <dl className="admin-fortune__facts">
                      <div className="admin-fortune__fact">
                        <dt>{t('fortuneAdmin.category')}</dt>
                        <dd>{categoryLabel(t, row.category)}</dd>
                      </div>
                      <div className="admin-fortune__fact">
                        <dt>{t('fortuneAdmin.priority')}</dt>
                        <dd>{row.priority}</dd>
                      </div>
                      <div className="admin-fortune__fact">
                        <dt>{t('fortuneAdmin.locale')}</dt>
                        <dd>{row.locale}</dd>
                      </div>
                    </dl>

                    <div className="admin-fortune__actions">
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => startEdit(row)}
                      >
                        {t('fortuneAdmin.edit')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm admin-fortune__delete"
                        onClick={() => setPendingDelete(row.id)}
                      >
                        {t('common:actions.delete')}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )
          ) : null}
        </AdminPanel>
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
