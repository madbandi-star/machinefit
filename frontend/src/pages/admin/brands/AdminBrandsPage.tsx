import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import type { AdminBrandUpsertInput, Brand } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Pagination } from '@/components/feedback/Pagination/Pagination';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { ScrollCarousel } from '@/components/navigation/ScrollCarousel/ScrollCarousel';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getLocalizedName } from '@/utils/localizedName';
import { getApiErrorCode } from '@/utils/motivationAudio';
import { getApiValidationFieldSummary } from '@/utils/getApiErrorMessage';
import { useModalAccessibility } from '@/hooks/useModalAccessibility';
import { resolveBrandMediaUrl } from '@/utils/brandMediaUrl';
import '@/styles/admin.css';
import '@/styles/admin-glance.css';

const PAGE_SIZE = 20;
const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

type SortKey = 'name' | 'createdAt' | 'sortOrder';
type ActiveFilter = 'all' | 'true' | 'false';
type BrandListParams = {
  q?: string;
  sort?: SortKey;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  isActive?: ActiveFilter;
};

type BrandFormState = {
  code: string;
  nameKo: string;
  nameEn: string;
  nameJa: string;
  nameZh: string;
  descriptionKo: string;
  descriptionEn: string;
  descriptionJa: string;
  descriptionZh: string;
  websiteUrl: string;
  countryCode: string;
  sortOrder: string;
  isActive: boolean;
};

const EMPTY_FORM: BrandFormState = {
  code: '',
  nameKo: '',
  nameEn: '',
  nameJa: '',
  nameZh: '',
  descriptionKo: '',
  descriptionEn: '',
  descriptionJa: '',
  descriptionZh: '',
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

/** Blank / bare `https://` → empty; host-only values get https:// */
function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\/$/i.test(trimmed)) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

function toUpsertInput(form: BrandFormState): AdminBrandUpsertInput {
  return {
    code: form.code.trim().toUpperCase(),
    name: {
      ko: form.nameKo.trim(),
      en: form.nameEn.trim() || form.nameKo.trim(),
      ja: form.nameJa.trim() || undefined,
      zh: form.nameZh.trim() || undefined,
    },
    description: (
      form.descriptionKo.trim() ||
      form.descriptionEn.trim() ||
      form.descriptionJa.trim() ||
      form.descriptionZh.trim()
    )
      ? {
          ko: form.descriptionKo.trim() || undefined,
          en: form.descriptionEn.trim() || undefined,
          ja: form.descriptionJa.trim() || undefined,
          zh: form.descriptionZh.trim() || undefined,
        }
      : undefined,
    websiteUrl: normalizeWebsiteUrl(form.websiteUrl),
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
    nameJa: brand.name.ja ?? '',
    nameZh: brand.name.zh ?? '',
    descriptionKo: brand.description?.ko ?? '',
    descriptionEn: brand.description?.en ?? '',
    descriptionJa: brand.description?.ja ?? '',
    descriptionZh: brand.description?.zh ?? '',
    websiteUrl: brand.websiteUrl ?? '',
    countryCode: brand.countryCode ?? '',
    sortOrder: String(brand.sortOrder ?? 0),
    isActive: brand.isActive,
  };
}

