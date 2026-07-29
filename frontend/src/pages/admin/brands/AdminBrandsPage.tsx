import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { AdminBrandUpsertInput, Brand } from '@machinefit/shared';
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

type SortKey = 'name' | 'createdAt' | 'sortOrder';
type ActiveFilter = 'all' | 'true' | 'false';

type BrandFormState = {
  code: string;
  nameKo: string;
  nameEn: string;
  descriptionKo: string;
  descriptionEn: string;
  websiteUrl: string;
  countryCode: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_FORM: BrandFormState = {
  code: '',
  nameKo: '',
  nameEn: '',
  descriptionKo: '',
  descriptionEn: '',
  websiteUrl: '',
  countryCode: '',
  sortOrder: '0',
  isActive: true,
};

function isAllowedImage(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.has(ext)) return false;
  if (!file.type) return true;
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase());
}

function toUpsertInput(form: BrandFormState): AdminBrandUpsertInput {
  return {
    code: form.code.trim().toUpperCase(),
    name: { ko: form.nameKo.trim(), en: form.nameEn.trim() || form.nameKo.trim() },
    description:
      form.descriptionKo.trim() || form.descriptionEn.trim()
        ? {
            ko: form.descriptionKo.trim() || undefined,
            en: form.descriptionEn.trim() || undefined,
          }
        : undefined,
    websiteUrl: form.websiteUrl.trim(),
    countryCode: form.countryCode.trim().toUpperCase(),
    sortOrder: Number.parseInt(form.sortOrder, 10) || 0,
    isActive: form.isActive,
  };
}

