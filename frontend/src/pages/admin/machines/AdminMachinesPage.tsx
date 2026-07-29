import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  TARGET_MUSCLE_GROUPS,
  type AdminMachineUpsertInput,
  type Machine,
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
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import '@/styles/admin.css';

const PAGE_SIZE = 20;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MACHINE_TYPES = [
  'selectorized',
  'plate_loaded',
  'cable',
  'free_weight',
  'smith',
  'bodyweight',
] as const;
const MUSCLE_OPTIONS = [...TARGET_MUSCLE_GROUPS, 'full_body'] as const;

type SortKey = 'name' | 'createdAt' | 'sortOrder' | 'code';
type ActiveFilter = 'all' | 'true' | 'false';

type MachineFormState = {
  brandId: string;
  code: string;
  nameKo: string;
  nameEn: string;
  muscleGroup: string;
  machineType: (typeof MACHINE_TYPES)[number];
  descriptionKo: string;
  descriptionEn: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_FORM: MachineFormState = {
  brandId: '',
  code: '',
  nameKo: '',
  nameEn: '',
  muscleGroup: 'chest',
  machineType: 'selectorized',
  descriptionKo: '',
  descriptionEn: '',
  sortOrder: '0',
  isActive: true,
};

function isAllowedImage(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.has(ext)) return false;
  if (!file.type) return true;
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase());
}

