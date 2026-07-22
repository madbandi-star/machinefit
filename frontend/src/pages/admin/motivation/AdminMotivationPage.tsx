import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { MotivationMediaItem, MotivationMediaType } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import {
  MOTIVATION_AUDIO_ACCEPT,
  getApiErrorCode,
  isAllowedMotivationAudioFile,
} from '@/utils/motivationAudio';
import '@/styles/admin.css';

interface SlotDraft {
  id?: string;
  title: string;
  mediaUrl: string;
  sortOrder: number;
  isSelected: boolean;
}

function emptySlots(): SlotDraft[] {
  return Array.from({ length: 5 }, (_, index) => ({
    title: '',
    mediaUrl: '',
    sortOrder: index,
    isSelected: false,
  }));
}

function toSlots(items: MotivationMediaItem[]): SlotDraft[] {
  const slots = emptySlots();
  for (const item of items) {
    const index = Math.min(Math.max(item.sortOrder, 0), 4);
    slots[index] = {
      id: item.id,
      title: item.title,
      mediaUrl: item.mediaUrl,
      sortOrder: index,
      isSelected: item.isSelected,
    };
  }
  return slots;
}

export function AdminMotivationPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [musicSlots, setMusicSlots] = useState<SlotDraft[]>(emptySlots);
  const [videoSlots, setVideoSlots] = useState<SlotDraft[]>(emptySlots);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminMotivationMedia,
    queryFn: async () => {
      const res = await adminApi.listMotivationMedia();
      return res.data.data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setMusicSlots(toSlots(data.music));
    setVideoSlots(toSlots(data.video));
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (mediaType: MotivationMediaType) => {
      const slots = mediaType === 'music' ? musicSlots : videoSlots;
      return adminApi.replaceMotivationMedia({
        mediaType,
        items: slots.map((slot, index) => ({
          id: slot.id,
          title: slot.title,
          mediaUrl: slot.mediaUrl,
          sortOrder: index,
          isSelected: slot.isSelected,
          isActive: true,
        })),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminMotivationMedia });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.motivationMedia });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const moveSlot = (
    mediaType: MotivationMediaType,
    index: number,
    direction: -1 | 1
  ) => {
    const setSlots = mediaType === 'music' ? setMusicSlots : setVideoSlots;
    setSlots((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const tmp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = tmp;
      return copy.map((slot, sortOrder) => ({ ...slot, sortOrder }));
    });
  };

  const updateSlot = (
    mediaType: MotivationMediaType,
    index: number,
    patch: Partial<SlotDraft>
  ) => {
    const setSlots = mediaType === 'music' ? setMusicSlots : setVideoSlots;
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, ...patch, sortOrder: i } : slot))
    );
  };

  const clearSlot = (mediaType: MotivationMediaType, index: number) => {
    updateSlot(mediaType, index, {
      id: undefined,
      title: '',
      mediaUrl: '',
      isSelected: false,
    });
  };

  if (isLoading) {
    return (
      <PageShell title={t('motivation.title')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  return (
    <PageShell title={t('motivation.title')} subtitle={t('motivation.subtitle')}>
      <MediaSection
        title={t('motivation.musicSection')}
        hint={t('motivation.musicHint')}
        slots={musicSlots}
        mediaType="music"
        saving={saveMutation.isPending && saveMutation.variables === 'music'}
        onChange={updateSlot}
        onMove={moveSlot}
        onClear={clearSlot}
        onSave={() => saveMutation.mutate('music')}
        labels={{
          title: t('motivation.fieldTitle'),
          url: t('motivation.fieldUrl'),
          upload: t('motivation.uploadFile'),
          uploading: t('motivation.uploading'),
          selected: t('motivation.includeInPlaylist'),
          up: t('motivation.moveUp'),
          down: t('motivation.moveDown'),
          clear: t('motivation.clear'),
          save: t('motivation.save'),
          order: t('motivation.order'),
        }}
      />

      <MediaSection
        title={t('motivation.videoSection')}
        hint={t('motivation.videoHint')}
        slots={videoSlots}
        mediaType="video"
        saving={saveMutation.isPending && saveMutation.variables === 'video'}
        onChange={updateSlot}
        onMove={moveSlot}
        onClear={clearSlot}
        onSave={() => saveMutation.mutate('video')}
        labels={{
          title: t('motivation.fieldTitle'),
          url: t('motivation.fieldUrl'),
          upload: t('motivation.uploadFile'),
          uploading: t('motivation.uploading'),
          selected: t('motivation.includeInPlaylist'),
          up: t('motivation.moveUp'),
          down: t('motivation.moveDown'),
          clear: t('motivation.clear'),
          save: t('motivation.save'),
          order: t('motivation.order'),
        }}
      />
    </PageShell>
  );
}

function MusicUploadField({
  uploadLabel,
  uploadingLabel,
  onUploaded,
}: {
  uploadLabel: string;
  uploadingLabel: string;
  onUploaded: (mediaUrl: string, suggestedTitle: string) => void;
}) {
  const { t } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [percent, setPercent] = useState<number | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadMotivationAudio(file, setPercent),
    onSuccess: (res, file) => {
      setPercent(null);
      const suggested = file.name.replace(/\.[^.]+$/, '').trim() || file.name;
      onUploaded(res.data.data.mediaUrl, suggested);
      showToast(t('motivation.uploadDone'), 'success');
    },
    onError: (error) => {
      setPercent(null);
      const code = getApiErrorCode(error);
      if (code === 'UNSUPPORTED_FILE_TYPE') {
        showToast(t('motivation.uploadUnsupported'), 'error');
        return;
      }
      if (code === 'FILE_TOO_LARGE') {
        showToast(t('motivation.uploadTooLarge'), 'error');
        return;
      }
      showToast(t('error'), 'error');
    },
  });

  return (
    <div className="admin-motivation__upload">
      <input
        ref={inputRef}
        type="file"
        accept={MOTIVATION_AUDIO_ACCEPT}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          if (!isAllowedMotivationAudioFile(file)) {
            showToast(t('motivation.uploadUnsupported'), 'error');
            return;
          }
          uploadMutation.mutate(file);
        }}
      />
      <button
        type="button"
        className="btn btn--secondary"
        disabled={uploadMutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {uploadMutation.isPending && percent != null
          ? `${uploadingLabel} ${percent}%`
          : uploadLabel}
      </button>
    </div>
  );
}

