import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
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
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getLocalizedName } from '@/utils/localizedName';
import { getApiErrorCode } from '@/utils/motivationAudio';
import { getApiValidationFieldSummary } from '@/utils/getApiErrorMessage';
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
type MachineListParams = {
  q?: string;
  brandId?: string;
  muscleGroup?: string;
  isActive?: ActiveFilter;
  sort?: SortKey;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
};

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
  /** Admin override for BW estimated load factor; empty = shared default. */
  bodyweightLoadFactor: string;
  standardTypeId: string;
  modelCode: string;
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
  bodyweightLoadFactor: '',
  standardTypeId: '',
  modelCode: '',
};

function isAllowedImage(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.has(ext)) return false;
  if (!file.type) return true;
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase());
}

function toUpsertInput(form: MachineFormState): AdminMachineUpsertInput {
  const factorRaw = form.bodyweightLoadFactor.trim();
  const factorParsed = factorRaw === '' ? null : Number(factorRaw);
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
    standardTypeId: form.standardTypeId.trim() ? form.standardTypeId.trim() : null,
    modelCode: form.modelCode.trim(),
    bodyweightLoadFactor:
      form.machineType === 'bodyweight'
        ? factorParsed != null && Number.isFinite(factorParsed)
          ? factorParsed
          : null
        : null,
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
    bodyweightLoadFactor:
      machine.bodyweightLoadFactor == null ? '' : String(machine.bodyweightLoadFactor),
    standardTypeId: machine.standardTypeId ?? '',
    modelCode: machine.modelCode ?? '',
  };
}