function matchesBrandFilters(brand: Brand, params: BrandListParams): boolean {
  const query = params.q?.trim().toLowerCase();
  if (query) {
    const haystack = [brand.code, brand.name.ko, brand.name.en].filter(Boolean).join(' ').toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (params.isActive === 'true' && !brand.isActive) return false;
  if (params.isActive === 'false' && brand.isActive) return false;
  return true;
}

function compareBrands(a: Brand, b: Brand, params: BrandListParams): number {
  const sort = params.sort ?? 'sortOrder';
  const order = params.order === 'desc' ? -1 : 1;
  if (sort === 'createdAt') {
    const left = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const right = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return (left - right) * order || a.code.localeCompare(b.code);
  }
  if (sort === 'name') {
    const left = (a.name.en ?? a.name.ko ?? a.code).toLowerCase();
    const right = (b.name.en ?? b.name.ko ?? b.code).toLowerCase();
    return left.localeCompare(right) * order || a.code.localeCompare(b.code);
  }
  return ((a.sortOrder ?? 0) - (b.sortOrder ?? 0)) * order || a.code.localeCompare(b.code);
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
  const previewUrl = resolveBrandMediaUrl(url);

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
        {previewUrl ? (
          <img key={previewUrl} src={previewUrl} alt="" className="admin-catalog-image__preview" />
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
          tabIndex={-1}
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
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('sortOrder');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [isActive, setIsActive] = useState<ActiveFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editor, setEditor] = useState<'create' | Brand | null>(null);
  const [form, setForm] = useState<BrandFormState>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<Brand | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Partial<Record<'logo' | 'hero', number>>>(
    {}
  );
  const [formStatus, setFormStatus] = useState<{
    type: 'pending' | 'success' | 'error';
    message: string;
  } | null>(null);
  const closeEditor = useCallback(() => {
    setFormStatus(null);
    setEditor(null);
  }, []);
  const openCreate = useCallback(() => {
    setForm(EMPTY_FORM);
    setFormStatus(null);
    setEditor('create');
  }, []);
  const openEdit = useCallback((brand: Brand) => {
    setForm(fromBrand(brand));
    setFormStatus(null);
    setEditor(brand);
  }, []);

  const listParams = useMemo(
    () => ({ q: q.trim() || undefined, sort, order, page, limit: PAGE_SIZE, isActive }),
    [q, sort, order, page, isActive]
  );

  const listQuery = useQuery({
    queryKey: [...QUERY_KEYS.adminBrands, listParams],
    queryFn: async () => {
      const res = await adminApi.listCatalogBrands(listParams);
      return res.data.data;
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminBrands });
  };

  const syncBrandCaches = useCallback(
    (brand: Brand, mode: 'upsert' | 'delete') => {
      const entries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.adminBrands });
      for (const [queryKey, cached] of entries) {
        if (queryKey[3] === 'options' && Array.isArray(cached)) {
          const options = cached as Brand[];
          if (mode === 'delete') {
            queryClient.setQueryData(
              queryKey,
              options.filter((item) => item.id !== brand.id)
            );
            continue;
          }
          const next = options.some((item) => item.id === brand.id)
            ? options.map((item) => (item.id === brand.id ? brand : item))
            : [...options, brand];
          next.sort((a, b) => compareBrands(a, b, { sort: 'name', order: 'asc' }));
          queryClient.setQueryData(queryKey, next);
          continue;
        }

        if (!cached || typeof cached !== 'object' || !('items' in cached) || !('meta' in cached)) continue;
        const data = cached as { items: Brand[]; meta: { total: number; limit: number } };
        const params = (queryKey[3] ?? {}) as BrandListParams;
        const filteredWithoutItem = data.items.filter((item) => item.id !== brand.id);
        const hadItem = filteredWithoutItem.length !== data.items.length;

        if (mode === 'delete') {
          queryClient.setQueryData(queryKey, {
            ...data,
            items: filteredWithoutItem,
            meta: {
              ...data.meta,
              total: Math.max(0, data.meta.total - (hadItem ? 1 : 0)),
            },
          });
          continue;
        }

        const matches = matchesBrandFilters(brand, params);
        if (!matches) {
          queryClient.setQueryData(queryKey, {
            ...data,
            items: filteredWithoutItem,
            meta: {
              ...data.meta,
              total: Math.max(0, data.meta.total - (hadItem ? 1 : 0)),
            },
          });
          continue;
        }

        const nextItems = [...filteredWithoutItem, brand].sort((a, b) => compareBrands(a, b, params));
        queryClient.setQueryData(queryKey, {
          ...data,
          items: nextItems.slice(0, data.meta.limit),
          meta: {
            ...data.meta,
            total: data.meta.total + (hadItem ? 0 : 1),
          },
        });
      }
    },
    [queryClient]
  );

  const resolveSaveError = useCallback(
    (error: unknown) => {
      if (axios.isAxiosError(error) && !error.response) {
        return t('brands.networkError');
      }
      const code = getApiErrorCode(error);
      if (code === 'CODE_EXISTS' || code === 'BRAND_CODE_EXISTS') return t('brands.codeExists');
      if (code === 'INVALID_COUNTRY') return t('brands.invalidCountry');
      if (code === 'VALIDATION_ERROR') {
        const summary = getApiValidationFieldSummary(error)?.toLowerCase() ?? '';
        if (summary.includes('code')) return t('brands.invalidCode');
        if (summary.includes('website') || summary.includes('url')) return t('brands.invalidWebsite');
        if (summary.includes('country')) return t('brands.invalidCountry');
        return t('brands.validationError');
      }
      return t('error');
    },
    [t]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input = toUpsertInput(form);
      if (editor && editor !== 'create') {
        return (await adminApi.updateCatalogBrand(editor.id, input)).data.data;
      }
      return (await adminApi.createCatalogBrand(input)).data.data;
    },
    onMutate: () => {
      setFormStatus({ type: 'pending', message: t('brands.saving') });
      showToast(t('brands.saving'), 'info');
    },
    onSuccess: async (brand) => {
      syncBrandCaches(brand, 'upsert');
      await invalidate();
      const message = t('brands.saveSuccess');
      setFormStatus({ type: 'success', message });
      showToast(message, 'success');
      setForm(fromBrand(brand));
      setEditor(brand);
    },
    onError: (error) => {
      const message = resolveSaveError(error);
      setFormStatus({ type: 'error', message });
      showToast(message, 'error');
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      adminApi.setCatalogBrandActive(id, next),
    onMutate: async ({ id, next }) => {
      showToast(t('processing'), 'info');
      const previous = queryClient.getQueriesData({ queryKey: QUERY_KEYS.adminBrands });
      const entries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.adminBrands });
      for (const [queryKey, cached] of entries) {
        if (!cached || typeof cached !== 'object' || !('items' in cached)) continue;
        const data = cached as { items: Brand[]; meta: unknown };
        queryClient.setQueryData(queryKey, {
          ...data,
          items: data.items.map((item) => (item.id === id ? { ...item, isActive: next } : item)),
        });
      }
      return { previous };
    },
    onSuccess: async (response, variables) => {
      syncBrandCaches(response.data.data, 'upsert');
      await invalidate();
      showToast(
        variables.next ? t('brands.enabledSuccess') : t('brands.disabledSuccess'),
        'success'
      );
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        for (const [queryKey, data] of context.previous) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      showToast(t('error'), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCatalogBrand(id),
    onMutate: () => showToast(t('brands.deleting'), 'info'),
    onSuccess: async () => {
      if (pendingDelete) syncBrandCaches(pendingDelete, 'delete');
      await invalidate();
      showToast(t('brands.deleteSuccess'), 'success');
      setPendingDelete(null);
      setFormStatus(null);
      setEditor(null);
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'BRAND_HAS_MACHINES') {
        showToast(t('brands.hasMachines'), 'error');
      } else if (code === 'BRAND_IN_USE') {
        showToast(t('brands.inUse'), 'error');
      } else if (axios.isAxiosError(error) && !error.response) {
        showToast(t('brands.networkError'), 'error');
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
    onMutate: () => showToast(t('brands.uploading'), 'info'),
    onSuccess: async (brand) => {
      syncBrandCaches(brand, 'upsert');
      await invalidate();
      setEditor(brand);
      setFormStatus({ type: 'success', message: t('brands.uploadSuccess') });
      showToast(t('brands.uploadSuccess'), 'success');
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      const message =
        axios.isAxiosError(error) && !error.response
          ? t('brands.networkError')
          : code === 'FILE_TOO_LARGE'
            ? t('brands.uploadTooLarge')
            : code === 'UNSUPPORTED_FILE_TYPE' || code === 'INVALID_IMAGE'
              ? t('brands.uploadUnsupported')
              : t('error');
      setFormStatus({ type: 'error', message });
      showToast(message, 'error');
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
    onMutate: () => showToast(t('brands.uploading'), 'info'),
    onSuccess: async (brand) => {
      syncBrandCaches(brand, 'upsert');
      await invalidate();
      setEditor(brand);
      setFormStatus({ type: 'success', message: t('brands.uploadSuccess') });
      showToast(t('brands.uploadSuccess'), 'success');
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      const message =
        axios.isAxiosError(error) && !error.response
          ? t('brands.networkError')
          : code === 'FILE_TOO_LARGE'
            ? t('brands.uploadTooLarge')
            : code === 'UNSUPPORTED_FILE_TYPE' || code === 'INVALID_IMAGE'
              ? t('brands.uploadUnsupported')
              : t('error');
      setFormStatus({ type: 'error', message });
      showToast(message, 'error');
    },
    onSettled: () => setUploadProgress((p) => ({ ...p, hero: undefined })),
  });

  const clearLogoMutation = useMutation({
    mutationFn: (id: string) => adminApi.clearCatalogBrandLogo(id),
    onMutate: () => showToast(t('processing'), 'info'),
    onSuccess: async (res) => {
      syncBrandCaches(res.data.data, 'upsert');
      await invalidate();
      setEditor(res.data.data);
      setFormStatus({ type: 'success', message: t('brands.clearSuccess') });
      showToast(t('brands.clearSuccess'), 'success');
    },
    onError: () => {
      setFormStatus({ type: 'error', message: t('error') });
      showToast(t('error'), 'error');
    },
  });

  const clearHeroMutation = useMutation({
    mutationFn: (id: string) => adminApi.clearCatalogBrandImage(id),
    onMutate: () => showToast(t('processing'), 'info'),
    onSuccess: async (res) => {
      syncBrandCaches(res.data.data, 'upsert');
      await invalidate();
      setEditor(res.data.data);
      setFormStatus({ type: 'success', message: t('brands.clearSuccess') });
      showToast(t('brands.clearSuccess'), 'success');
    },
    onError: () => {
      setFormStatus({ type: 'error', message: t('error') });
      showToast(t('error'), 'error');
    },
  });

  const formBusy =
    saveMutation.isPending ||
    uploadLogoMutation.isPending ||
    uploadHeroMutation.isPending ||
    clearLogoMutation.isPending ||
    clearHeroMutation.isPending;

  const dialogRef = useModalAccessibility({
    open: Boolean(editor),
    onClose: closeEditor,
    closeOnEscape: !formBusy,
    initialFocusSelector: editor === 'create' ? '#admin-brand-code' : '#admin-brand-name-ko',
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

  const validateBeforeSave = useCallback(() => {
    if (!form.code.trim()) return t('brands.requiredCode');
    if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) return t('brands.invalidCode');
    if (!form.nameKo.trim()) return t('brands.requiredNameKo');
    const website = normalizeWebsiteUrl(form.websiteUrl);
    if (website && !/^https?:\/\/.+/i.test(website)) return t('brands.invalidWebsite');
    if (form.countryCode.trim() && form.countryCode.trim().length !== 2) {
      return t('brands.invalidCountry');
    }
    return null;
  }, [form.code, form.countryCode, form.nameKo, form.websiteUrl, t]);

  const handleSave = useCallback(() => {
    if (saveMutation.isPending) return;
    const message = validateBeforeSave();
    if (message) {
      setFormStatus({ type: 'error', message });
      showToast(message, 'error');
      return;
    }
    saveMutation.mutate();
  }, [saveMutation, showToast, validateBeforeSave]);

  if (listQuery.isLoading && !listQuery.data) {
    return (
      <AdminPageShell
        title={t('brands.title')}
        subtitle={t('brands.subtitle')}
        backTo={ROUTES.ADMIN}
        backLabel={t('backToAdmin')}
      >
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.meta.total ?? 0;
  const totalPages = listQuery.data?.meta.totalPages ?? 1;
  const editingBrand = editor && editor !== 'create' ? editor : null;
  const pageActive = items.filter((b) => b.isActive).length;
  const pageInactive = items.length - pageActive;

  const setActiveFilter = (next: ActiveFilter) => {
    setIsActive(next);
    setPage(1);
    setExpandedId(null);
  };

  return (
    <AdminPageShell
      title={t('brands.title')}
      subtitle={t('brands.subtitle')}
      backTo={ROUTES.ADMIN}
      backLabel={t('backToAdmin')}
      actions={
        <button type="button" className="btn btn--primary" onClick={openCreate}>
          {t('brands.create')}
        </button>
      }
    >
      <div className="ag">
        <section className="ag-kpis" aria-label={t('brands.stats')}>
          <button
            type="button"
            className={`ag-kpi${isActive === 'all' ? ' is-active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span className="ag-kpi__value">{total}</span>
            <span className="ag-kpi__label">{t('brands.statTotal')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${isActive === 'true' ? ' is-active' : ''}`}
            onClick={() => setActiveFilter('true')}
          >
            <span className="ag-kpi__value">{pageActive}</span>
            <span className="ag-kpi__label">{t('brands.statActivePage')}</span>
          </button>
          <button
            type="button"
            className={`ag-kpi${isActive === 'false' ? ' is-active' : ''}${
              pageInactive > 0 ? ' is-muted' : ''
            }`}
            onClick={() => setActiveFilter('false')}
          >
            <span className="ag-kpi__value">{pageInactive}</span>
            <span className="ag-kpi__label">{t('brands.statInactivePage')}</span>
          </button>
        </section>

        <section className="ag-panel">
          <div className="ag-toolbar">
            <input
              className="ag-search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
                setExpandedId(null);
              }}
              placeholder={t('brands.searchPlaceholder')}
              aria-label={t('brands.searchPlaceholder')}
            />
            <ScrollCarousel
              className="chip-carousel"
              scrollerClassName="ag-chips"
              scrollerProps={{ role: 'group', 'aria-label': t('brands.filterAll') }}
            >
              <button
                type="button"
                className={`ag-chip${isActive === 'all' ? ' is-active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                {t('brands.filterAll')}
                <span className="ag-chip__count">{total}</span>
              </button>
              <button
                type="button"
                className={`ag-chip${isActive === 'true' ? ' is-active' : ''}`}
                onClick={() => setActiveFilter('true')}
              >
                {t('active')}
                <span className="ag-chip__count">{pageActive}</span>
              </button>
              <button
                type="button"
                className={`ag-chip${isActive === 'false' ? ' is-active' : ''}`}
                onClick={() => setActiveFilter('false')}
              >
                {t('inactive')}
                <span className="ag-chip__count">{pageInactive}</span>
              </button>
            </ScrollCarousel>
            <div className="ag-field-row">
              <label className="ag-field">
                <span>{t('brands.sortOrder')}</span>
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
              </label>
              <label className="ag-field">
                <span>{t('brands.orderAsc')}</span>
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
              </label>
            </div>
            <div className="ag-card__actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                disabled={listQuery.isFetching}
                onClick={() => void listQuery.refetch()}
              >
                {listQuery.isFetching ? t('processing') : t('brands.refresh')}
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="ag-empty">{t('brands.empty')}</p>
          ) : (
            <div className="ag-queue">
              {items.map((brand) => {
                const open = expandedId === brand.id;
                const name = getLocalizedName(brand.name, i18n.language, brand.code);
                const logoSrc = brand.logoUrl ? resolveBrandMediaUrl(brand.logoUrl) : null;
                return (
                  <article
                    key={brand.id}
                    className={[
                      'ag-card',
                      brand.isActive ? 'is-on' : 'is-off',
                      open || editingBrand?.id === brand.id ? 'is-selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      type="button"
                      className="ag-card__main"
                      onClick={() =>
                        setExpandedId((prev) => (prev === brand.id ? null : brand.id))
                      }
                    >
                      <span className="ag-card__identity ag-card__identity--with-thumb">
                        {logoSrc ? (
                          <img src={logoSrc} alt="" className="ag-card__thumb" />
                        ) : (
                          <span className="ag-card__thumb ag-card__thumb--empty" aria-hidden />
                        )}
                        <span>
                          <span className="ag-card__title">{name}</span>
                          <span className="ag-card__meta">
                            {brand.code}
                            {brand.countryCode ? ` · ${brand.countryCode}` : ''}
                            {` · ${t('brands.machinesCount', { count: brand.machineCount ?? 0 })}`}
                            {` · #${brand.sortOrder ?? 0}`}
                          </span>
                        </span>
                      </span>
                      <span
                        className={`ag-pill ${brand.isActive ? 'ag-pill--on' : 'ag-pill--off'}`}
                      >
                        {brand.isActive ? t('active') : t('inactive')}
                      </span>
                      <span className="ag-card__chevron" aria-hidden>
                        {open ? '▾' : '▸'}
                      </span>
                    </button>
                    {open ? (
                      <div className="ag-card__detail">
                        <div className="ag-card__actions">
                          <button
                            type="button"
                            className="btn btn--secondary btn--sm"
                            onClick={() => openEdit(brand)}
                            disabled={activeMutation.isPending || deleteMutation.isPending}
                          >
                            {t('brands.edit')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            disabled={
                              (activeMutation.isPending &&
                                activeMutation.variables?.id === brand.id) ||
                              deleteMutation.isPending
                            }
                            onClick={() =>
                              activeMutation.mutate({ id: brand.id, next: !brand.isActive })
                            }
                          >
                            {activeMutation.isPending &&
                            activeMutation.variables?.id === brand.id
                              ? t('processing')
                              : brand.isActive
                                ? t('disable')
                                : t('enable')}
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            disabled={activeMutation.isPending || deleteMutation.isPending}
                            onClick={() => setPendingDelete(brand)}
                          >
                            {t('brands.delete')}
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          <Pagination
            page={listQuery.data?.meta.page ?? page}
            totalPages={totalPages}
            onPageChange={(next) => {
              setPage(next);
              setExpandedId(null);
            }}
          />
        </section>
      </div>

      {editor ? (
        <div
          className="dialog-overlay"
          role="presentation"
          onClick={() => {
            if (!formBusy) closeEditor();
          }}
        >          <div
            ref={dialogRef}
            className="dialog card admin-catalog-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-brand-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="admin-catalog-dialog__header">
              <div className="admin-catalog-dialog__top">
                <div>
                  <button
                    type="button"
                    className="admin-catalog-dialog__back"
                    onClick={closeEditor}
                    disabled={formBusy}
                  >
                    <span aria-hidden="true">←</span>
                    {t('brands.backToList')}
                  </button>
                  <h3 id="admin-brand-dialog-title" className="admin-catalog-dialog__title">
                    {editor === 'create' ? t('brands.create') : t('brands.edit')}
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary admin-catalog-dialog__close"
                  onClick={closeEditor}
                  disabled={formBusy}
                  aria-label={t('brands.close')}
                >
                  ✕
                </button>
              </div>
              <p className="admin-catalog-dialog__hint">{t('brands.formHint')}</p>
            </header>

            {formStatus ? (
              <p
                className={`admin-catalog-status admin-catalog-status--${formStatus.type}`}
                role="status"
              >
                {formStatus.message}
              </p>
            ) : null}

            <div className="admin-catalog-sections">
              <section className="admin-catalog-section">
                <h4 className="admin-catalog-section__title">{t('brands.sectionBasic')}</h4>
                <div className="admin-catalog-fields">
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('brands.code')}</span>
                    <input
                      id="admin-brand-code"
                      className="input"
                      value={form.code}
                      autoComplete="off"
                      spellCheck={false}
                      onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                      disabled={Boolean(editingBrand)}
                    />
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('brands.nameKo')}</span>
                    <input
                      id="admin-brand-name-ko"
                      className="input"
                      value={form.nameKo}
                      onChange={(e) => setForm((f) => ({ ...f, nameKo: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('brands.nameEn')}</span>
                    <input
                      className="input"
                      value={form.nameEn}
                      onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('brands.nameJa', { defaultValue: 'Name (JA)' })}</span>
                    <input
                      className="input"
                      value={form.nameJa}
                      onChange={(e) => setForm((f) => ({ ...f, nameJa: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('brands.nameZh', { defaultValue: 'Name (ZH)' })}</span>
                    <input
                      className="input"
                      value={form.nameZh}
                      onChange={(e) => setForm((f) => ({ ...f, nameZh: e.target.value }))}
                    />
                  </label>
                </div>
              </section>

              <section className="admin-catalog-section">
                <h4 className="admin-catalog-section__title">{t('brands.sectionMeta')}</h4>
                <div className="admin-catalog-fields">
                  <label className="admin-catalog-field">
                    <span>{t('brands.country')}</span>
                    <input
                      className="input"
                      value={form.countryCode}
                      maxLength={2}
                      placeholder="KR"
                      onChange={(e) =>
                        setForm((f) => ({ ...f, countryCode: e.target.value.toUpperCase() }))
                      }
                    />
                  </label>
                  <label className="admin-catalog-field">
                    <span>{t('brands.displayOrder')}</span>
                    <input
                      className="input"
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('brands.website')}</span>
                    <input
                      className="input"
                      type="text"
                      inputMode="url"
                      autoComplete="url"
                      placeholder="https://example.com"
                      value={form.websiteUrl}
                      onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-check">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    <span>{t('active')}</span>
                  </label>
                </div>
              </section>

              <section className="admin-catalog-section">
                <h4 className="admin-catalog-section__title">{t('brands.sectionDescription')}</h4>
                <div className="admin-catalog-fields">
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('brands.descriptionKo')}</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={form.descriptionKo}
                      onChange={(e) => setForm((f) => ({ ...f, descriptionKo: e.target.value }))}
                    />
                  </label>
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('brands.descriptionEn')}</span>
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
                <h4 className="admin-catalog-section__title">{t('brands.sectionImages')}</h4>
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
                  <p className="admin-catalog-section__note">{t('brands.saveBeforeImages')}</p>
                )}
              </section>
            </div>

            <div className="admin-catalog-dialog__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={closeEditor}
                disabled={formBusy}
              >
                {t('brands.cancel')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={saveMutation.isPending}
                onClick={handleSave}
              >
                {saveMutation.isPending ? t('brands.saving') : t('brands.save')}
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
        confirmLabel={deleteMutation.isPending ? t('brands.deleting') : t('brands.delete')}
        confirmVariant="danger"
        onClose={() => {
          if (!deleteMutation.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete && !deleteMutation.isPending) {
            deleteMutation.mutate(pendingDelete.id);
          }
        }}
      />
    </AdminPageShell>
  );
}