function MediaSection({
  title,
  hint,
  slots,
  mediaType,
  saving,
  onChange,
  onMove,
  onClear,
  onSave,
  labels,
}: {
  title: string;
  hint: string;
  slots: SlotDraft[];
  mediaType: MotivationMediaType;
  saving: boolean;
  onChange: (mediaType: MotivationMediaType, index: number, patch: Partial<SlotDraft>) => void;
  onMove: (mediaType: MotivationMediaType, index: number, direction: -1 | 1) => void;
  onClear: (mediaType: MotivationMediaType, index: number) => void;
  onSave: () => void;
  labels: {
    title: string;
    url: string;
    upload: string;
    uploading: string;
    selected: string;
    up: string;
    down: string;
    clear: string;
    save: string;
    order: string;
  };
}) {
  return (
    <section className="admin-motivation" style={{ marginBottom: '1.75rem' }}>
      <header style={{ marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p className="admin-table__meta" style={{ marginTop: '0.35rem' }}>
          {hint}
        </p>
      </header>

      <div className="admin-table">
        {slots.map((slot, index) => (
          <div key={`${mediaType}-${index}`} className="card admin-table__row admin-motivation__row">
            <div className="admin-motivation__order">
              <strong>
                {labels.order} {index + 1}
              </strong>
              <div className="admin-motivation__order-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={index === 0}
                  onClick={() => onMove(mediaType, index, -1)}
                >
                  {labels.up}
                </button>
                <button
                  type="button"
                  className="btn btn--secondary"
                  disabled={index === slots.length - 1}
                  onClick={() => onMove(mediaType, index, 1)}
                >
                  {labels.down}
                </button>
              </div>
            </div>

            <div className="admin-motivation__fields">
              <label className="form-field">
                <span>{labels.title}</span>
                <input
                  className="input"
                  value={slot.title}
                  onChange={(e) => onChange(mediaType, index, { title: e.target.value })}
                />
              </label>
              <label className="form-field">
                <span>{labels.url}</span>
                <input
                  className="input"
                  value={slot.mediaUrl}
                  onChange={(e) => onChange(mediaType, index, { mediaUrl: e.target.value })}
                  placeholder={mediaType === 'video' ? 'https://youtu.be/…' : 'https://…/track.mp3'}
                />
              </label>
              {mediaType === 'music' ? (
                <MusicUploadField
                  uploadLabel={labels.upload}
                  uploadingLabel={labels.uploading}
                  onUploaded={(mediaUrl, suggestedTitle) => {
                    onChange(mediaType, index, {
                      mediaUrl,
                      title: slot.title.trim() || suggestedTitle,
                    });
                  }}
                />
              ) : null}
              <label className="admin-motivation__check">
                <input
                  type="checkbox"
                  checked={slot.isSelected}
                  onChange={(e) => onChange(mediaType, index, { isSelected: e.target.checked })}
                />
                <span>{labels.selected}</span>
              </label>
            </div>

            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onClear(mediaType, index)}
            >
              {labels.clear}
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn--primary"
        style={{ marginTop: '0.75rem' }}
        disabled={saving}
        onClick={onSave}
      >
        {labels.save}
      </button>
    </section>
  );
}
