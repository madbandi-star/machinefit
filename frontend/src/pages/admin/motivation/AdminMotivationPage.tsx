import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  MOTIVATION_MEDIA_MAX_SLOTS,
  MOTIVATION_MEDIA_MAX_SORT_ORDER,
  type MotivationMediaItem,
  type MotivationMediaType,
} from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
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
  coverImageUrl: string;
  sortOrder: number;
  isSelected: boolean;
}

function emptySlots(): SlotDraft[] {
  return Array.from({ length: MOTIVATION_MEDIA_MAX_SLOTS }, (_, index) => ({
    title: '',
    mediaUrl: '',
    coverImageUrl: '',
    sortOrder: index,
    isSelected: false,
  }));
}

function toSlots(items: MotivationMediaItem[]): SlotDraft[] {
  const slots = emptySlots();
  for (const item of items) {
    const index = Math.min(Math.max(item.sortOrder, 0), MOTIVATION_MEDIA_MAX_SORT_ORDER);
    slots[index] = {
      id: item.id,
      title: item.title,
      mediaUrl: item.mediaUrl,
      coverImageUrl: item.coverImageUrl ?? '',
      sortOrder: index,
      isSelected: item.isSelected,
    };
  }
  return slots;
}

function filledCount(slots: SlotDraft[]): number {
  return slots.filter((s) => s.title.trim() || s.mediaUrl.trim()).length;
}

function selectedCount(slots: SlotDraft[]): number {
  return slots.filter((s) => s.isSelected && (s.title.trim() || s.mediaUrl.trim())).length;
}

