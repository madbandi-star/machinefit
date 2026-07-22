import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  TARGET_MUSCLE_GROUPS,
  type MuscleGroupImageAsset,
  type MuscleGroupImageKey,
} from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { getMuscleGroupImage } from '@/constants/muscle-group-images';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorCode } from '@/utils/motivationAudio';
import '@/styles/admin.css';
import '@/styles/admin-muscle-images.css';

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

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

function emptyAsset(muscleGroup: MuscleGroupImageKey): MuscleGroupImageAsset {
  return {
    muscleGroup,
    imageUrl: null,
    thumbnailUrl: null,
    originalFilename: null,
    mimeType: null,
    fileSizeBytes: null,
    width: null,
    height: null,
    version: 0,
    createdAt: null,
    updatedAt: null,
  };
}

export function AdminMuscleGroupImagesPage() {
  const { t, i18n } = useTranslation(['admin', 'machines', 'common']);
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [uploadProgress, setUploadProgress] = useState<Partial<Record<MuscleGroupImageKey, number>>>(
    {}
  );
  const [pendingDelete, setPendingDelete] = useState<MuscleGroupImageKey | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<MuscleGroupImageKey | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminMuscleGroupImages,
    queryFn: async () => {
      const res = await adminApi.listMuscleGroupImages();
      return res.data.data.items;
    },
  });

  const itemsByGroup = useMemo(() => {
    const map = new Map<MuscleGroupImageKey, MuscleGroupImageAsset>();
    for (const item of data ?? []) map.set(item.muscleGroup, item);
    return TARGET_MUSCLE_GROUPS.map((group) => map.get(group) ?? emptyAsset(group));
  }, [data]);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMuscleGroupImages });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.muscleGroupImages });
  }, [queryClient]);

  const uploadMutation = useMutation({
    mutationFn: async ({ group, file }: { group: MuscleGroupImageKey; file: File }) => {
      setUploadProgress((prev) => ({ ...prev, [group]: 0 }));
      const res = await adminApi.uploadMuscleGroupImage(group, file, (percent) => {
        setUploadProgress((prev) => ({ ...prev, [group]: percent }));
      });
      return res.data.data;
    },
    onSuccess: async () => {
      await invalidate();
      showToast(t('admin:muscleImages.uploadSuccess'), 'success');
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'FILE_TOO_LARGE') {
        showToast(t('admin:muscleImages.uploadTooLarge'), 'error');
      } else if (code === 'UNSUPPORTED_FILE_TYPE' || code === 'INVALID_IMAGE') {
        showToast(t('admin:muscleImages.uploadUnsupported'), 'error');
      } else {
        showToast(t('admin:error'), 'error');
      }
    },
    onSettled: (_data, _error, variables) => {
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[variables.group];
        return next;
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (group: MuscleGroupImageKey) => {
      const res = await adminApi.deleteMuscleGroupImage(group);
      return res.data.data;
    },
    onSuccess: async () => {
      await invalidate();
      showToast(t('admin:muscleImages.deleteSuccess'), 'success');
    },
    onError: () => showToast(t('admin:error'), 'error'),
    onSettled: () => setPendingDelete(null),
  });

  const handleFile = (group: MuscleGroupImageKey, file: File | undefined) => {
    if (!file) return;
    if (!isAllowedImage(file)) {
      showToast(t('admin:muscleImages.uploadUnsupported'), 'error');
      return;
    }
    if (file.size > MAX_BYTES) {
      showToast(t('admin:muscleImages.uploadTooLarge'), 'error');
      return;
    }
    uploadMutation.mutate({ group, file });
  };

  if (isLoading) {
    return (
      <PageShell title={t('admin:muscleImages.title')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t('admin:muscleImages.title')} subtitle={t('admin:muscleImages.subtitle')}>
      <p className="admin-muscle-hint">{t('admin:muscleImages.recommend')}</p>

      <div className="admin-muscle-grid">
        {itemsByGroup.map((item) => {
          const group = item.muscleGroup;
          const previewUrl = item.imageUrl || getMuscleGroupImage(group) || null;
          const progress = uploadProgress[group];
          const busy =
            (uploadMutation.isPending && uploadMutation.variables?.group === group) ||
            (deleteMutation.isPending && deleteMutation.variables === group);

          return (
            <MuscleImageCard
              key={group}
              item={item}
              label={t(`machines:muscleGroups.${group}`, { defaultValue: group })}
              previewUrl={previewUrl}
              progress={progress}
              busy={busy}
              dragOver={dragOver === group}
              locale={i18n.language}
              onPickFile={(file) => handleFile(group, file)}
              onDelete={() => setPendingDelete(group)}
              onPreview={() => previewUrl && setLightboxUrl(previewUrl)}
              onDragState={(active) => setDragOver(active ? group : null)}
              labels={{
                upload: t('admin:muscleImages.upload'),
                change: t('admin:muscleImages.change'),
                remove: t('admin:muscleImages.delete'),
                filename: t('admin:muscleImages.filename'),
                size: t('admin:muscleImages.fileSize'),
                uploadedAt: t('admin:muscleImages.uploadedAt'),
                updatedAt: t('admin:muscleImages.updatedAt'),
                dimensions: t('admin:muscleImages.dimensions'),
                placeholder: t('admin:muscleImages.placeholder'),
                dropHere: t('admin:muscleImages.dropHere'),
                uploading: t('admin:muscleImages.uploading'),
              }}
            />
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={t('admin:muscleImages.deleteTitle')}
        message={t('admin:muscleImages.deleteMessage', {
          name: pendingDelete
            ? t(`machines:muscleGroups.${pendingDelete}`, { defaultValue: pendingDelete })
            : '',
        })}
        confirmLabel={t('admin:muscleImages.delete')}
        confirmVariant="danger"
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate(pendingDelete);
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

interface MuscleImageCardProps {
  item: MuscleGroupImageAsset;
  label: string;
  previewUrl: string | null;
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
  };
}

function MuscleImageCard({
  item,
  label,
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
}: MuscleImageCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCustom = Boolean(item.imageUrl);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    onDragState(false);
    const file = event.dataTransfer.files?.[0];
    onPickFile(file);
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
          {label}{' '}
          <span className="admin-muscle-card__code">({item.muscleGroup.toUpperCase()})</span>
        </h2>
      </header>

      <button
        type="button"
        className="admin-muscle-card__preview"
        onClick={onPreview}
        disabled={!previewUrl}
        aria-label={label}
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
          <dd>
            {item.width && item.height ? `${item.width} × ${item.height}` : '—'}
          </dd>
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
