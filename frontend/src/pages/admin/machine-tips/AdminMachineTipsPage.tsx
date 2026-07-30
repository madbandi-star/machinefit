import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getLocalizedName } from '@/utils/localizedName';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import '@/styles/admin.css';

const PAGE_SIZE = 20;

type TipForm = {
  tipsKo: string;
  tipsEn: string;
  warningsKo: string;
  warningsEn: string;
};

function linesToText(lines?: string[] | null): string {
  return (lines ?? []).join('\n');
}

function textToLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function countLines(record?: Record<string, string[]> | null, locale = 'ko'): number {
  const primary = record?.[locale]?.length ?? 0;
  if (primary > 0) return primary;
  return record?.en?.length ?? 0;
}

function fromMachine(machine: Machine): TipForm {
  return {
    tipsKo: linesToText(machine.tips?.ko ?? machine.tips?.en),
    tipsEn: linesToText(machine.tips?.en),
    warningsKo: linesToText(machine.warnings?.ko ?? machine.warnings?.en),
    warningsEn: linesToText(machine.warnings?.en),
  };
}

export function AdminMachineTipsPage() {
  const { t, i18n } = useTranslation(['admin', 'machines']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [page, setPage] = useState(1);
  const [draftQ, setDraftQ] = useState('');
  const [q, setQ] = useState('');
  const [editor, setEditor] = useState<Machine | null>(null);
  const [form, setForm] = useState<TipForm>({
    tipsKo: '',
    tipsEn: '',
    warningsKo: '',
    warningsEn: '',
  });

  const listParams = useMemo(
    () => ({ q: q || undefined, page, limit: PAGE_SIZE, sort: 'name' as const, order: 'asc' as const }),
    [q, page]
  );

  const listQuery = useQuery({
    queryKey: QUERY_KEYS.adminMachineTips(listParams),
    queryFn: async () => {
      const res = await adminApi.listCatalogMachines(listParams);
      return res.data.data;
    },
  });

  const closeEditor = useCallback(() => setEditor(null), []);

  const openEditor = useCallback(async (machine: Machine) => {
    setEditor(machine);
    setForm(fromMachine(machine));
    try {
      const res = await adminApi.getCatalogMachineTips(machine.id);
      setEditor(res.data.data);
      setForm(fromMachine(res.data.data));
    } catch {
      /* keep list snapshot */
    }
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editor) throw new Error('No machine');
      return (
        await adminApi.updateCatalogMachineTips(editor.id, {
          tips: {
            ko: textToLines(form.tipsKo),
            en: textToLines(form.tipsEn).length
              ? textToLines(form.tipsEn)
              : textToLines(form.tipsKo),
          },
          warnings: {
            ko: textToLines(form.warningsKo),
            en: textToLines(form.warningsEn).length
              ? textToLines(form.warningsEn)
              : textToLines(form.warningsKo),
          },
        })
      ).data.data;
    },
    onMutate: () => showToast(t('admin:machineTips.saving'), 'info'),
    onSuccess: async (machine) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'catalog', 'machine-tips'] });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMachines });
      setEditor(machine);
      setForm(fromMachine(machine));
      showToast(t('admin:machineTips.saveSuccess'), 'success');
    },
    onError: () => showToast(t('admin:error'), 'error'),
  });

  const dialogRef = useModalAccessibility({
    open: Boolean(editor),
    onClose: closeEditor,
    closeOnEscape: !saveMutation.isPending,
    initialFocusSelector: '#admin-machine-tips-warnings-ko',
  });

  if (listQuery.isLoading && !listQuery.data) {
    return (
      <AdminPageShell
        title={t('admin:machineTips.title')}
        subtitle={t('admin:machineTips.subtitle')}
        backTo={ROUTES.ADMIN}
        backLabel={t('admin:backToAdmin')}
      >
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.meta.total ?? 0;
  const totalPages = listQuery.data?.meta.totalPages ?? 1;

  return (
    <AdminPageShell
      title={t('admin:machineTips.title')}
      subtitle={t('admin:machineTips.subtitle')}
      backTo={ROUTES.ADMIN}
      backLabel={t('admin:backToAdmin')}
    >
      <div className="admin-machine-tips-page">
        <form
          className="admin-machine-tips-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQ(draftQ.trim());
          }}
        >
          <input
            className="input"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder={t('admin:machineTips.searchPlaceholder')}
            aria-label={t('admin:machineTips.searchPlaceholder')}
          />
          <button type="submit" className="btn btn--primary">
            {t('admin:machineTips.search')}
          </button>
        </form>

        <p className="admin-machine-tips-hint">{t('admin:machineTips.hint')}</p>

        <AdminPanel count={total} countLabel={t('admin:listCount', { count: total })}>
          <div className="admin-machine-tips-list">
            {items.length === 0 ? (
              <div className="admin-empty">{t('admin:machineTips.empty')}</div>
            ) : (
              items.map((machine) => {
                const tipCount = countLines(machine.tips, i18n.language.startsWith('ko') ? 'ko' : 'en');
                const warnCount = countLines(
                  machine.warnings,
                  i18n.language.startsWith('ko') ? 'ko' : 'en'
                );
                return (
                  <article key={machine.id} className="admin-machine-tips-row">
                    <div className="admin-machine-tips-row__body">
                      <strong>
                        {getLocalizedName(machine.name, i18n.language, machine.code)}
                      </strong>
                      <p className="admin-machine-tips-row__meta">
                        <span>{machine.code}</span>
                        {machine.brandCode ? <span>{machine.brandCode}</span> : null}
                        <span>{machine.muscleGroup}</span>
                      </p>
                      <p className="admin-machine-tips-row__counts">
                        <span>
                          {t('admin:machineTips.warningsCount', { count: warnCount })}
                        </span>
                        <span>{t('admin:machineTips.tipsCount', { count: tipCount })}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => void openEditor(machine)}
                    >
                      {t('admin:machineTips.edit')}
                    </button>
                  </article>
                );
              })
            )}
          </div>
          <Pagination
            page={listQuery.data?.meta.page ?? page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </AdminPanel>
      </div>

      {editor ? (
        <div
          className="dialog-overlay admin-machines-dialog-overlay"
          role="presentation"
          onClick={() => {
            if (!saveMutation.isPending) closeEditor();
          }}
        >
          <div
            ref={dialogRef}
            className="dialog card admin-catalog-dialog admin-machines-dialog admin-machine-tips-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-machine-tips-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="admin-catalog-dialog__header">
              <div className="admin-catalog-dialog__top">
                <div>
                  <button
                    type="button"
                    className="admin-catalog-dialog__back"
                    onClick={closeEditor}
                    disabled={saveMutation.isPending}
                  >
                    <span aria-hidden="true">←</span>
                    {t('admin:machineTips.backToList')}
                  </button>
                  <h3 id="admin-machine-tips-title" className="admin-catalog-dialog__title">
                    {getLocalizedName(editor.name, i18n.language, editor.code)}
                  </h3>
                  <p className="admin-catalog-dialog__hint">
                    {editor.code}
                    {editor.brandCode ? ` · ${editor.brandCode}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary admin-catalog-dialog__close"
                  onClick={closeEditor}
                  disabled={saveMutation.isPending}
                  aria-label={t('admin:machineTips.close')}
                >
                  ✕
                </button>
              </div>
              <p className="admin-catalog-dialog__hint">{t('admin:machineTips.formHint')}</p>
            </header>

            <div className="admin-catalog-sections">
              <section className="admin-catalog-section">
                <h4 className="admin-catalog-section__title">
                  {t('admin:machineTips.sectionWarnings')}
                </h4>
                <div className="admin-catalog-fields">
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:machineTips.warningsKo')}</span>
                    <textarea
                      id="admin-machine-tips-warnings-ko"
                      className="input admin-machine-tips-textarea"
                      rows={5}
                      value={form.warningsKo}
                      onChange={(e) => setForm((f) => ({ ...f, warningsKo: e.target.value }))}
                      placeholder={t('admin:machineTips.linesPlaceholder')}
                    />
                  </label>
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:machineTips.warningsEn')}</span>
                    <textarea
                      className="input admin-machine-tips-textarea"
                      rows={4}
                      value={form.warningsEn}
                      onChange={(e) => setForm((f) => ({ ...f, warningsEn: e.target.value }))}
                      placeholder={t('admin:machineTips.linesPlaceholder')}
                    />
                  </label>
                </div>
              </section>

              <section className="admin-catalog-section">
                <h4 className="admin-catalog-section__title">
                  {t('admin:machineTips.sectionTips')}
                </h4>
                <div className="admin-catalog-fields">
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:machineTips.tipsKo')}</span>
                    <textarea
                      className="input admin-machine-tips-textarea"
                      rows={5}
                      value={form.tipsKo}
                      onChange={(e) => setForm((f) => ({ ...f, tipsKo: e.target.value }))}
                      placeholder={t('admin:machineTips.linesPlaceholder')}
                    />
                  </label>
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:machineTips.tipsEn')}</span>
                    <textarea
                      className="input admin-machine-tips-textarea"
                      rows={4}
                      value={form.tipsEn}
                      onChange={(e) => setForm((f) => ({ ...f, tipsEn: e.target.value }))}
                      placeholder={t('admin:machineTips.linesPlaceholder')}
                    />
                  </label>
                </div>
              </section>
            </div>

            <div className="admin-catalog-dialog__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={closeEditor}
                disabled={saveMutation.isPending}
              >
                {t('admin:machineTips.cancel')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending
                  ? t('admin:machineTips.saving')
                  : t('admin:machineTips.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
