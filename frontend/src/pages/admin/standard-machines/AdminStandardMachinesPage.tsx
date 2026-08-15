import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  TARGET_MUSCLE_GROUPS,
  type AdminStandardMachineUpsertInput,
  type StandardMachineImage,
  type StandardMachineType,
} from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { getLocalizedName } from '@/utils/localizedName';
import { getApiErrorCode } from '@/utils/motivationAudio';
import { getApiValidationFieldSummary } from '@/utils/getApiErrorMessage';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import '@/styles/admin.css';
import '@/styles/admin-standard-machines.css';

const PAGE_SIZE = 40;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MUSCLE_OPTIONS = [...TARGET_MUSCLE_GROUPS, 'full_body'] as const;
const IMAGE_TYPES = ['front', 'side', 'rear', 'detail', 'setting', 'other'] as const;

type SortKey = 'name' | 'createdAt' | 'sortOrder' | 'code';
type ActiveFilter = 'all' | 'true' | 'false';

type FormState = {
  code: string;
  nameKo: string;
  nameEn: string;
  primaryMuscleGroup: string;
  aliases: string;
  sortOrder: string;
  isActive: boolean;
  descriptionKo: string;
  descriptionEn: string;
};

const EMPTY_FORM: FormState = {
  code: '',
  nameKo: '',
  nameEn: '',
  primaryMuscleGroup: 'chest',
  aliases: '',
  sortOrder: '0',
  isActive: true,
  descriptionKo: '',
  descriptionEn: '',
};

function isAllowedImage(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.has(ext)) return false;
  if (!file.type) return true;
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase());
}

function toUpsertInput(form: FormState): AdminStandardMachineUpsertInput {
  const aliases = form.aliases
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    code: form.code.trim().toUpperCase(),
    name: { ko: form.nameKo.trim(), en: form.nameEn.trim() || form.nameKo.trim() },
    primaryMuscleGroup: form.primaryMuscleGroup,
    muscleGroups: [form.primaryMuscleGroup],
    aliases,
    description:
      form.descriptionKo.trim() || form.descriptionEn.trim()
        ? {
            ko: form.descriptionKo.trim() || undefined,
            en: form.descriptionEn.trim() || undefined,
          }
        : undefined,
    sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
    isActive: form.isActive,
  };
}

function fromType(item: StandardMachineType): FormState {
  return {
    code: item.code,
    nameKo: item.name.ko ?? '',
    nameEn: item.name.en ?? '',
    primaryMuscleGroup: item.primaryMuscleGroup,
    aliases: (item.aliases ?? []).join(', '),
    sortOrder: String(item.sortOrder ?? 0),
    isActive: item.isActive,
    descriptionKo: item.description?.ko ?? '',
    descriptionEn: item.description?.en ?? '',
  };
}