function toUpsertInput(form: MachineFormState): AdminMachineUpsertInput {
  return {
    brandId: form.brandId,
    code: form.code.trim().toUpperCase(),
    name: { ko: form.nameKo.trim(), en: form.nameEn.trim() || form.nameKo.trim() },
    muscleGroup: form.muscleGroup,
    machineType: form.machineType,
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

function fromMachine(machine: Machine): MachineFormState {
  return {
    brandId: machine.brandId,
    code: machine.code,
    nameKo: machine.name.ko ?? '',
    nameEn: machine.name.en ?? '',
    muscleGroup: machine.muscleGroup,
    machineType: (MACHINE_TYPES.includes(
      machine.machineType as (typeof MACHINE_TYPES)[number]
    )
      ? machine.machineType
      : 'selectorized') as (typeof MACHINE_TYPES)[number],
    descriptionKo: machine.description?.ko ?? '',
    descriptionEn: machine.description?.en ?? '',
    sortOrder: String(machine.sortOrder ?? 0),
    isActive: machine.isActive,
  };
}

function CatalogImageField({
  label,
  url,
  progress,
  busy,
  onUpload,
  onClear,
  uploadLabel,
  changeLabel,
  clearLabel,
  dropLabel,
  uploadingLabel,
}: {
  label: string;
  url?: string | null;
  progress?: number;
  busy: boolean;
  onUpload: (file: File) => void;
  onClear: () => void;
  uploadLabel: string;
  changeLabel: string;
  clearLabel: string;
  dropLabel: string;
  uploadingLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="admin-catalog-image">
      <div className="admin-catalog-image__label">{label}</div>
      <div
        className={`admin-catalog-image__drop${dragOver ? ' is-dragover' : ''}${busy ? ' is-busy' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && !busy) onUpload(file);
        }}
      >
        {url ? (
          <img src={url} alt="" className="admin-catalog-image__preview" />
        ) : (
          <span className="admin-catalog-image__placeholder">{dropLabel}</span>
        )}
        {typeof progress === 'number' ? (
          <div className="admin-catalog-image__progress">
            {uploadingLabel} {progress}%
          </div>
        ) : null}
      </div>
      <div className="admin-catalog-image__actions">
        <button
          type="button"
          className="btn btn--secondary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {url ? changeLabel : uploadLabel}
        </button>
        {url ? (
          <button type="button" className="btn btn--secondary" disabled={busy} onClick={onClear}>
            {clearLabel}
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          hidden
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

export function AdminMachinesPage() {
  const { t, i18n } = useTranslation(['admin', 'machines']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [page, setPage] = useState(1);
  const [draftQ, setDraftQ] = useState('');
  const [q, setQ] = useState('');
  const [brandId, setBrandId] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [isActive, setIsActive] = useState<ActiveFilter>('all');
  const [sort, setSort] = useState<SortKey>('sortOrder');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [editor, setEditor] = useState<'create' | Machine | null>(null);
  const [form, setForm] = useState<MachineFormState>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<Machine | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();

  const brandsQuery = useQuery({
    queryKey: [...QUERY_KEYS.adminBrands, 'options'],
    queryFn: async () => {
      const res = await adminApi.listCatalogBrands({
        limit: 100,
        sort: 'name',
        order: 'asc',
        isActive: 'all',
      });
      return res.data.data.items;
    },
  });

  const closeEditor = useCallback(() => setEditor(null), []);
  const openCreate = useCallback(() => {
    setForm({
      ...EMPTY_FORM,
      brandId: brandId || brandsQuery.data?.[0]?.id || '',
    });
    setEditor('create');
  }, [brandId, brandsQuery.data]);
  const openEdit = useCallback((machine: Machine) => {
    setForm(fromMachine(machine));
    setEditor(machine);
  }, []);
  const dialogRef = useModalAccessibility({
    open: Boolean(editor),
    onClose: closeEditor,
    initialFocusSelector:
      editor === 'create' ? '#admin-machine-brand' : '#admin-machine-name-ko',
  });

  const listParams = useMemo(
    () => ({
      q: q || undefined,
      brandId: brandId || undefined,
      muscleGroup: muscleGroup || undefined,
      isActive,
      sort,
      order,
      page,
      limit: PAGE_SIZE,
    }),
    [q, brandId, muscleGroup, isActive, sort, order, page]
  );

  const listQuery = useQuery({
    queryKey: [...QUERY_KEYS.adminMachines, listParams],
    queryFn: async () => {
      const res = await adminApi.listCatalogMachines(listParams);
      return res.data.data;
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMachines });
    await queryClient.invalidateQueries({ queryKey: ['admin', 'machine-covers'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input = toUpsertInput(form);
      if (editor && editor !== 'create') {
        return (await adminApi.updateCatalogMachine(editor.id, input)).data.data;
      }
      return (await adminApi.createCatalogMachine(input)).data.data;
    },
    onSuccess: async (machine) => {
      await invalidate();
      showToast(t('admin:saved'), 'success');
      setForm(fromMachine(machine));
      setEditor(machine);
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'CODE_EXISTS' || code === 'MACHINE_CODE_EXISTS') {
        showToast(t('admin:catalogMachines.codeExists'), 'error');
        return;
      }
      if (code === 'INVALID_BRAND') {
        showToast(t('admin:catalogMachines.invalidBrand'), 'error');
        return;
      }
      showToast(t('admin:error'), 'error');
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      adminApi.setCatalogMachineActive(id, next),
    onSuccess: async () => {
      await invalidate();
      showToast(t('admin:saved'), 'success');
    },
    onError: () => showToast(t('admin:error'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCatalogMachine(id),
    onSuccess: async (res) => {
      await invalidate();
      if (res.data.data.deactivated) {
        showToast(t('admin:catalogMachines.deactivatedInstead'), 'success');
      } else {
        showToast(t('admin:catalogMachines.deleteSuccess'), 'success');
      }
      setPendingDelete(null);
      setEditor(null);
    },
    onError: () => {
      showToast(t('admin:error'), 'error');
      setPendingDelete(null);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      setUploadProgress(0);
      return (
        await adminApi.uploadCatalogMachineImage(id, file, (percent) => setUploadProgress(percent))
      ).data.data;
    },
    onSuccess: async (machine) => {
      await invalidate();
      setEditor(machine);
      showToast(t('admin:catalogMachines.uploadSuccess'), 'success');
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'FILE_TOO_LARGE') showToast(t('admin:catalogMachines.uploadTooLarge'), 'error');
      else if (code === 'UNSUPPORTED_FILE_TYPE' || code === 'INVALID_IMAGE')
        showToast(t('admin:catalogMachines.uploadUnsupported'), 'error');
      else showToast(t('admin:error'), 'error');
    },
    onSettled: () => setUploadProgress(undefined),
  });

  const clearMutation = useMutation({
    mutationFn: (id: string) => adminApi.clearCatalogMachineImage(id),
    onSuccess: async (res) => {
      await invalidate();
      setEditor(res.data.data);
      showToast(t('admin:catalogMachines.clearSuccess'), 'success');
    },
    onError: () => showToast(t('admin:error'), 'error'),
  });

  const handleImagePick = (file: File | undefined, machineId?: string) => {
    if (!file || !machineId) return;
    if (!isAllowedImage(file)) {
      showToast(t('admin:catalogMachines.uploadUnsupported'), 'error');
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast(t('admin:catalogMachines.uploadTooLarge'), 'error');
      return;
    }
    uploadMutation.mutate({ id: machineId, file });
  };

  if ((listQuery.isLoading || brandsQuery.isLoading) && !listQuery.data) {
    return (
      <AdminPageShell
        title={t('admin:catalogMachines.title')}
        subtitle={t('admin:catalogMachines.subtitle')}
      >
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.meta.total ?? 0;
  const totalPages = listQuery.data?.meta.totalPages ?? 1;
  const editingMachine = editor && editor !== 'create' ? editor : null;
  const brands = brandsQuery.data ?? [];

  return (
    <AdminPageShell
      title={t('admin:catalogMachines.title')}
      subtitle={t('admin:catalogMachines.subtitle')}
    >
      <form
        className="admin-toolbar admin-catalog-toolbar"
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
          placeholder={t('admin:catalogMachines.searchPlaceholder')}
        />
        <select
          className="input"
          value={brandId}
          onChange={(e) => {
            setBrandId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('admin:catalogMachines.allBrands')}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {getLocalizedName(brand.name, i18n.language, brand.code)}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={muscleGroup}
          onChange={(e) => {
            setMuscleGroup(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('admin:catalogMachines.allMuscles')}</option>
          {MUSCLE_OPTIONS.map((group) => (
            <option key={group} value={group}>
              {t(`machines:muscleGroups.${group}`, { defaultValue: group })}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={isActive}
          onChange={(e) => {
            setIsActive(e.target.value as ActiveFilter);
            setPage(1);
          }}
        >
          <option value="all">{t('admin:catalogMachines.filterAll')}</option>
          <option value="true">{t('admin:active')}</option>
          <option value="false">{t('admin:inactive')}</option>
        </select>
        <select
          className="input"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortKey);
            setPage(1);
          }}
        >
          <option value="sortOrder">{t('admin:catalogMachines.sortOrder')}</option>
          <option value="name">{t('admin:catalogMachines.sortName')}</option>
          <option value="code">{t('admin:catalogMachines.sortCode')}</option>
          <option value="createdAt">{t('admin:catalogMachines.sortCreated')}</option>
        </select>
        <select
          className="input"
          value={order}
          onChange={(e) => {
            setOrder(e.target.value as 'asc' | 'desc');
            setPage(1);
          }}
        >
          <option value="asc">{t('admin:catalogMachines.orderAsc')}</option>
          <option value="desc">{t('admin:catalogMachines.orderDesc')}</option>
        </select>
        <button type="submit" className="btn btn--primary">
          {t('admin:catalogMachines.search')}
        </button>
        <button type="button" className="btn btn--secondary" onClick={openCreate}>
          {t('admin:catalogMachines.create')}
        </button>
      </form>

      <AdminPanel count={total} countLabel={t('admin:listCount', { count: total })}>
        <div className="admin-table admin-table--dense">
          {items.length === 0 ? (
            <div className="admin-empty">{t('admin:catalogMachines.empty')}</div>
          ) : (
            items.map((machine) => (
              <div key={machine.id} className="card admin-table__row">
                <div className="admin-table__brand">
                  {machine.primaryImageUrl ? (
                    <img
                      src={machine.primaryImageUrl}
                      alt=""
                      className="admin-table__brand-logo"
                    />
                  ) : null}
                  <div className="admin-table__primary">
                    <div className="admin-table__title-row">
                      <strong>
                        {getLocalizedName(machine.name, i18n.language, machine.code)}
                      </strong>
                      <span
                        className={`admin-status-pill${machine.isActive ? ' is-active' : ' is-inactive'}`}
                      >
                        {machine.isActive ? t('admin:active') : t('admin:inactive')}
                      </span>
                    </div>
                    <p className="admin-table__meta">
                      {machine.code}
                      {machine.brandCode ? ` · ${machine.brandCode}` : ''}
                      {` · ${machine.muscleGroup}`}
                      {` · #${machine.sortOrder ?? 0}`}
                    </p>
                  </div>
                </div>
                <div className="admin-table__actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => openEdit(machine)}
                  >
                    {t('admin:catalogMachines.edit')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() =>
                      activeMutation.mutate({ id: machine.id, next: !machine.isActive })
                    }
                  >
                    {machine.isActive ? t('admin:disable') : t('admin:enable')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setPendingDelete(machine)}
                  >
                    {t('admin:catalogMachines.delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <Pagination
          page={listQuery.data?.meta.page ?? page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </AdminPanel>

      {editor ? (
        <div className="dialog-overlay" role="presentation" onClick={closeEditor}>
          <div
            ref={dialogRef}
            className="dialog card admin-catalog-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-machine-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="admin-catalog-dialog__header">
              <h3 id="admin-machine-dialog-title" className="admin-catalog-dialog__title">
                {editor === 'create'
                  ? t('admin:catalogMachines.create')
                  : t('admin:catalogMachines.edit')}
              </h3>
              <p className="admin-catalog-dialog__hint">{t('admin:catalogMachines.formHint')}</p>
            </header>

            <div className="admin-catalog-sections">
              <section className="admin-catalog-section">
                <h4 className="admin-catalog-section__title">
                  {t('admin:catalogMachines.sectionBasic')}
                </h4>
                <div className="admin-catalog-fields">
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:catalogMachines.brand')}</span>
                    <select
                      id="admin-machine-brand"
                      className="input"
                      value={form.brandId}
                      onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                    >
                      <option value="">{t('admin:catalogMachines.selectBrand')}</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {getLocalizedName(brand.name, i18n.language, brand.code)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:catalogMachines.code')}</span>
                    <input
                      id="admin-machine-code"
                      className="input"
                      value={form.code}
                      autoComplete="off"
                      spellCheck={false}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      disabled={Boolean(editingMachine)}
                    />
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('admin:catalogMachines.nameKo')}</span>
                    <input
                      id="admin-machine-name-ko"
                      className="input"
                      value={form.nameKo}
                      onChange={(e) => setForm((f) => ({ ...f, nameKo: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('admin:catalogMachines.nameEn')}</span>
                    <input
                      className="input"
                      value={form.nameEn}
                      onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    />
                  </label>
                </div>
              </section>

              <section className="admin-catalog-section">
                <h4 className="admin-catalog-section__title">
                  {t('admin:catalogMachines.sectionClassification')}
                </h4>
                <div className="admin-catalog-fields">
                  <label className="admin-catalog-field">
                    <span>{t('admin:catalogMachines.muscleGroup')}</span>
                    <select
                      className="input"
                      value={form.muscleGroup}
                      onChange={(e) => setForm((f) => ({ ...f, muscleGroup: e.target.value }))}
                    >
                      {MUSCLE_OPTIONS.map((group) => (
                        <option key={group} value={group}>
                          {t(`machines:muscleGroups.${group}`, { defaultValue: group })}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('admin:catalogMachines.machineType')}</span>
                    <select
                      className="input"
                      value={form.machineType}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          machineType: e.target.value as (typeof MACHINE_TYPES)[number],
                        }))
                      }
                    >
                      {MACHINE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t(`admin:catalogMachines.types.${type}`, { defaultValue: type })}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('admin:catalogMachines.displayOrder')}</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-check">
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
                  {t('admin:catalogMachines.sectionDescription')}
                </h4>
                <div className="admin-catalog-fields">
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:catalogMachines.descriptionKo')}</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={form.descriptionKo}
                      onChange={(e) => setForm((f) => ({ ...f, descriptionKo: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:catalogMachines.descriptionEn')}</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={form.descriptionEn}
                      onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                    />
                  </label>
                </div>
              </section>

              <section className="admin-catalog-section">
                <h4 className="admin-catalog-section__title">
                  {t('admin:catalogMachines.sectionImages')}
                </h4>
                {editingMachine ? (
                  <div className="admin-catalog-images admin-catalog-images--single">
                    <CatalogImageField
                      label={t('admin:catalogMachines.primaryImage')}
                      url={editingMachine.primaryImageUrl}
                      progress={uploadProgress}
                      busy={uploadMutation.isPending || clearMutation.isPending}
                      onUpload={(file) => handleImagePick(file, editingMachine.id)}
                      onClear={() => clearMutation.mutate(editingMachine.id)}
                      uploadLabel={t('admin:catalogMachines.upload')}
                      changeLabel={t('admin:catalogMachines.change')}
                      clearLabel={t('admin:catalogMachines.clearImage')}
                      dropLabel={t('admin:catalogMachines.dropHere')}
                      uploadingLabel={t('admin:catalogMachines.uploading')}
                    />
                  </div>
                ) : (
                  <p className="admin-catalog-section__note">
                    {t('admin:catalogMachines.saveBeforeImages')}
                  </p>
                )}
              </section>
            </div>

            <div className="admin-catalog-dialog__actions">
              <button type="button" className="btn btn--secondary" onClick={closeEditor}>
                {t('admin:catalogMachines.cancel')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={
                  saveMutation.isPending ||
                  !form.brandId ||
                  !form.code.trim() ||
                  !form.nameKo.trim()
                }
                onClick={() => saveMutation.mutate()}
              >
                {t('admin:catalogMachines.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('admin:catalogMachines.deleteTitle')}
        message={t('admin:catalogMachines.deleteMessage', {
          name: pendingDelete
            ? getLocalizedName(pendingDelete.name, i18n.language, pendingDelete.code)
            : '',
        })}
        confirmLabel={t('admin:catalogMachines.delete')}
        confirmVariant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
        }}
      />
    </AdminPageShell>
  );
}