function matchesMachineFilters(machine: Machine, params: MachineListParams): boolean {
  const query = params.q?.trim().toLowerCase();
  if (query) {
    const haystack = [
      machine.code,
      machine.brandCode,
      machine.name.ko,
      machine.name.en,
      machine.brandName?.ko,
      machine.brandName?.en,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (params.brandId && machine.brandId !== params.brandId) return false;
  if (params.muscleGroup && machine.muscleGroup !== params.muscleGroup) return false;
  if (params.isActive === 'true' && !machine.isActive) return false;
  if (params.isActive === 'false' && machine.isActive) return false;
  return true;
}

function compareMachines(a: Machine, b: Machine, params: MachineListParams): number {
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
  if (sort === 'code') {
    return a.code.localeCompare(b.code) * order;
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
          <img key={url} src={url} alt="" className="admin-catalog-image__preview" />
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
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q')?.trim() ?? '';

  const [page, setPage] = useState(1);
  const [draftQ, setDraftQ] = useState(initialQ);
  const [q, setQ] = useState(initialQ);
  const [brandId, setBrandId] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [isActive, setIsActive] = useState<ActiveFilter>('all');
  const [sort, setSort] = useState<SortKey>('sortOrder');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [editor, setEditor] = useState<'create' | Machine | null>(null);
  const [form, setForm] = useState<MachineFormState>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<Machine | null>(null);
  const [pendingForcePurge, setPendingForcePurge] = useState<Machine | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>();
  const [formStatus, setFormStatus] = useState<{
    type: 'pending' | 'success' | 'error';
    message: string;
  } | null>(null);

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

  const standardOptionsQuery = useQuery({
    queryKey: QUERY_KEYS.adminStandardMachineOptions,
    queryFn: async () => {
      const res = await adminApi.listStandardMachineOptions(true);
      return res.data.data.items;
    },
  });

  const editingId = editor && editor !== 'create' ? editor.id : '';
  const galleryQuery = useQuery({
    queryKey: QUERY_KEYS.adminCatalogMachineGallery(editingId),
    enabled: Boolean(editingId),
    queryFn: async () => {
      const res = await adminApi.listCatalogMachineGallery(editingId);
      return res.data.data.items;
    },
  });

  useEffect(() => {
    const next = searchParams.get('q')?.trim() ?? '';
    setDraftQ(next);
    setQ(next);
    setPage(1);
  }, [searchParams]);

  const closeEditor = useCallback(() => {
    setFormStatus(null);
    setEditor(null);
  }, []);
  const openCreate = useCallback(() => {
    setForm({
      ...EMPTY_FORM,
      brandId: brandId || brandsQuery.data?.[0]?.id || '',
    });
    setFormStatus(null);
    setEditor('create');
  }, [brandId, brandsQuery.data]);
  const openEdit = useCallback((machine: Machine) => {
    setForm(fromMachine(machine));
    setFormStatus(null);
    setEditor(machine);
  }, []);

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
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machines });
    await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
  };

  const syncMachineCaches = useCallback(
    (machine: Machine, mode: 'upsert' | 'delete') => {
      const entries = queryClient.getQueriesData({ queryKey: QUERY_KEYS.adminMachines });
      for (const [queryKey, cached] of entries) {
        if (!cached || typeof cached !== 'object' || !('items' in cached) || !('meta' in cached)) continue;
        const data = cached as { items: Machine[]; meta: { total: number; limit: number } };
        const params = (queryKey[3] ?? {}) as MachineListParams;
        const filteredWithoutItem = data.items.filter((item) => item.id !== machine.id);
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

        const matches = matchesMachineFilters(machine, params);
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

        const nextItems = [...filteredWithoutItem, machine].sort((a, b) => compareMachines(a, b, params));
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
        return t('admin:catalogMachines.networkError');
      }
      const code = getApiErrorCode(error);
      if (code === 'CODE_EXISTS' || code === 'MACHINE_CODE_EXISTS') {
        return t('admin:catalogMachines.codeExists');
      }
      if (code === 'INVALID_BRAND') return t('admin:catalogMachines.invalidBrand');
      if (code === 'VALIDATION_ERROR') {
        return getApiValidationFieldSummary(error) ?? t('admin:catalogMachines.validationError');
      }
      return t('admin:error');
    },
    [t]
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input = toUpsertInput(form);
      if (editor && editor !== 'create') {
        return (await adminApi.updateCatalogMachine(editor.id, input)).data.data;
      }
      return (await adminApi.createCatalogMachine(input)).data.data;
    },
    onMutate: () => {
      setFormStatus({ type: 'pending', message: t('admin:catalogMachines.saving') });
      showToast(t('admin:catalogMachines.saving'), 'info');
    },
    onSuccess: async (machine) => {
      syncMachineCaches(machine, 'upsert');
      await invalidate();
      const message = t('admin:catalogMachines.saveSuccess');
      setFormStatus({ type: 'success', message });
      showToast(message, 'success');
      setForm(fromMachine(machine));
      setEditor(machine);
    },
    onError: (error) => {
      const message = resolveSaveError(error);
      setFormStatus({ type: 'error', message });
      showToast(message, 'error');
    },
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: boolean }) =>
      adminApi.setCatalogMachineActive(id, next),
    onMutate: async ({ id, next }) => {
      showToast(t('admin:processing'), 'info');
      const previous = queryClient.getQueriesData({ queryKey: QUERY_KEYS.adminMachines });
      for (const [queryKey, cached] of previous) {
        if (!cached || typeof cached !== 'object' || !('items' in cached)) continue;
        const data = cached as { items: Machine[]; meta: unknown };
        queryClient.setQueryData(queryKey, {
          ...data,
          items: data.items.map((item) => (item.id === id ? { ...item, isActive: next } : item)),
        });
      }
      return { previous };
    },
    onSuccess: async (response, variables) => {
      syncMachineCaches(response.data.data, 'upsert');
      await invalidate();
      showToast(
        variables.next
          ? t('admin:catalogMachines.enabledSuccess')
          : t('admin:catalogMachines.disabledSuccess'),
        'success'
      );
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        for (const [queryKey, data] of context.previous) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      showToast(t('admin:error'), 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      adminApi.deleteCatalogMachine(id, { force }),
    onMutate: () => showToast(t('admin:catalogMachines.deleting'), 'info'),
    onSuccess: async (res, vars) => {
      const target = vars.force ? pendingForcePurge : pendingDelete;
      if (target) {
        syncMachineCaches(
          {
            ...target,
            isActive: res.data.data.deactivated ? false : target.isActive,
          },
          res.data.data.deactivated ? 'upsert' : 'delete'
        );
      }
      await invalidate();
      if (res.data.data.deactivated) {
        showToast(t('admin:catalogMachines.deactivatedInstead'), 'success');
        if (pendingDelete) setPendingForcePurge(pendingDelete);
      } else if (res.data.data.forcePurged) {
        showToast(t('admin:catalogMachines.forceDeleteSuccess'), 'success');
      } else {
        showToast(t('admin:catalogMachines.deleteSuccess'), 'success');
      }
      setPendingDelete(null);
      if (!res.data.data.deactivated) setPendingForcePurge(null);
      setFormStatus(null);
      setEditor(null);
    },
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && !error.response
          ? t('admin:catalogMachines.networkError')
          : t('admin:error');
      showToast(message, 'error');
      setPendingDelete(null);
      setPendingForcePurge(null);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      setUploadProgress(0);
      return (
        await adminApi.uploadCatalogMachineImage(id, file, (percent) => setUploadProgress(percent))
      ).data.data;
    },
    onMutate: () => showToast(t('admin:catalogMachines.uploading'), 'info'),
    onSuccess: async (machine) => {
      syncMachineCaches(machine, 'upsert');
      await invalidate();
      setEditor(machine);
      setFormStatus({ type: 'success', message: t('admin:catalogMachines.uploadSuccess') });
      showToast(t('admin:catalogMachines.uploadSuccess'), 'success');
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      const message =
        axios.isAxiosError(error) && !error.response
          ? t('admin:catalogMachines.networkError')
          : code === 'FILE_TOO_LARGE'
            ? t('admin:catalogMachines.uploadTooLarge')
            : code === 'UNSUPPORTED_FILE_TYPE' || code === 'INVALID_IMAGE'
              ? t('admin:catalogMachines.uploadUnsupported')
              : t('admin:error');
      setFormStatus({ type: 'error', message });
      showToast(message, 'error');
    },
    onSettled: () => setUploadProgress(undefined),
  });

  const clearMutation = useMutation({
    mutationFn: (id: string) => adminApi.clearCatalogMachineImage(id),
    onMutate: () => showToast(t('admin:processing'), 'info'),
    onSuccess: async (res) => {
      syncMachineCaches(res.data.data, 'upsert');
      await invalidate();
      setEditor(res.data.data);
      setFormStatus({ type: 'success', message: t('admin:catalogMachines.clearSuccess') });
      showToast(t('admin:catalogMachines.clearSuccess'), 'success');
    },
    onError: () => {
      setFormStatus({ type: 'error', message: t('admin:error') });
      showToast(t('admin:error'), 'error');
    },
  });

  const galleryUploadMutation = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const gallery = galleryQuery.data ?? [];
      return (
        await adminApi.uploadCatalogMachineGalleryImage(id, file, {
          isPrimary: gallery.length === 0,
        })
      ).data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminCatalogMachineGallery(editingId),
      });
      await invalidate();
      showToast(t('admin:catalogMachines.galleryUploadSuccess'), 'success');
    },
    onError: () => showToast(t('admin:error'), 'error'),
  });

  const galleryPrimaryMutation = useMutation({
    mutationFn: (imageId: string) =>
      adminApi.updateCatalogMachineGalleryImage(editingId, imageId, { isPrimary: true }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminCatalogMachineGallery(editingId),
      });
      await invalidate();
    },
  });

  const galleryDeleteMutation = useMutation({
    mutationFn: (imageId: string) =>
      adminApi.deleteCatalogMachineGalleryImage(editingId, imageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminCatalogMachineGallery(editingId),
      });
      await invalidate();
      showToast(t('admin:catalogMachines.clearSuccess'), 'success');
    },
  });

  const galleryReorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      adminApi.reorderCatalogMachineGallery(editingId, orderedIds),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminCatalogMachineGallery(editingId),
      });
    },
  });

  const formBusy =
    saveMutation.isPending ||
    uploadMutation.isPending ||
    clearMutation.isPending ||
    galleryUploadMutation.isPending;

  const dialogRef = useModalAccessibility({
    open: Boolean(editor),
    onClose: closeEditor,
    closeOnEscape: !formBusy,
    initialFocusSelector:
      editor === 'create' ? '#admin-machine-brand' : '#admin-machine-name-ko',
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

  const validateBeforeSave = useCallback(() => {
    if (!form.brandId) return t('admin:catalogMachines.requiredBrand');
    if (!form.code.trim()) return t('admin:catalogMachines.requiredCode');
    if (!form.nameKo.trim()) return t('admin:catalogMachines.requiredNameKo');
    return null;
  }, [form.brandId, form.code, form.nameKo, t]);

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

  if ((listQuery.isLoading || brandsQuery.isLoading) && !listQuery.data) {
    return (
      <AdminPageShell
        title={t('admin:catalogMachines.title')}
        subtitle={t('admin:catalogMachines.subtitle')}
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
  const editingMachine = editor && editor !== 'create' ? editor : null;
  const brands = brandsQuery.data ?? [];

  return (
    <AdminPageShell
      title={t('admin:catalogMachines.title')}
      subtitle={t('admin:catalogMachines.subtitle')}
      backTo={ROUTES.ADMIN}
      backLabel={t('admin:backToAdmin')}
      actions={
        <button type="button" className="btn btn--primary admin-machines-page__create" onClick={openCreate}>
          {t('admin:catalogMachines.create')}
        </button>
      }
    >
      <div className="admin-machines-page">
      <form
        className="admin-machines-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(draftQ.trim());
        }}
      >
        <div className="admin-machines-toolbar__search">
          <input
            className="input"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder={t('admin:catalogMachines.searchPlaceholder')}
            aria-label={t('admin:catalogMachines.searchPlaceholder')}
          />
          <button type="submit" className="btn btn--primary">
            {t('admin:catalogMachines.search')}
          </button>
        </div>
        <div className="admin-machines-toolbar__filters" role="group" aria-label={t('admin:catalogMachines.title')}>
          <select
            className="input"
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setPage(1);
            }}
            aria-label={t('admin:catalogMachines.allBrands')}
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
            aria-label={t('admin:catalogMachines.allMuscles')}
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
            aria-label={t('admin:catalogMachines.filterAll')}
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
            aria-label={t('admin:catalogMachines.sortOrder')}
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
            aria-label={t('admin:catalogMachines.orderAsc')}
          >
            <option value="asc">{t('admin:catalogMachines.orderAsc')}</option>
            <option value="desc">{t('admin:catalogMachines.orderDesc')}</option>
          </select>
          <button
            type="button"
            className="btn btn--secondary admin-machines-toolbar__refresh"
            disabled={listQuery.isFetching}
            onClick={() => void listQuery.refetch()}
          >
            {listQuery.isFetching ? t('admin:processing') : t('admin:catalogMachines.refresh')}
          </button>
        </div>
      </form>

      <AdminPanel count={total} countLabel={t('admin:listCount', { count: total })}>
        <div className="admin-machines-list">
          {items.length === 0 ? (
            <div className="admin-empty">{t('admin:catalogMachines.empty')}</div>
          ) : (
            items.map((machine) => (
              <article key={machine.id} className="admin-machines-row">
                <div className="admin-machines-row__main">
                  <div
                    className={`admin-machines-row__thumb${machine.primaryImageUrl ? '' : ' is-empty'}`}
                    aria-hidden
                  >
                    {machine.primaryImageUrl ? (
                      <img src={machine.primaryImageUrl} alt="" loading="lazy" decoding="async" />
                    ) : null}
                  </div>
                  <div className="admin-machines-row__body">
                    <div className="admin-machines-row__title">
                      <strong>
                        {getLocalizedName(machine.name, i18n.language, machine.code)}
                      </strong>
                      <span
                        className={`admin-status-pill${machine.isActive ? ' is-active' : ' is-inactive'}`}
                      >
                        {machine.isActive ? t('admin:active') : t('admin:inactive')}
                      </span>
                    </div>
                    <p className="admin-machines-row__meta">
                      <span>{machine.code}</span>
                      {machine.brandCode ? <span>{machine.brandCode}</span> : null}
                      <span>{machine.muscleGroup}</span>
                      <span>#{machine.sortOrder ?? 0}</span>
                    </p>
                  </div>
                </div>
                <div className="admin-machines-row__actions">
                  <button
                    type="button"
                    className="btn btn--secondary admin-machines-row__btn"
                    onClick={() => openEdit(machine)}
                    disabled={activeMutation.isPending || deleteMutation.isPending}
                  >
                    {t('admin:catalogMachines.edit')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary admin-machines-row__btn"
                    disabled={
                      (activeMutation.isPending &&
                        activeMutation.variables?.id === machine.id) ||
                      deleteMutation.isPending
                    }
                    onClick={() =>
                      activeMutation.mutate({ id: machine.id, next: !machine.isActive })
                    }
                  >
                    {activeMutation.isPending && activeMutation.variables?.id === machine.id
                      ? t('admin:processing')
                      : machine.isActive
                        ? t('admin:disable')
                        : t('admin:enable')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary admin-machines-row__btn admin-machines-row__btn--danger"
                    disabled={activeMutation.isPending || deleteMutation.isPending}
                    onClick={() => setPendingDelete(machine)}
                  >
                    {t('admin:catalogMachines.delete')}
                  </button>
                </div>
              </article>
            ))
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
            if (!formBusy) closeEditor();
          }}
        >
          <div
            ref={dialogRef}
            className="dialog card admin-catalog-dialog admin-machines-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-machine-dialog-title"
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
                    {t('admin:catalogMachines.backToList')}
                  </button>
                  <h3 id="admin-machine-dialog-title" className="admin-catalog-dialog__title">
                    {editor === 'create'
                      ? t('admin:catalogMachines.create')
                      : t('admin:catalogMachines.edit')}
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary admin-catalog-dialog__close"
                  onClick={closeEditor}
                  disabled={formBusy}
                  aria-label={t('admin:catalogMachines.close')}
                >
                  ✕
                </button>
              </div>
              <p className="admin-catalog-dialog__hint">{t('admin:catalogMachines.formHint')}</p>
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
                  {form.machineType === 'bodyweight' ? (
                    <label className="admin-catalog-field admin-catalog-field--full">
                      <span>{t('admin:catalogMachines.bodyweightLoadFactor')}</span>
                      <input
                        className="input"
                        type="number"
                        min={0.01}
                        max={1.5}
                        step={0.01}
                        placeholder={t('admin:catalogMachines.bodyweightLoadFactorPlaceholder')}
                        value={form.bodyweightLoadFactor}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, bodyweightLoadFactor: e.target.value }))
                        }
                      />
                      <span className="admin-catalog-field__hint">
                        {t('admin:catalogMachines.bodyweightLoadFactorHint')}
                      </span>
                    </label>
                  ) : null}
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:catalogMachines.standardType')}</span>
                    <select
                      className="input"
                      value={form.standardTypeId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, standardTypeId: e.target.value }))
                      }
                    >
                      <option value="">{t('admin:catalogMachines.standardTypeNone')}</option>
                      {(standardOptionsQuery.data ?? []).map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {getLocalizedName(opt.name, i18n.language, opt.code)} ({opt.code})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-catalog-field admin-catalog-field--full">
                    <span>{t('admin:catalogMachines.modelCode')}</span>
                    <input
                      className="input"
                      value={form.modelCode}
                      placeholder={t('admin:catalogMachines.modelCodePlaceholder')}
                      onChange={(e) => setForm((f) => ({ ...f, modelCode: e.target.value }))}
                    />
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
                  <>
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
                    <p className="admin-catalog-section__note">
                      {t('admin:catalogMachines.galleryHint')}
                    </p>
                    <div className="admin-catalog-images">
                      <label className="btn btn--secondary">
                        {galleryUploadMutation.isPending
                          ? t('admin:catalogMachines.uploading')
                          : t('admin:catalogMachines.galleryUpload')}
                        <input
                          type="file"
                          accept={ACCEPT}
                          hidden
                          disabled={galleryUploadMutation.isPending}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            if (!isAllowedImage(file)) {
                              showToast(t('admin:catalogMachines.uploadUnsupported'), 'error');
                              return;
                            }
                            if (file.size > MAX_BYTES) {
                              showToast(t('admin:catalogMachines.uploadTooLarge'), 'error');
                              return;
                            }
                            galleryUploadMutation.mutate({ id: editingMachine.id, file });
                          }}
                        />
                      </label>
                      <ul className="admin-catalog-gallery">
                        {(galleryQuery.data ?? []).map((image, index, arr) => (
                          <li key={image.id} className="admin-catalog-gallery__item">
                            <img src={image.imageUrl} alt="" width={64} height={64} />
                            <div className="admin-catalog-gallery__meta">
                              <span>
                                {image.isPrimary
                                  ? t('admin:catalogMachines.primaryBadge')
                                  : image.imageType}
                              </span>
                              <div className="admin-catalog-gallery__actions">
                                {!image.isPrimary ? (
                                  <button
                                    type="button"
                                    className="btn btn--sm btn--secondary"
                                    onClick={() => galleryPrimaryMutation.mutate(image.id)}
                                  >
                                    {t('admin:catalogMachines.setPrimary')}
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="btn btn--sm btn--ghost"
                                  disabled={index === 0}
                                  onClick={() => {
                                    const ids = (galleryQuery.data ?? []).map((g) => g.id);
                                    const tmp = ids[index]!;
                                    ids[index] = ids[index - 1]!;
                                    ids[index - 1] = tmp;
                                    galleryReorderMutation.mutate(ids);
                                  }}
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--sm btn--ghost"
                                  disabled={index === arr.length - 1}
                                  onClick={() => {
                                    const ids = (galleryQuery.data ?? []).map((g) => g.id);
                                    const tmp = ids[index]!;
                                    ids[index] = ids[index + 1]!;
                                    ids[index + 1] = tmp;
                                    galleryReorderMutation.mutate(ids);
                                  }}
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  className="btn btn--sm btn--ghost"
                                  onClick={() => galleryDeleteMutation.mutate(image.id)}
                                >
                                  {t('admin:catalogMachines.clearImage')}
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="admin-catalog-section__note">
                    {t('admin:catalogMachines.saveBeforeImages')}
                  </p>
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
                {t('admin:catalogMachines.cancel')}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={saveMutation.isPending}
                onClick={handleSave}
              >
                {saveMutation.isPending
                  ? t('admin:catalogMachines.saving')
                  : t('admin:catalogMachines.save')}
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
        confirmLabel={
          deleteMutation.isPending
            ? t('admin:catalogMachines.deleting')
            : t('admin:catalogMachines.delete')
        }
        confirmVariant="danger"
        onClose={() => {
          if (!deleteMutation.isPending) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete && !deleteMutation.isPending) {
            deleteMutation.mutate({ id: pendingDelete.id });
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingForcePurge)}
        title={t('admin:catalogMachines.forceDeleteTitle')}
        message={t('admin:catalogMachines.forceDeleteMessage', {
          name: pendingForcePurge
            ? getLocalizedName(pendingForcePurge.name, i18n.language, pendingForcePurge.code)
            : '',
        })}
        confirmLabel={
          deleteMutation.isPending
            ? t('admin:catalogMachines.deleting')
            : t('admin:catalogMachines.forceDelete')
        }
        confirmVariant="danger"
        onClose={() => {
          if (!deleteMutation.isPending) setPendingForcePurge(null);
        }}
        onConfirm={() => {
          if (pendingForcePurge && !deleteMutation.isPending) {
            deleteMutation.mutate({ id: pendingForcePurge.id, force: true });
          }
        }}
      />
    </AdminPageShell>
  );
}