export function AdminStandardMachinesPage() {
  const { t, i18n } = useTranslation(['admin', 'machines', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [draftQ, setDraftQ] = useState('');
  const [q, setQ] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [isActive, setIsActive] = useState<ActiveFilter>('all');
  const [sort, setSort] = useState<SortKey>('sortOrder');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StandardMachineType | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<StandardMachineType | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const listParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      muscleGroup: muscleGroup || undefined,
      isActive,
      sort,
      order,
      page,
      limit: PAGE_SIZE,
    }),
    [q, muscleGroup, isActive, sort, order, page]
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: QUERY_KEYS.adminStandardMachines(listParams),
    queryFn: async () => {
      const res = await adminApi.listStandardMachines(listParams);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!isError) return;
    const code = getApiErrorCode(error);
    showToast(
      code === 'DB_UNAVAILABLE'
        ? t('admin:standardMachines.dbUnavailable')
        : t('admin:standardMachines.loadError'),
      'error'
    );
  }, [isError, error, showToast, t]);

  const { data: images = [], refetch: refetchImages } = useQuery({
    queryKey: QUERY_KEYS.adminStandardMachineImages(editing?.id ?? ''),
    enabled: Boolean(editing?.id),
    queryFn: async () => {
      const res = await adminApi.listStandardMachineImages(editing!.id);
      return res.data.data.items;
    },
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'standard-machines'] });
  }, [queryClient]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input = toUpsertInput(form);
      if (editing) return adminApi.updateStandardMachine(editing.id, input);
      return adminApi.createStandardMachine(input);
    },
    onSuccess: async (res) => {
      showToast(t('admin:standardMachines.saveSuccess'), 'success');
      const saved = res.data.data;
      setEditing(saved);
      setForm(fromType(saved));
      await invalidate();
    },
    onError: (err) => {
      const code = getApiErrorCode(err);
      if (code === 'CODE_EXISTS') {
        showToast(t('admin:standardMachines.codeExists'), 'error');
        return;
      }
      const summary = getApiValidationFieldSummary(err);
      showToast(summary || t('admin:standardMachines.validationError'), 'error');
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      adminApi.setStandardMachineActive(id, next),
    onSuccess: async () => {
      showToast(t('admin:standardMachines.saveSuccess'), 'success');
      await invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteStandardMachine(id),
    onSuccess: async (res) => {
      if (res.data.data.deactivated) {
        showToast(t('admin:standardMachines.deactivatedInstead'), 'info');
      } else {
        showToast(t('admin:standardMachines.deleteSuccess'), 'success');
      }
      setPendingDelete(null);
      setFormOpen(false);
      setEditing(null);
      await invalidate();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!editing) throw new Error('no editing');
      setUploadProgress(0);
      return adminApi.uploadStandardMachineImage(
        editing.id,
        file,
        { isPrimary: images.length === 0 },
        setUploadProgress
      );
    },
    onSuccess: async () => {
      showToast(t('admin:standardMachines.uploadSuccess'), 'success');
      setUploadProgress(0);
      await refetchImages();
      await invalidate();
    },
    onError: (err) => {
      setUploadProgress(0);
      if (axios.isAxiosError(err)) {
        showToast(t('admin:standardMachines.validationError'), 'error');
      }
    },
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (image: StandardMachineImage) =>
      adminApi.updateStandardMachineImage(editing!.id, image.id, { isPrimary: true }),
    onSuccess: async () => {
      await refetchImages();
      await invalidate();
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) =>
      adminApi.deleteStandardMachineImage(editing!.id, imageId),
    onSuccess: async () => {
      showToast(t('admin:standardMachines.clearSuccess'), 'success');
      await refetchImages();
      await invalidate();
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      adminApi.reorderStandardMachineImages(editing!.id, orderedIds),
    onSuccess: async () => {
      await refetchImages();
      await invalidate();
    },
  });

  const formBusy =
    saveMutation.isPending ||
    uploadMutation.isPending ||
    setPrimaryMutation.isPending ||
    deleteImageMutation.isPending ||
    reorderMutation.isPending;

  const closeForm = useCallback(() => {
    if (formBusy) return;
    setFormOpen(false);
  }, [formBusy]);

  const dialogRef = useModalAccessibility({
    open: formOpen,
    onClose: closeForm,
    closeOnEscape: !formBusy,
    initialFocusSelector: editing ? '#admin-standard-machine-name-ko' : '#admin-standard-machine-code',
  });

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(item: StandardMachineType) {
    setEditing(item);
    setForm(fromType(item));
    setFormOpen(true);
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || !editing) return;
    if (!isAllowedImage(file)) {
      showToast(t('admin:standardMachines.uploadUnsupported'), 'error');
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast(t('admin:standardMachines.uploadTooLarge'), 'error');
      return;
    }
    uploadMutation.mutate(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }

  function moveImage(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= images.length) return;
    const ids = images.map((img) => img.id);
    const tmp = ids[index]!;
    ids[index] = ids[next]!;
    ids[next] = tmp;
    reorderMutation.mutate(ids);
  }

  const items = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

  const pageStats = useMemo(() => {
    let withImage = 0;
    let active = 0;
    let linked = 0;
    for (const item of items) {
      if (item.primaryImageUrl) withImage += 1;
      if (item.isActive) active += 1;
      linked += item.machineCount ?? 0;
    }
    return {
      withImage,
      active,
      inactive: items.length - active,
      linked,
      noImage: items.length - withImage,
    };
  }, [items]);

  return (
    <AdminPageShell
      title={t('admin:standardMachines.title')}
      subtitle={
        data?.meta?.total != null
          ? t('admin:standardMachines.subtitleWithCount', { count: data.meta.total })
          : t('admin:standardMachines.subtitle')
      }
    >
      <div className="asm-page">
        <div className="asm-stats" aria-label={t('admin:standardMachines.statsLabel')}>
          <div className="asm-stat">
            <span className="asm-stat__value">{total}</span>
            <span className="asm-stat__label">{t('admin:standardMachines.statTotal')}</span>
          </div>
          <div className="asm-stat">
            <span className="asm-stat__value">{pageStats.withImage}</span>
            <span className="asm-stat__label">{t('admin:standardMachines.statWithImage')}</span>
          </div>
          <div className="asm-stat">
            <span className="asm-stat__value">{pageStats.noImage}</span>
            <span className="asm-stat__label">{t('admin:standardMachines.statNoImage')}</span>
          </div>
          <div className="asm-stat">
            <span className="asm-stat__value">{pageStats.linked}</span>
            <span className="asm-stat__label">{t('admin:standardMachines.statLinked')}</span>
          </div>
        </div>

        <form
          className="asm-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            setQ(draftQ.trim());
          }}
        >
          <div className="asm-toolbar__row">
            <input
              className="input asm-toolbar__search"
              value={draftQ}
              placeholder={t('admin:standardMachines.searchPlaceholder')}
              aria-label={t('admin:standardMachines.search')}
              onChange={(e) => setDraftQ(e.target.value)}
            />
            <div className="asm-toolbar__actions">
              <button type="submit" className="btn btn--secondary">
                {t('admin:standardMachines.search')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                {t('admin:standardMachines.refresh')}
              </button>
              <button type="button" className="btn btn--primary" onClick={openCreate}>
                {t('admin:standardMachines.create')}
              </button>
            </div>
          </div>

          <div
            className="asm-segments"
            role="group"
            aria-label={t('admin:standardMachines.filterActive')}
          >
            {(
              [
                ['all', t('admin:standardMachines.filterAll')],
                ['true', t('admin:active')],
                ['false', t('admin:inactive')],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`asm-segment${isActive === value ? ' is-active' : ''}`}
                aria-pressed={isActive === value}
                onClick={() => {
                  setIsActive(value);
                  setPage(1);
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className="asm-chips"
            role="group"
            aria-label={t('admin:standardMachines.muscleGroup')}
          >
            <button
              type="button"
              className={`asm-chip${muscleGroup === '' ? ' is-active' : ''}`}
              aria-pressed={muscleGroup === ''}
              onClick={() => {
                setMuscleGroup('');
                setPage(1);
              }}
            >
              {t('admin:standardMachines.allMuscles')}
            </button>
            {MUSCLE_OPTIONS.map((group) => (
              <button
                key={group}
                type="button"
                className={`asm-chip${muscleGroup === group ? ' is-active' : ''}`}
                aria-pressed={muscleGroup === group}
                onClick={() => {
                  setMuscleGroup(group);
                  setPage(1);
                }}
              >
                {t(`machines:muscleGroups.${group}`, { defaultValue: group })}
              </button>
            ))}
          </div>

          <div className="asm-toolbar__row">
            <div className="asm-toolbar__sort">
              <select
                className="input"
                value={sort}
                aria-label={t('admin:standardMachines.sort')}
                onChange={(e) => {
                  setSort(e.target.value as SortKey);
                  setPage(1);
                }}
              >
                <option value="sortOrder">{t('admin:standardMachines.sortOrder')}</option>
                <option value="name">{t('admin:standardMachines.sortName')}</option>
                <option value="code">{t('admin:standardMachines.sortCode')}</option>
                <option value="createdAt">{t('admin:standardMachines.sortCreated')}</option>
              </select>
              <select
                className="input"
                value={order}
                aria-label={t('admin:standardMachines.order')}
                onChange={(e) => {
                  setOrder(e.target.value as 'asc' | 'desc');
                  setPage(1);
                }}
              >
                <option value="asc">{t('admin:standardMachines.orderAsc')}</option>
                <option value="desc">{t('admin:standardMachines.orderDesc')}</option>
              </select>
            </div>
          </div>
        </form>

        <AdminPanel count={total} countLabel={t('admin:listCount', { count: total })}>
          {isLoading ? (
            <Skeleton height={280} />
          ) : isError ? (
            <div className="asm-empty">
              <p>{t('admin:standardMachines.loadError')}</p>
              <button type="button" className="btn btn--secondary" onClick={() => void refetch()}>
                {t('admin:standardMachines.refresh')}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="asm-empty">
              <p>{t('admin:standardMachines.empty')}</p>
              <button type="button" className="btn btn--primary" onClick={openCreate}>
                {t('admin:standardMachines.create')}
              </button>
            </div>
          ) : (
            <div className="asm-grid">
              {items.map((item) => {
                const name = getLocalizedName(item.name, i18n.language, item.code);
                const muscleLabel = t(`machines:muscleGroups.${item.primaryMuscleGroup}`, {
                  defaultValue: item.primaryMuscleGroup,
                });
                const toggling =
                  activeMutation.isPending && activeMutation.variables?.id === item.id;
                return (
                  <article
                    key={item.id}
                    className={`asm-card${item.isActive ? '' : ' is-inactive'}`}
                  >
                    <button
                      type="button"
                      className="asm-card__media"
                      onClick={() => openEdit(item)}
                      aria-label={t('admin:standardMachines.editNamed', { name })}
                    >
                      {item.primaryImageUrl ? (
                        <img src={item.primaryImageUrl} alt="" loading="lazy" />
                      ) : (
                        <span className="asm-card__placeholder">
                          {t('admin:standardMachines.noImage')}
                        </span>
                      )}
                      <span className="asm-card__badges">
                        <span className="asm-muscle-pill">{muscleLabel}</span>
                        <span
                          className={`admin-status-pill${item.isActive ? ' is-active' : ' is-inactive'}`}
                        >
                          {item.isActive ? t('admin:active') : t('admin:inactive')}
                        </span>
                      </span>
                    </button>
                    <div className="asm-card__body">
                      <div className="asm-card__title-row">
                        <h3 className="asm-card__title">{name}</h3>
                      </div>
                      <p className="asm-card__meta">
                        <code>{item.code}</code>
                        {' · '}
                        {t('admin:standardMachines.machinesCountLabel', {
                          count: item.machineCount ?? 0,
                        })}
                        {' · '}
                        #{item.sortOrder ?? 0}
                      </p>
                    </div>
                    <div className="asm-card__actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        onClick={() => openEdit(item)}
                        disabled={toggling || deleteMutation.isPending}
                      >
                        {t('admin:standardMachines.edit')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        disabled={toggling || deleteMutation.isPending}
                        onClick={() =>
                          activeMutation.mutate({ id: item.id, next: !item.isActive })
                        }
                      >
                        {toggling
                          ? t('admin:processing')
                          : item.isActive
                            ? t('admin:disable')
                            : t('admin:enable')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        disabled={toggling || deleteMutation.isPending}
                        onClick={() => setPendingDelete(item)}
                      >
                        {t('admin:standardMachines.delete')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 ? (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          ) : null}
        </AdminPanel>
      </div>

      {formOpen ? (
        <div
          className="dialog-overlay"
          role="presentation"
          onClick={() => {
            if (!formBusy) closeForm();
          }}
        >
          <div
            ref={dialogRef}
            className="dialog card admin-catalog-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-standard-machine-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="admin-catalog-dialog__header">
              <div className="admin-catalog-dialog__top">
                <div>
                  <button
                    type="button"
                    className="admin-catalog-dialog__back"
                    onClick={closeForm}
                    disabled={formBusy}
                  >
                    <span aria-hidden="true">←</span>
                    {t('admin:standardMachines.backToList')}
                  </button>
                  <h3 id="admin-standard-machine-title" className="admin-catalog-dialog__title">
                    {editing
                      ? t('admin:standardMachines.edit')
                      : t('admin:standardMachines.create')}
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary admin-catalog-dialog__close"
                  onClick={closeForm}
                  disabled={formBusy}
                  aria-label={t('admin:standardMachines.close')}
                >
                  ✕
                </button>
              </div>
              <p className="admin-catalog-dialog__hint">{t('admin:standardMachines.formHint')}</p>
            </header>

            <div className="admin-catalog-sections">
              <section className="admin-catalog-section">
                <h4 className="admin-catalog-section__title">
                  {t('admin:standardMachines.sectionBasic')}
                </h4>
                <div className="admin-catalog-fields">
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:standardMachines.code')}</span>
                    <input
                      id="admin-standard-machine-code"
                      className="input"
                      value={form.code}
                      disabled={Boolean(editing)}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('admin:standardMachines.nameKo')}</span>
                    <input
                      id="admin-standard-machine-name-ko"
                      className="input"
                      value={form.nameKo}
                      onChange={(e) => setForm((f) => ({ ...f, nameKo: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('admin:standardMachines.nameEn')}</span>
                    <input
                      className="input"
                      value={form.nameEn}
                      onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('admin:standardMachines.muscleGroup')}</span>
                    <select
                      className="input"
                      value={form.primaryMuscleGroup}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, primaryMuscleGroup: e.target.value }))
                      }
                    >
                      {MUSCLE_OPTIONS.map((group) => (
                        <option key={group} value={group}>
                          {t(`machines:muscleGroups.${group}`, { defaultValue: group })}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('admin:standardMachines.displayOrder')}</span>
                    <input
                      className="input"
                      value={form.sortOrder}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:standardMachines.aliases')}</span>
                    <textarea
                      className="input"
                      rows={2}
                      value={form.aliases}
                      placeholder={t('admin:standardMachines.aliasesPlaceholder')}
                      onChange={(e) => setForm((f) => ({ ...f, aliases: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:standardMachines.descriptionKo')}</span>
                    <textarea
                      className="input"
                      rows={2}
                      value={form.descriptionKo}
                      onChange={(e) => setForm((f) => ({ ...f, descriptionKo: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:standardMachines.descriptionEn')}</span>
                    <textarea
                      className="input"
                      rows={2}
                      value={form.descriptionEn}
                      onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field admin-catalog-check">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    <span>{t('admin:active')}</span>
                  </label>
                </div>
              </section>

              <section className="admin-catalog-section">
                <h4 className="admin-catalog-section__title">
                  {t('admin:standardMachines.sectionImages')}
                </h4>
                {!editing ? (
                  <p className="admin-catalog-section__note">
                    {t('admin:standardMachines.saveBeforeImages')}
                  </p>
                ) : (
                  <>
                    <div
                      className={`admin-catalog-dropzone${dragOver ? ' is-dragover' : ''}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={onDrop}
                    >
                      <p>{t('admin:standardMachines.dropHere')}</p>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploadMutation.isPending}
                      >
                        {uploadMutation.isPending
                          ? `${t('admin:standardMachines.uploading')} ${uploadProgress}%`
                          : t('admin:standardMachines.upload')}
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept={ACCEPT}
                        hidden
                        onChange={(e) => handleFiles(e.target.files)}
                      />
                    </div>
                    <ul className="asm-gallery">
                      {images.map((image, index) => (
                        <li key={image.id} className="asm-gallery__item">
                          <img src={image.imageUrl} alt="" width={72} height={72} />
                          <div className="asm-gallery__meta">
                            <span className="asm-gallery__label">
                              {image.isPrimary
                                ? t('admin:standardMachines.primaryBadge')
                                : IMAGE_TYPES.includes(
                                      image.imageType as (typeof IMAGE_TYPES)[number]
                                    )
                                  ? t(`admin:standardMachines.imageTypes.${image.imageType}`)
                                  : image.imageType}
                            </span>
                            <div className="asm-gallery__actions">
                              {!image.isPrimary ? (
                                <button
                                  type="button"
                                  className="btn btn--sm btn--secondary"
                                  onClick={() => setPrimaryMutation.mutate(image)}
                                >
                                  {t('admin:standardMachines.setPrimary')}
                                </button>
                              ) : null}
                              <button
                                type="button"
                                className="btn btn--sm btn--ghost"
                                disabled={index === 0}
                                onClick={() => moveImage(index, -1)}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="btn btn--sm btn--ghost"
                                disabled={index === images.length - 1}
                                onClick={() => moveImage(index, 1)}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                className="btn btn--sm btn--ghost"
                                onClick={() => deleteImageMutation.mutate(image.id)}
                              >
                                {t('admin:standardMachines.clearImage')}
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            </div>

            <footer className="admin-catalog-dialog__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={closeForm}
                disabled={formBusy}
              >
                {t('admin:standardMachines.cancel')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={formBusy || !form.code.trim() || !form.nameKo.trim()}
                onClick={() => saveMutation.mutate()}
              >
                {saveMutation.isPending
                  ? t('admin:standardMachines.saving')
                  : t('admin:standardMachines.save')}
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('admin:standardMachines.deleteTitle')}
        message={t('admin:standardMachines.deleteMessage', {
          name: pendingDelete
            ? getLocalizedName(pendingDelete.name, i18n.language, pendingDelete.code)
            : '',
          count: pendingDelete?.machineCount ?? 0,
        })}
        confirmLabel={t('admin:standardMachines.delete')}
        cancelLabel={t('admin:standardMachines.cancel')}
        confirmVariant="danger"
        onConfirm={() => pendingDelete && deleteMutation.mutate(pendingDelete.id)}
        onClose={() => setPendingDelete(null)}
      />
    </AdminPageShell>
  );
}
