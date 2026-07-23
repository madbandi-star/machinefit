import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { MachineCoverImageAsset } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorCode } from '@/utils/motivationAudio';
import { getLocalizedName } from '@/utils/localizedName';
import { machinePlaceholderUrl, resolveMachineImageUrl } from '@/utils/catalogAssets';
import '@/styles/admin.css';
import '@/styles/admin-muscle-images.css';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const PAGE_SIZE = 24;

function isAllowedImage(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXT.has(ext)) return false;
  if (!file.type) return true;
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase());
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(locale.startsWith('en') ? 'en-US' : 'ko-KR');
}

export function AdminMachineCoversPage() {
  const { t, i18n } = useTranslation(['admin', 'machines', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [q, setQ] = useState('');
  const [draftQ, setDraftQ] = useState('');
  const [brandCode, setBrandCode] = useState('');
  const [page, setPage] = useState(1);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [pendingDelete, setPendingDelete] = useState<MachineCoverImageAsset | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const brandsQuery = useQuery({
    queryKey: QUERY_KEYS.adminMachineCoverBrands,
    queryFn: async () => {
      const res = await adminApi.listMachineCoverBrands();
      return res.data.data.brands;
    },
  });

  const listQuery = useQuery({
    queryKey: QUERY_KEYS.adminMachineCovers({ q, brandCode, page, pageSize: PAGE_SIZE }),
    queryFn: async () => {
      const res = await adminApi.listMachineCovers({
        q: q || undefined,
        brandCode: brandCode || undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      return res.data.data;
    },
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin', 'machine-covers'] });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machines });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMachines });
    await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.history });
  }, [queryClient]);

  const uploadMutation = useMutation({
    mutationFn: async ({ code, file }: { code: string; file: File }) => {
      setUploadProgress((prev) => ({ ...prev, [code]: 0 }));
      const res = await adminApi.uploadMachineCover(code, file, (percent) => {
        setUploadProgress((prev) => ({ ...prev, [code]: percent }));
      });
      return res.data.data;
    },
    onSuccess: async () => {
      await invalidate();
      showToast(t('admin:machineCovers.uploadSuccess'), 'success');
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'FILE_TOO_LARGE') {
        showToast(t('admin:machineCovers.uploadTooLarge'), 'error');
      } else if (code === 'UNSUPPORTED_FILE_TYPE' || code === 'INVALID_IMAGE') {
        showToast(t('admin:machineCovers.uploadUnsupported'), 'error');
      } else {
        showToast(t('admin:error'), 'error');
      }
    },
    onSettled: (_data, _error, variables) => {
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[variables.code];
        return next;
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await adminApi.deleteMachineCover(code);
      return res.data.data;
    },
    onSuccess: async () => {
      await invalidate();
      showToast(t('admin:machineCovers.deleteSuccess'), 'success');
    },
    onError: () => showToast(t('admin:error'), 'error'),
    onSettled: () => setPendingDelete(null),
  });

  const handleFile = (code: string, file: File | undefined) => {
    if (!file) return;
    if (!isAllowedImage(file)) {
      showToast(t('admin:machineCovers.uploadUnsupported'), 'error');
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast(t('admin:machineCovers.uploadTooLarge'), 'error');
      return;
    }
    uploadMutation.mutate({ code, file });
  };

  const totalPages = useMemo(() => {
    const total = listQuery.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / PAGE_SIZE));
  }, [listQuery.data?.total]);

  if (listQuery.isLoading && !listQuery.data) {
    return (
      <PageShell title={t('admin:machineCovers.title')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  if (listQuery.isError && !listQuery.data) {
    return (
      <PageShell title={t('admin:machineCovers.title')} subtitle={t('admin:machineCovers.subtitle')}>
        <p className="admin-muscle-hint">{t('admin:error')}</p>
        <button type="button" className="btn btn--primary" onClick={() => void listQuery.refetch()}>
          {t('admin:machineCovers.retry')}
        </button>
      </PageShell>
    );
  }

  return (
    <PageShell title={t('admin:machineCovers.title')} subtitle={t('admin:machineCovers.subtitle')}>
      <p className="admin-muscle-hint">{t('admin:machineCovers.recommend')}</p>

      <form
        className="admin-machine-covers-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(draftQ.trim());
        }}
      >
        <label className="form-field admin-machine-covers-toolbar__search">
          <span className="form-field__label">{t('admin:machineCovers.search')}</span>
          <input
            className="input"
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder={t('admin:machineCovers.searchPlaceholder')}
          />
        </label>
        <label className="form-field">
          <span className="form-field__label">{t('admin:machineCovers.brandFilter')}</span>
          <select
            className="input"
            value={brandCode}
            onChange={(e) => {
              setBrandCode(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t('admin:machineCovers.allBrands')}</option>
            {(brandsQuery.data ?? []).map((brand) => (
              <option key={brand.code} value={brand.code}>
                {getLocalizedName(brand.name, i18n.language, brand.code)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn btn--primary">
          {t('admin:machineCovers.applyFilters')}
        </button>
      </form>

      <p className="admin-muscle-hint">
        {t('admin:machineCovers.resultCount', { count: listQuery.data?.total ?? 0 })}
      </p>

      <div className="admin-muscle-grid">
        {(listQuery.data?.items ?? []).map((item) => {
          const previewUrl =
            item.imageUrl ||
            resolveMachineImageUrl(item.machineCode) ||
            machinePlaceholderUrl();
          const progress = uploadProgress[item.machineCode];
          const busy =
            (uploadMutation.isPending && uploadMutation.variables?.code === item.machineCode) ||
            (deleteMutation.isPending && deleteMutation.variables === item.machineCode);
          const title = getLocalizedName(item.machineName, i18n.language, item.machineCode);
          const brandLabel = getLocalizedName(item.brandName, i18n.language, item.brandCode);

          return (
            <MachineCoverCard
              key={item.machineId}
              item={item}
              title={title}
              brandLabel={brandLabel}
              previewUrl={previewUrl}
              progress={progress}
              busy={busy}
              dragOver={dragOver === item.machineCode}
              locale={i18n.language}
              onPickFile={(file) => handleFile(item.machineCode, file)}
              onDelete={() => setPendingDelete(item)}
              onPreview={() => setLightboxUrl(previewUrl)}
              onDragState={(active) => setDragOver(active ? item.machineCode : null)}
              labels={{
                upload: t('admin:machineCovers.upload'),
                change: t('admin:machineCovers.change'),
                remove: t('admin:machineCovers.delete'),
                filename: t('admin:machineCovers.filename'),
                size: t('admin:machineCovers.fileSize'),
                uploadedAt: t('admin:machineCovers.uploadedAt'),
                updatedAt: t('admin:machineCovers.updatedAt'),
                dimensions: t('admin:machineCovers.dimensions'),
                placeholder: t('admin:machineCovers.placeholder'),
                dropHere: t('admin:machineCovers.dropHere'),
                uploading: t('admin:machineCovers.uploading'),
                custom: t('admin:machineCovers.customBadge'),
                catalog: t('admin:machineCovers.catalogBadge'),
              }}
            />
          );
        })}
      </div>

      {(listQuery.data?.items.length ?? 0) === 0 ? (
        <p className="admin-muscle-hint">{t('admin:machineCovers.empty')}</p>
      ) : null}

      <div className="admin-machine-covers-pager">
        <button
          type="button"
          className="btn btn--secondary"
          disabled={page <= 1 || listQuery.isFetching}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          {t('admin:machineCovers.prev')}
        </button>
        <span>
          {t('admin:machineCovers.pageStatus', { page, totalPages })}
        </span>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={page >= totalPages || listQuery.isFetching}
          onClick={() => setPage((p) => p + 1)}
        >
          {t('admin:machineCovers.next')}
        </button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('admin:machineCovers.deleteTitle')}
        message={t('admin:machineCovers.deleteMessage', {
          name: pendingDelete
            ? getLocalizedName(pendingDelete.machineName, i18n.language, pendingDelete.machineCode)
            : '',
        })}
        confirmLabel={t('admin:machineCovers.delete')}
        confirmVariant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete.machineCode);
        }}
      />

      {lightboxUrl ? (
        <button
          type="button"
          className="admin-muscle-lightbox"
          aria-label={t('common:actions.close')}
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="" className="admin-muscle-lightbox__img" />
        </button>
      ) : null}
    </PageShell>
  );
}

interface MachineCoverCardProps {
  item: MachineCoverImageAsset;
  title: string;
  brandLabel: string;
  previewUrl: string;
  progress?: number;
  busy: boolean;
  dragOver: boolean;
  locale: string;
  onPickFile: (file: File | undefined) => void;
  onDelete: () => void;
  onPreview: () => void;
  onDragState: (active: boolean) => void;
  labels: {
    upload: string;
    change: string;
    remove: string;
    filename: string;
    size: string;
    uploadedAt: string;
    updatedAt: string;
    dimensions: string;
    placeholder: string;
    dropHere: string;
    uploading: string;
    custom: string;
    catalog: string;
  };
}

function MachineCoverCard({
  item,
  title,
  brandLabel,
  previewUrl,
  progress,
  busy,
  dragOver,
  locale,
  onPickFile,
  onDelete,
  onPreview,
  onDragState,
  labels,
}: MachineCoverCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCustom = item.hasCustomImage;

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    onDragState(false);
    onPickFile(event.dataTransfer.files?.[0]);
  };

  return (
    <article
      className={`admin-muscle-card${dragOver ? ' is-dragover' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragState(true);
      }}
      onDragLeave={() => onDragState(false)}
      onDrop={onDrop}
    >
      <header className="admin-muscle-card__header">
        <h2 className="admin-muscle-card__title">
          {title}{' '}
          <span className="admin-muscle-card__code">({item.machineCode})</span>
        </h2>
        <p className="admin-muscle-hint" style={{ marginTop: '0.25rem' }}>
          {brandLabel} · {item.muscleGroup}{' '}
          <span
            className={`admin-machine-cover-badge${hasCustom ? ' admin-machine-cover-badge--custom' : ''}`}
          >
            {hasCustom ? labels.custom : labels.catalog}
          </span>
        </p>
      </header>

      <button
        type="button"
        className="admin-muscle-card__preview"
        onClick={onPreview}
        aria-label={title}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="" loading="lazy" decoding="async" />
        ) : (
          <span className="admin-muscle-card__placeholder">{labels.placeholder}</span>
        )}
        {dragOver ? <span className="admin-muscle-card__drop">{labels.dropHere}</span> : null}
      </button>

      {progress != null ? (
        <div className="admin-muscle-progress" aria-live="polite">
          <div className="admin-muscle-progress__bar" style={{ width: `${progress}%` }} />
          <span>
            {labels.uploading} {progress}%
          </span>
        </div>
      ) : null}

      <div className="admin-muscle-card__actions">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            onPickFile(file);
          }}
        />
        <button
          type="button"
          className="btn btn--primary"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {labels.upload}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={busy || !hasCustom}
          onClick={() => inputRef.current?.click()}
        >
          {labels.change}
        </button>
        <button
          type="button"
          className="btn btn--danger"
          disabled={busy || !hasCustom}
          onClick={onDelete}
        >
          {labels.remove}
        </button>
      </div>

      <dl className="admin-muscle-meta">
        <div>
          <dt>{labels.filename}</dt>
          <dd>{item.originalFilename || '—'}</dd>
        </div>
        <div>
          <dt>{labels.size}</dt>
          <dd>{formatBytes(item.fileSizeBytes)}</dd>
        </div>
        <div>
          <dt>{labels.dimensions}</dt>
          <dd>{item.width && item.height ? `${item.width} × ${item.height}` : '—'}</dd>
        </div>
        <div>
          <dt>{labels.uploadedAt}</dt>
          <dd>{formatDate(item.createdAt, locale)}</dd>
        </div>
        <div>
          <dt>{labels.updatedAt}</dt>
          <dd>{formatDate(item.updatedAt, locale)}</dd>
        </div>
      </dl>
    </article>
  );
}