export function AdminMotivationPage() {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [musicDraft, setMusicDraft] = useState<SlotDraft[] | null>(null);
  const [videoDraft, setVideoDraft] = useState<SlotDraft[] | null>(null);
  const [activeTab, setActiveTab] = useState<MotivationMediaType>('music');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.adminMotivationMedia,
    queryFn: async () => {
      const res = await adminApi.listMotivationMedia();
      return res.data.data;
    },
  });

  const musicBaseline = useMemo(() => toSlots(data?.music ?? []), [data?.music]);
  const videoBaseline = useMemo(() => toSlots(data?.video ?? []), [data?.video]);
  const musicSlots = musicDraft ?? musicBaseline;
  const videoSlots = videoDraft ?? videoBaseline;

  const saveMutation = useMutation({
    mutationFn: async (mediaType: MotivationMediaType) => {
      const slots = mediaType === 'music' ? musicSlots : videoSlots;
      return adminApi.replaceMotivationMedia({
        mediaType,
        items: slots.map((slot, index) => ({
          id: slot.id,
          title: slot.title,
          mediaUrl: slot.mediaUrl,
          coverImageUrl: mediaType === 'music' ? slot.coverImageUrl || null : null,
          sortOrder: index,
          isSelected: slot.isSelected,
          isActive: true,
        })),
      });
    },
    onSuccess: async (_res, mediaType) => {
      if (mediaType === 'music') setMusicDraft(null);
      else setVideoDraft(null);
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
    const setDraft = mediaType === 'music' ? setMusicDraft : setVideoDraft;
    const baseline = mediaType === 'music' ? musicBaseline : videoBaseline;
    setDraft((prev) => {
      const current = prev ?? baseline;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return prev;
      const copy = [...current];
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
    const setDraft = mediaType === 'music' ? setMusicDraft : setVideoDraft;
    const baseline = mediaType === 'music' ? musicBaseline : videoBaseline;
    setDraft((prev) => {
      const current = prev ?? baseline;
      return current.map((slot, i) =>
        i === index ? { ...slot, ...patch, sortOrder: i } : slot
      );
    });
  };

  const clearSlot = (mediaType: MotivationMediaType, index: number) => {
    updateSlot(mediaType, index, {
      id: undefined,
      title: '',
      mediaUrl: '',
      coverImageUrl: '',
      isSelected: false,
    });
  };

  const musicFilled = useMemo(() => filledCount(musicSlots), [musicSlots]);
  const videoFilled = useMemo(() => filledCount(videoSlots), [videoSlots]);
  const musicSelected = useMemo(() => selectedCount(musicSlots), [musicSlots]);
  const videoSelected = useMemo(() => selectedCount(videoSlots), [videoSlots]);

  if (isLoading) {
    return (
      <AdminPageShell title={t('motivation.title')} subtitle={t('motivation.subtitle')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell title={t('motivation.title')} subtitle={t('motivation.subtitle')}>
      <div className="moti-board">
        <div className="moti-board__summary" role="status">
          <div className="moti-stat">
            <span className="moti-stat__label">{t('motivation.musicSection')}</span>
            <strong className="moti-stat__value">
              {musicFilled}/{MOTIVATION_MEDIA_MAX_SLOTS}
            </strong>
            <span className="moti-stat__meta">
              {t('motivation.playlistCount', { count: musicSelected })}
            </span>
          </div>
          <div className="moti-stat">
            <span className="moti-stat__label">{t('motivation.videoSection')}</span>
            <strong className="moti-stat__value">
              {videoFilled}/{MOTIVATION_MEDIA_MAX_SLOTS}
            </strong>
            <span className="moti-stat__meta">
              {t('motivation.playlistCount', { count: videoSelected })}
            </span>
          </div>
        </div>

        <div className="moti-board__tabs" role="tablist" aria-label={t('motivation.title')}>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'music'}
            className={`moti-tab${activeTab === 'music' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('music')}
          >
            {t('motivation.musicSection')}
            <span className="moti-tab__count">{musicFilled}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'video'}
            className={`moti-tab${activeTab === 'video' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('video')}
          >
            {t('motivation.videoSection')}
            <span className="moti-tab__count">{videoFilled}</span>
          </button>
        </div>

        <div className="moti-board__grid">
          <MediaSection
            hidden={activeTab !== 'music'}
            title={t('motivation.musicSection')}
            hint={t('motivation.musicHint')}
            slots={musicSlots}
            mediaType="music"
            filled={musicFilled}
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
              cover: t('motivation.coverUpload'),
              clearCover: t('motivation.coverClear'),
              selected: t('motivation.includeInPlaylist'),
              selectedShort: t('motivation.playlistShort'),
              up: t('motivation.moveUp'),
              down: t('motivation.moveDown'),
              clear: t('motivation.clear'),
              save: t('motivation.save'),
              order: t('motivation.order'),
              slotHint: t('motivation.slotHint', { max: MOTIVATION_MEDIA_MAX_SLOTS }),
            }}
          />

          <MediaSection
            hidden={activeTab !== 'video'}
            title={t('motivation.videoSection')}
            hint={t('motivation.videoHint')}
            slots={videoSlots}
            mediaType="video"
            filled={videoFilled}
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
              cover: t('motivation.coverUpload'),
              clearCover: t('motivation.coverClear'),
              selected: t('motivation.includeInPlaylist'),
              selectedShort: t('motivation.playlistShort'),
              up: t('motivation.moveUp'),
              down: t('motivation.moveDown'),
              clear: t('motivation.clear'),
              save: t('motivation.save'),
              order: t('motivation.order'),
              slotHint: t('motivation.slotHint', { max: MOTIVATION_MEDIA_MAX_SLOTS }),
            }}
          />
        </div>
      </div>
    </AdminPageShell>
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
    <>
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
        className="moti-icon-btn"
        title={uploadLabel}
        aria-label={
          uploadMutation.isPending && percent != null
            ? `${uploadingLabel} ${percent}%`
            : uploadLabel
        }
        disabled={uploadMutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {uploadMutation.isPending && percent != null ? `${percent}%` : '↑'}
      </button>
    </>
  );
}

function CoverUploadField({
  coverUrl,
  uploadLabel,
  clearLabel,
  onUploaded,
  onClear,
}: {
  coverUrl: string;
  uploadLabel: string;
  clearLabel: string;
  onUploaded: (coverImageUrl: string) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminApi.uploadMotivationCover(file),
    onSuccess: (res) => {
      onUploaded(res.data.data.coverImageUrl);
      showToast(t('motivation.coverUploadDone'), 'success');
    },
    onError: (error) => {
      const code = getApiErrorCode(error);
      if (code === 'UNSUPPORTED_FILE_TYPE') {
        showToast(t('motivation.coverUnsupported'), 'error');
        return;
      }
      if (code === 'FILE_TOO_LARGE' || code === 'INVALID_IMAGE') {
        showToast(t('motivation.coverTooLarge'), 'error');
        return;
      }
      showToast(t('error'), 'error');
    },
  });

  return (
    <div className="moti-cover">
      {coverUrl ? (
        <img src={coverUrl} alt="" className="moti-cover__thumb" />
      ) : (
        <span className="moti-cover__placeholder" aria-hidden="true">
          ▢
        </span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          uploadMutation.mutate(file);
        }}
      />
      <button
        type="button"
        className="moti-icon-btn"
        title={uploadLabel}
        aria-label={uploadLabel}
        disabled={uploadMutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {uploadMutation.isPending ? '…' : '🖼'}
      </button>
      {coverUrl ? (
        <button
          type="button"
          className="moti-icon-btn moti-icon-btn--ghost"
          title={clearLabel}
          aria-label={clearLabel}
          onClick={onClear}
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

function MediaSection({
  hidden,
  title,
  hint,
  slots,
  mediaType,
  filled,
  saving,
  onChange,
  onMove,
  onClear,
  onSave,
  labels,
}: {
  hidden: boolean;
  title: string;
  hint: string;
  slots: SlotDraft[];
  mediaType: MotivationMediaType;
  filled: number;
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
    cover: string;
    clearCover: string;
    selected: string;
    selectedShort: string;
    up: string;
    down: string;
    clear: string;
    save: string;
    order: string;
    slotHint: string;
  };
}) {
  return (
    <section
      className={`moti-panel${hidden ? ' is-hidden-mobile' : ''}`}
      aria-hidden={hidden}
      data-type={mediaType}
    >
      <header className="moti-panel__head">
        <div>
          <h3 className="moti-panel__title">{title}</h3>
          <p className="moti-panel__hint">{hint}</p>
        </div>
        <div className="moti-panel__meta">
          <span className="moti-pill">
            {filled}/{MOTIVATION_MEDIA_MAX_SLOTS}
          </span>
          <button
            type="button"
            className="btn btn--primary moti-panel__save"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? '…' : labels.save}
          </button>
        </div>
      </header>

      <div className="moti-list" role="list">
        <div
          className={`moti-list__head${mediaType === 'music' ? ' moti-list__head--music' : ''}`}
          aria-hidden="true"
        >
          <span>{labels.order}</span>
          {mediaType === 'music' ? <span>{labels.cover}</span> : null}
          <span>{labels.title}</span>
          <span>{labels.url}</span>
          <span>{labels.selectedShort}</span>
          <span />
        </div>

        {slots.map((slot, index) => {
          const occupied = Boolean(slot.title.trim() || slot.mediaUrl.trim());
          return (
            <div
              key={`${mediaType}-${index}`}
              role="listitem"
              className={`moti-row${mediaType === 'music' ? ' moti-row--music' : ''}${
                occupied ? ' is-filled' : ''
              }${slot.isSelected ? ' is-on' : ''}`}
            >
              <div className="moti-row__order">
                <span className="moti-row__num">{index + 1}</span>
                <div className="moti-row__move">
                  <button
                    type="button"
                    className="moti-icon-btn"
                    disabled={index === 0}
                    aria-label={labels.up}
                    title={labels.up}
                    onClick={() => onMove(mediaType, index, -1)}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className="moti-icon-btn"
                    disabled={index === slots.length - 1}
                    aria-label={labels.down}
                    title={labels.down}
                    onClick={() => onMove(mediaType, index, 1)}
                  >
                    ▼
                  </button>
                </div>
              </div>

              {mediaType === 'music' ? (
                <CoverUploadField
                  coverUrl={slot.coverImageUrl}
                  uploadLabel={labels.cover}
                  clearLabel={labels.clearCover}
                  onUploaded={(coverImageUrl) => onChange(mediaType, index, { coverImageUrl })}
                  onClear={() => onChange(mediaType, index, { coverImageUrl: '' })}
                />
              ) : null}

              <label className="moti-row__field">
                <span className="visually-hidden">{labels.title}</span>
                <input
                  className="moti-input"
                  value={slot.title}
                  placeholder={labels.title}
                  onChange={(e) => onChange(mediaType, index, { title: e.target.value })}
                />
              </label>

              <label className="moti-row__field moti-row__field--url">
                <span className="visually-hidden">{labels.url}</span>
                <input
                  className="moti-input"
                  value={slot.mediaUrl}
                  placeholder={
                    mediaType === 'video' ? 'https://youtu.be/…' : 'https://…/track.mp3'
                  }
                  onChange={(e) => onChange(mediaType, index, { mediaUrl: e.target.value })}
                />
              </label>

              <label className="moti-row__check" title={labels.selected}>
                <input
                  type="checkbox"
                  checked={slot.isSelected}
                  onChange={(e) => onChange(mediaType, index, { isSelected: e.target.checked })}
                />
                <span>{labels.selectedShort}</span>
              </label>

              <div className="moti-row__actions">
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
                <button
                  type="button"
                  className="moti-icon-btn moti-icon-btn--ghost"
                  aria-label={labels.clear}
                  title={labels.clear}
                  disabled={!occupied && !slot.coverImageUrl}
                  onClick={() => onClear(mediaType, index)}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="moti-panel__foot">{labels.slotHint}</p>
    </section>
  );
}
