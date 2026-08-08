import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { FortuneContentCategory, FortuneContentItem } from '@machinefit/shared';
import { adminFortuneApi } from '@/api/fortune.api';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/fortune.css';

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
      showToast(t('common:actions.save'), 'success');
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
      showToast(t('common:actions.delete'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const rows = listQuery.data ?? [];
  const title = useMemo(() => t('fortuneAdmin.nav'), [t]);

  return (
    <AdminPageShell title={title}>
      <p className="form-section__desc">{t('fortuneAdmin.desc')}</p>

      <div className="admin-fortune-filters">
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label={t('fortuneAdmin.category')}
        >
          <option value="">{t('fortuneAdmin.allCategories')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="form-check">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          <span>{t('fortuneAdmin.includeInactive')}</span>
        </label>
      </div>

      <form
        className="admin-fortune-form"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <h3>{editing ? t('fortuneAdmin.edit') : t('fortuneAdmin.create')}</h3>
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
              {c}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder={t('fortuneAdmin.code')}
          value={form.code}
          onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
          required
        />
        <input
          className="input"
          placeholder={t('fortuneAdmin.titleField')}
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          required
        />
        <textarea
          className="input"
          placeholder={t('fortuneAdmin.body')}
          value={form.body}
          onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
        />
        <input
          className="input"
          type="number"
          placeholder={t('fortuneAdmin.priority')}
          value={form.priority}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, priority: Number(e.target.value) || 0 }))
          }
        />
        <label className="form-check">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
          />
          <span>{t('fortuneAdmin.active')}</span>
        </label>
        <textarea
          className="input"
          placeholder={t('fortuneAdmin.dataConditions')}
          value={form.dataConditionsText}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, dataConditionsText: e.target.value }))
          }
        />
        <textarea
          className="input"
          placeholder={t('fortuneAdmin.scoreWeights')}
          value={form.scoreWeightsText}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, scoreWeightsText: e.target.value }))
          }
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn btn--primary" disabled={saveMutation.isPending}>
            {t('common:actions.save')}
          </button>
          {editing ? (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => {
                setEditing(null);
                setForm(emptyForm);
              }}
            >
              {t('common:actions.cancel')}
            </button>
          ) : null}
        </div>
      </form>

      {listQuery.isLoading ? <Skeleton count={4} height={40} /> : null}
      {listQuery.isError ? <QueryErrorMessage onRetry={() => void listQuery.refetch()} /> : null}

      {!listQuery.isLoading && !listQuery.isError ? (
        <table className="admin-fortune-table">
          <thead>
            <tr>
              <th>{t('fortuneAdmin.category')}</th>
              <th>{t('fortuneAdmin.code')}</th>
              <th>{t('fortuneAdmin.titleField')}</th>
              <th>{t('fortuneAdmin.priority')}</th>
              <th>{t('fortuneAdmin.active')}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row: FortuneContentItem) => (
              <tr key={row.id}>
                <td>{row.category}</td>
                <td>{row.code}</td>
                <td>
                  <div>{row.title}</div>
                  {row.body ? (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                      {row.body.slice(0, 80)}
                    </div>
                  ) : null}
                </td>
                <td>{row.priority}</td>
                <td>{row.isActive ? 'Y' : 'N'}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => {
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
                    }}
                  >
                    {t('fortuneAdmin.edit')}
                  </button>{' '}
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setPendingDelete(row.id)}
                  >
                    {t('common:actions.delete')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

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
