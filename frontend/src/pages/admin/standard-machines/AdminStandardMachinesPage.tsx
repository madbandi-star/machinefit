import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react';
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

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminStandardMachines(listParams),
    queryFn: async () => {
      const res = await adminApi.listStandardMachines(listParams);
      return res.data.data;
    },
  });

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

  useModalAccessibility({
    open: formOpen,
    onClose: () => setFormOpen(false),
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
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <AdminPageShell
      title={t('admin:standardMachines.title')}
      subtitle={t('admin:standardMachines.subtitle')}
    >
      <AdminPanel>
        <div className="admin-catalog-toolbar">
          <label className="form-field">
            <span>{t('admin:standardMachines.search')}</span>
            <input
              className="input"
              value={q}
              placeholder={t('admin:standardMachines.searchPlaceholder')}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="form-field">
            <span>{t('admin:standardMachines.muscleGroup')}</span>
            <select
              className="input"
              value={muscleGroup}
              onChange={(e) => {
                setMuscleGroup(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{t('admin:standardMachines.allMuscles')}</option>
              {MUSCLE_OPTIONS.map((group) => (
                <option key={group} value={group}>
                  {t(`machines:muscleGroups.${group}`, { defaultValue: group })}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>{t('admin:standardMachines.filterActive')}</span>
            <select
              className="input"
              value={isActive}
              onChange={(e) => {
                setIsActive(e.target.value as ActiveFilter);
                setPage(1);
              }}
            >
              <option value="all">{t('admin:standardMachines.filterAll')}</option>
              <option value="true">{t('admin:active')}</option>
              <option value="false">{t('admin:inactive')}</option>
            </select>
          </label>
          <label className="form-field">
            <span>{t('admin:standardMachines.sort')}</span>
            <select
              className="input"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="sortOrder">{t('admin:standardMachines.sortOrder')}</option>
              <option value="name">{t('admin:standardMachines.sortName')}</option>
              <option value="code">{t('admin:standardMachines.sortCode')}</option>
              <option value="createdAt">{t('admin:standardMachines.sortCreated')}</option>
            </select>
          </label>
          <label className="form-field">
            <span>{t('admin:standardMachines.order')}</span>
            <select
              className="input"
              value={order}
              onChange={(e) => setOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">{t('admin:standardMachines.orderAsc')}</option>
              <option value="desc">{t('admin:standardMachines.orderDesc')}</option>
            </select>
          </label>
          <div className="admin-catalog-toolbar__actions">
            <button type="button" className="btn btn--secondary" onClick={() => void invalidate()}>
              {t('admin:standardMachines.refresh')}
            </button>
            <button type="button" className="btn btn--primary" onClick={openCreate}>
              {t('admin:standardMachines.create')}
            </button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton height={240} />
        ) : items.length === 0 ? (
          <p className="admin-empty">{t('admin:standardMachines.empty')}</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin:standardMachines.image')}</th>
                  <th>{t('admin:standardMachines.code')}</th>
                  <th>{t('admin:standardMachines.name')}</th>
                  <th>{t('admin:standardMachines.muscleGroup')}</th>
                  <th>{t('admin:standardMachines.machinesCount')}</th>
                  <th>{t('admin:standardMachines.status')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.primaryImageUrl ? (
                        <img
                          src={item.primaryImageUrl}
                          alt=""
                          className="admin-catalog-thumb"
                          width={48}
                          height={48}
                        />
                      ) : (
                        <span className="admin-catalog-thumb admin-catalog-thumb--empty">—</span>
                      )}
                    </td>
                    <td>
                      <code>{item.code}</code>
                    </td>
                    <td>{getLocalizedName(item.name, i18n.language, item.code)}</td>
                    <td>
                      {t(`machines:muscleGroups.${item.primaryMuscleGroup}`, {
                        defaultValue: item.primaryMuscleGroup,
                      })}
                    </td>
                    <td>{item.machineCount ?? 0}</td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn--sm ${item.isActive ? 'btn--secondary' : 'btn--ghost'}`}
                        onClick={() =>
                          activeMutation.mutate({ id: item.id, next: !item.isActive })
                        }
                      >
                        {item.isActive ? t('admin:active') : t('admin:inactive')}
                      </button>
                    </td>
                    <td className="admin-table__actions">
                      <button
                        type="button"
                        className="btn btn--sm btn--secondary"
                        onClick={() => openEdit(item)}
                      >
                        {t('admin:standardMachines.edit')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--sm btn--ghost"
                        onClick={() => setPendingDelete(item)}
                      >
                        {t('admin:standardMachines.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </AdminPanel>

      {formOpen ? (
        <div className="admin-catalog-drawer" role="dialog" aria-modal="true">
          <div className="admin-catalog-drawer__panel">
            <header className="admin-catalog-drawer__header">
              <h3 id="admin-standard-machine-title">
                {editing
                  ? t('admin:standardMachines.edit')
                  : t('admin:standardMachines.create')}
              </h3>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setFormOpen(false)}
              >
                {t('admin:standardMachines.close')}
              </button>
            </header>

            <p className="admin-catalog-hint">{t('admin:standardMachines.formHint')}</p>

            <section className="admin-catalog-section">
              <h4 className="admin-catalog-section__title">
                {t('admin:standardMachines.sectionBasic')}
              </h4>
              <div className="admin-catalog-fields">
                <label className="admin-catalog-field admin-catalog-field--full">
                  <span>{t('admin:standardMachines.code')}</span>
                  <input
                    className="input"
                    value={form.code}
                    disabled={Boolean(editing)}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  />
                </label>
                <label className="admin-catalog-field">
                  <span>{t('admin:standardMachines.nameKo')}</span>
                  <input
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
                <p className="admin-catalog-hint">{t('admin:standardMachines.saveBeforeImages')}</p>
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
                  <ul className="admin-catalog-gallery">
                    {images.map((image, index) => (
                      <li key={image.id} className="admin-catalog-gallery__item">
                        <img src={image.imageUrl} alt="" width={72} height={72} />
                        <div className="admin-catalog-gallery__meta">
                          <span>
                            {image.isPrimary
                              ? t('admin:standardMachines.primaryBadge')
                              : IMAGE_TYPES.includes(
                                    image.imageType as (typeof IMAGE_TYPES)[number]
                                  )
                                ? t(`admin:standardMachines.imageTypes.${image.imageType}`)
                                : image.imageType}
                          </span>
                          <div className="admin-catalog-gallery__actions">
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

            <footer className="admin-catalog-drawer__footer">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setFormOpen(false)}
              >
                {t('admin:standardMachines.cancel')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={saveMutation.isPending || !form.code.trim() || !form.nameKo.trim()}
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