function fromBrand(brand: Brand): BrandFormState {
  return {
    code: brand.code,
    nameKo: brand.name.ko ?? '',
    nameEn: brand.name.en ?? '',
    descriptionKo: brand.description?.ko ?? '',
    descriptionEn: brand.description?.en ?? '',
    websiteUrl: brand.websiteUrl ?? '',
    countryCode: brand.countryCode ?? '',
    sortOrder: String(brand.sortOrder ?? 0),
    isActive: brand.isActive,
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

  const handleFiles = (file?: File) => {
    if (!file || busy) return;
    onUpload(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files?.[0]);
  };

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
        onDrop={onDrop}
      >
        {url ? (
          <img src={url} alt="" className="admin-catalog-image__preview" />
        ) : (
          <span className="admin-catalog-image__placeholder">{dropLabel}</span>
        )}
        {typeof progress === 'number' ? (
          <div className="admin-catalog-image__progress">{uploadingLabel} {progress}%</div>
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
          onChange={(e) => {
            handleFiles(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

export function AdminBrandsPage() {
  const { t, i18n } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [page, setPage] = useState(1);
  const [draftQ, setDraftQ] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('sortOrder');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [isActive, setIsActive] = useState<ActiveFilter>('all');
  const [editor, setEditor] = useState<'create' | Brand | null>(null);
  const [form, setForm] = useState<BrandFormState>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<Brand | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Partial<Record<'logo' | 'hero', number>>>(
    {}
  );
  const dialogRef = useModalAccessibility({
    open: Boolean(editor),
    onClose: () => setEditor(null),
  });

  const listParams = useMemo(
    () => ({ q: q || undefined, sort, order, page, limit: PAGE_SIZE, isActive }),
    [q, sort, order, page, isActive]
  );

  const listQuery = useQuery({
    queryKey: [...QUERY_KEYS.adminBrands, listParams],
    queryFn: async () => {
      const res = await adminApi.listCatalogBrands(listParams);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!editor || editor === 'create') {
      setForm(EMPTY_FORM);
      return;
    }
    setForm(fromBrand(editor));
  }, [editor]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminBrands });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input = toUpsertInput(form);
      if (editor && editor !== 'create') {
        return (await adminApi.updateCatalogBrand(editor.id, input)).data.data;
      }
      return (await adminApi.createCatalogBrand(input)).data.data;
    },
    onSuccess: async (brand) => {
      await invalidate();
      showToast(t('saved'), 'success');
      setEditor(brand);
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'CODE_EXISTS' || code === 'BRAND_CODE_EXISTS') {
        showToast(t('brands.codeExists'), 'error');
        return;
      }
      showToast(t('error'), 'error');
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      adminApi.setCatalogBrandActive(id, next),
    onSuccess: async () => {
      await invalidate();
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCatalogBrand(id),
    onSuccess: async () => {
      await invalidate();
      showToast(t('brands.deleteSuccess'), 'success');
      setPendingDelete(null);
      setEditor(null);
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'BRAND_HAS_MACHINES') {
        showToast(t('brands.hasMachines'), 'error');
      } else {
        showToast(t('error'), 'error');
      }
      setPendingDelete(null);
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      setUploadProgress((p) => ({ ...p, logo: 0 }));
      return (
        await adminApi.uploadCatalogBrandLogo(id, file, (percent) =>
          setUploadProgress((p) => ({ ...p, logo: percent }))
        )
      ).data.data;
    },
    onSuccess: async (brand) => {
      await invalidate();
      setEditor(brand);
      showToast(t('brands.uploadSuccess'), 'success');
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'FILE_TOO_LARGE') showToast(t('brands.uploadTooLarge'), 'error');
      else if (code === 'UNSUPPORTED_FILE_TYPE' || code === 'INVALID_IMAGE')
        showToast(t('brands.uploadUnsupported'), 'error');
      else showToast(t('error'), 'error');
    },
    onSettled: () => setUploadProgress((p) => ({ ...p, logo: undefined })),
  });

  const uploadHeroMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      setUploadProgress((p) => ({ ...p, hero: 0 }));
      return (
        await adminApi.uploadCatalogBrandImage(id, file, (percent) =>
          setUploadProgress((p) => ({ ...p, hero: percent }))
        )
      ).data.data;
    },
    onSuccess: async (brand) => {
      await invalidate();
      setEditor(brand);
      showToast(t('brands.uploadSuccess'), 'success');
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'FILE_TOO_LARGE') showToast(t('brands.uploadTooLarge'), 'error');
      else if (code === 'UNSUPPORTED_FILE_TYPE' || code === 'INVALID_IMAGE')
        showToast(t('brands.uploadUnsupported'), 'error');
      else showToast(t('error'), 'error');
    },
    onSettled: () => setUploadProgress((p) => ({ ...p, hero: undefined })),
  });

  const clearLogoMutation = useMutation({
    mutationFn: (id: string) => adminApi.clearCatalogBrandLogo(id),
    onSuccess: async (res) => {
      await invalidate();
      setEditor(res.data.data);
      showToast(t('brands.clearSuccess'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const clearHeroMutation = useMutation({
    mutationFn: (id: string) => adminApi.clearCatalogBrandImage(id),
    onSuccess: async (res) => {
      await invalidate();
      setEditor(res.data.data);
      showToast(t('brands.clearSuccess'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const handleImagePick = (kind: 'logo' | 'hero', file: File | undefined, brandId?: string) => {
    if (!file || !brandId) return;
    if (!isAllowedImage(file)) {
      showToast(t('brands.uploadUnsupported'), 'error');
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast(t('brands.uploadTooLarge'), 'error');
      return;
    }
    if (kind === 'logo') uploadLogoMutation.mutate({ id: brandId, file });
    else uploadHeroMutation.mutate({ id: brandId, file });
  };

  if (listQuery.isLoading && !listQuery.data) {
    return (
      <AdminPageShell title={t('brands.title')} subtitle={t('brands.subtitle')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.meta.total ?? 0;
  const totalPages = listQuery.data?.meta.totalPages ?? 1;
  const editingBrand = editor && editor !== 'create' ? editor : null;

  return (
    <AdminPageShell title={t('brands.title')} subtitle={t('brands.subtitle')}>
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
          placeholder={t('brands.searchPlaceholder')}
        />
        <select
          className="input"
          value={isActive}
          onChange={(e) => {
            setIsActive(e.target.value as ActiveFilter);
            setPage(1);
          }}
        >
          <option value="all">{t('brands.filterAll')}</option>
          <option value="true">{t('active')}</option>
          <option value="false">{t('inactive')}</option>
        </select>
        <select
          className="input"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value as SortKey);
            setPage(1);
          }}
        >
          <option value="sortOrder">{t('brands.sortOrder')}</option>
          <option value="name">{t('brands.sortName')}</option>
          <option value="createdAt">{t('brands.sortCreated')}</option>
        </select>
        <select
          className="input"
          value={order}
          onChange={(e) => {
            setOrder(e.target.value as 'asc' | 'desc');
            setPage(1);
          }}
        >
          <option value="asc">{t('brands.orderAsc')}</option>
          <option value="desc">{t('brands.orderDesc')}</option>
        </select>
        <button type="submit" className="btn btn--primary">
          {t('brands.search')}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setEditor('create')}
        >
          {t('brands.create')}
        </button>
      </form>

      <AdminPanel count={total} countLabel={t('listCount', { count: total })}>
        <div className="admin-table admin-table--dense">
          {items.length === 0 ? (
            <div className="admin-empty">{t('brands.empty')}</div>
          ) : (
            items.map((brand) => (
              <div key={brand.id} className="card admin-table__row">
                <div className="admin-table__brand">
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt="" className="admin-table__brand-logo" />
                  ) : null}
                  <div className="admin-table__primary">
                    <div className="admin-table__title-row">
                      <strong>{getLocalizedName(brand.name, i18n.language, brand.code)}</strong>
                      <span
                        className={`admin-status-pill${brand.isActive ? ' is-active' : ' is-inactive'}`}
                      >
                        {brand.isActive ? t('active') : t('inactive')}
                      </span>
                    </div>
                    <p className="admin-table__meta">
                      {brand.code}
                      {brand.countryCode ? ` · ${brand.countryCode}` : ''}
                      {` · ${t('brands.machinesCount', { count: brand.machineCount ?? 0 })}`}
                      {` · #${brand.sortOrder ?? 0}`}
                    </p>
                  </div>
                </div>
                <div className="admin-table__actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setEditor(brand)}
                  >
                    {t('brands.edit')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() =>
                      activeMutation.mutate({ id: brand.id, next: !brand.isActive })
                    }
                  >
                    {brand.isActive ? t('disable') : t('enable')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setPendingDelete(brand)}
                  >
                    {t('brands.delete')}
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
        <div className="dialog-overlay" role="presentation" onClick={() => setEditor(null)}>
          <div
            ref={dialogRef}
            className="dialog card admin-catalog-dialog"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="admin-catalog-dialog__title">
              {editor === 'create' ? t('brands.create') : t('brands.edit')}
            </h3>
            <div className="admin-form-grid admin-catalog-form">
              <label>
                {t('brands.code')}
                <input
                  className="input"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  disabled={Boolean(editingBrand)}
                />
              </label>
              <label>
                {t('brands.nameKo')}
                <input
                  className="input"
                  value={form.nameKo}
                  onChange={(e) => setForm((f) => ({ ...f, nameKo: e.target.value }))}
                />
              </label>
              <label>
                {t('brands.nameEn')}
                <input
                  className="input"
                  value={form.nameEn}
                  onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                />
              </label>
              <label>
                {t('brands.country')}
                <input
                  className="input"
                  value={form.countryCode}
                  maxLength={2}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase() }))
                  }
                />
              </label>
              <label>
                {t('brands.website')}
                <input
                  className="input"
                  value={form.websiteUrl}
                  onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                />
              </label>
              <label>
                {t('brands.displayOrder')}
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </label>
              <label>
                {t('brands.descriptionKo')}
                <textarea
                  className="input"
                  rows={3}
                  value={form.descriptionKo}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionKo: e.target.value }))}
                />
              </label>
              <label>
                {t('brands.descriptionEn')}
                <textarea
                  className="input"
                  rows={3}
                  value={form.descriptionEn}
                  onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
                />
              </label>
              <label className="admin-catalog-check">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                {t('active')}
              </label>
            </div>

            {editingBrand ? (
              <div className="admin-catalog-images">
                <CatalogImageField
                  label={t('brands.logo')}
                  url={editingBrand.logoUrl}
                  progress={uploadProgress.logo}
                  busy={uploadLogoMutation.isPending || clearLogoMutation.isPending}
                  onUpload={(file) => handleImagePick('logo', file, editingBrand.id)}
                  onClear={() => clearLogoMutation.mutate(editingBrand.id)}
                  uploadLabel={t('brands.upload')}
                  changeLabel={t('brands.change')}
                  clearLabel={t('brands.clearImage')}
                  dropLabel={t('brands.dropHere')}
                  uploadingLabel={t('brands.uploading')}
                />
                <CatalogImageField
                  label={t('brands.heroImage')}
                  url={editingBrand.imageUrl}
                  progress={uploadProgress.hero}
                  busy={uploadHeroMutation.isPending || clearHeroMutation.isPending}
                  onUpload={(file) => handleImagePick('hero', file, editingBrand.id)}
                  onClear={() => clearHeroMutation.mutate(editingBrand.id)}
                  uploadLabel={t('brands.upload')}
                  changeLabel={t('brands.change')}
                  clearLabel={t('brands.clearImage')}
                  dropLabel={t('brands.dropHere')}
                  uploadingLabel={t('brands.uploading')}
                />
              </div>
            ) : (
              <p className="admin-muscle-hint">{t('brands.saveBeforeImages')}</p>
            )}

            <div className="admin-catalog-dialog__actions">
              <button type="button" className="btn btn--secondary" onClick={() => setEditor(null)}>
                {t('brands.cancel')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={
                  saveMutation.isPending || !form.code.trim() || !form.nameKo.trim()
                }
                onClick={() => saveMutation.mutate()}
              >
                {t('brands.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('brands.deleteTitle')}
        message={t('brands.deleteMessage', {
          name: pendingDelete
            ? getLocalizedName(pendingDelete.name, i18n.language, pendingDelete.code)
            : '',
          count: pendingDelete?.machineCount ?? 0,
        })}
        confirmLabel={t('brands.delete')}
        confirmVariant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
        }}
      />
    </AdminPageShell>
  );
}
