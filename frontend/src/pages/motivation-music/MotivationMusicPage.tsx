import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { UserMotivationTrack } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { userMotivationTrackApi, type MotivationUploadProgress } from '@/api/user-motivation-track.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import {
  MOTIVATION_AUDIO_ACCEPT,
  formatBytes,
  formatDuration,
  formatUploadDate,
  getApiErrorCode,
  isAllowedMotivationAudioFile,
  readAudioDurationSeconds,
} from '@/utils/motivationAudio';
import '@/styles/motivation-music.css';

export function MotivationMusicPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);

  const [urlTitle, setUrlTitle] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [urlAsDefault, setUrlAsDefault] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<MotivationUploadProgress | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const listQuery = useQuery({
    queryKey: QUERY_KEYS.userMotivationTracks,
    queryFn: async () => (await userMotivationTrackApi.list()).data.data,
  });

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userMotivationTracks });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.motivationMedia });
  }, [queryClient]);

  const mapError = useCallback(
    (error: unknown) => {
      const code = getApiErrorCode(error);
      if (code === 'UNSUPPORTED_FILE_TYPE') return t('motivationMusic.errors.unsupportedType');
      if (code === 'FILE_TOO_LARGE') return t('motivationMusic.errors.tooLarge');
      if (code === 'TRACK_LIMIT') return t('motivationMusic.errors.trackLimit');
      if (code === 'UPLOAD_FAILED' || code === 'STORAGE_ERROR') {
        return t('motivationMusic.errors.uploadFailed');
      }
      if ((error as { code?: string })?.code === 'ERR_NETWORK') {
        return t('motivationMusic.errors.network');
      }
      return t('motivationMusic.errors.generic');
    },
    [t]
  );

  const urlMutation = useMutation({
    mutationFn: () =>
      userMotivationTrackApi.createFromUrl({
        title: urlTitle.trim(),
        mediaUrl: urlValue.trim(),
        setAsDefault: urlAsDefault,
      }),
    onSuccess: async () => {
      setUrlTitle('');
      setUrlValue('');
      setUrlAsDefault(false);
      await invalidate();
      showToast(t('motivationMusic.toasts.urlAdded'), 'success');
    },
    onError: (error) => showToast(mapError(error), 'error'),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const durationSeconds = await readAudioDurationSeconds(file);
      return userMotivationTrackApi.upload(file, {
        durationSeconds,
        setAsDefault: listQuery.data?.items.length === 0,
        onProgress: setUploadProgress,
      });
    },
    onSuccess: async () => {
      setUploadProgress(null);
      await invalidate();
      showToast(t('motivationMusic.toasts.uploadDone'), 'success');
    },
    onError: (error) => {
      setUploadProgress(null);
      showToast(mapError(error), 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: string } & Parameters<typeof userMotivationTrackApi.update>[1]) =>
      userMotivationTrackApi.update(id, body),
    onSuccess: async () => {
      setRenamingId(null);
      await invalidate();
      showToast(t('motivationMusic.toasts.saved'), 'success');
    },
    onError: (error) => showToast(mapError(error), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userMotivationTrackApi.remove(id),
    onSuccess: async (_data, id) => {
      if (previewId === id) {
        previewAudioRef.current?.pause();
        setPreviewId(null);
        setPreviewPlaying(false);
      }
      await invalidate();
      showToast(t('motivationMusic.toasts.deleted'), 'success');
    },
    onError: (error) => showToast(mapError(error), 'error'),
  });

  const maxBytes = listQuery.data?.limits.maxBytes ?? 20 * 1024 * 1024;

  const handleFiles = (files: FileList | File[] | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!isAllowedMotivationAudioFile(file)) {
      showToast(t('motivationMusic.errors.unsupportedType'), 'error');
      return;
    }
    if (file.size > maxBytes) {
      showToast(t('motivationMusic.errors.tooLarge'), 'error');
      return;
    }
    uploadMutation.mutate(file);
  };

  const previewTrack = useMemo(
    () => listQuery.data?.items.find((item) => item.id === previewId) ?? null,
    [listQuery.data?.items, previewId]
  );

  useEffect(() => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (!previewTrack || !previewPlaying) {
      audio.pause();
      return;
    }
    if (audio.src !== previewTrack.mediaUrl) {
      audio.src = previewTrack.mediaUrl;
    }
    void audio.play().catch(() => {
      setPreviewPlaying(false);
      showToast(t('motivation.playFailed'), 'error');
    });
  }, [previewTrack, previewPlaying, showToast, t]);

  const togglePreview = (track: UserMotivationTrack) => {
    if (previewId === track.id && previewPlaying) {
      setPreviewPlaying(false);
      return;
    }
    setPreviewId(track.id);
    setPreviewPlaying(true);
  };

  if (listQuery.isLoading) {
    return (
      <PageShell title={t('motivationMusic.title')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  const items = listQuery.data?.items ?? [];

  return (
    <PageShell title={t('motivationMusic.title')} subtitle={t('motivationMusic.subtitle')}>
      <audio
        ref={previewAudioRef}
        preload="none"
        onEnded={() => setPreviewPlaying(false)}
      />

      <section className="motivation-music-panel">
        <h2 className="motivation-music-panel__title">{t('motivationMusic.urlSection')}</h2>
        <p className="motivation-music-panel__desc">{t('motivationMusic.urlHint')}</p>
        <div className="motivation-music-form">
          <label className="form-field">
            <span>{t('motivationMusic.fields.title')}</span>
            <input
              className="input"
              value={urlTitle}
              onChange={(e) => setUrlTitle(e.target.value)}
              placeholder={t('motivationMusic.fields.titlePlaceholder')}
            />
          </label>
          <label className="form-field">
            <span>{t('motivationMusic.fields.url')}</span>
            <input
              className="input"
              value={urlValue}
              onChange={(e) => setUrlValue(e.target.value)}
              placeholder="https://…/track.mp3"
              inputMode="url"
            />
          </label>
          <label className="motivation-music-check">
            <input
              type="checkbox"
              checked={urlAsDefault}
              onChange={(e) => setUrlAsDefault(e.target.checked)}
            />
            <span>{t('motivationMusic.fields.setDefault')}</span>
          </label>
          <button
            type="button"
            className="btn btn--primary"
            disabled={urlMutation.isPending || !urlTitle.trim() || !urlValue.trim()}
            onClick={() => urlMutation.mutate()}
          >
            {t('motivationMusic.actions.addUrl')}
          </button>
        </div>
      </section>

      <div className="motivation-music-or" role="separator">
        <span>{t('motivationMusic.or')}</span>
      </div>

      <section className="motivation-music-panel">
        <h2 className="motivation-music-panel__title">{t('motivationMusic.uploadSection')}</h2>
        <p className="motivation-music-panel__desc">{t('motivationMusic.uploadHint')}</p>

        <div
          className={`motivation-music-drop${dragOver ? ' is-dragover' : ''}${uploadMutation.isPending ? ' is-busy' : ''}`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFiles(e.dataTransfer.files);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={MOTIVATION_AUDIO_ACCEPT}
            className="motivation-music-drop__input"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <p className="motivation-music-drop__icon" aria-hidden="true">
            📁
          </p>
          <p className="motivation-music-drop__title">{t('motivationMusic.pickFile')}</p>
          <p className="motivation-music-drop__meta">
            {t('motivationMusic.formats', {
              maxMb: Math.round(maxBytes / (1024 * 1024)),
            })}
          </p>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {t('motivationMusic.actions.chooseFile')}
          </button>
        </div>

        {uploadProgress ? (
          <div className="motivation-music-progress" aria-live="polite">
            <div className="motivation-music-progress__bar">
              <span style={{ width: `${uploadProgress.percent}%` }} />
            </div>
            <p className="motivation-music-progress__meta">
              {t('motivationMusic.uploading', {
                percent: uploadProgress.percent,
                remaining:
                  uploadProgress.remainingSeconds == null
                    ? t('motivationMusic.remainingUnknown')
                    : t('motivationMusic.remainingSeconds', {
                        count: uploadProgress.remainingSeconds,
                      }),
              })}
            </p>
          </div>
        ) : null}
      </section>

      <section className="motivation-music-panel">
        <h2 className="motivation-music-panel__title">{t('motivationMusic.libraryTitle')}</h2>
        <p className="motivation-music-panel__desc">
          {t('motivationMusic.libraryDesc', { count: items.length })}
        </p>

        {items.length === 0 ? (
          <p className="motivation-music-empty">{t('motivationMusic.empty')}</p>
        ) : (
          <ul className="motivation-music-list">
            {items.map((track) => {
              const isPreview = previewId === track.id && previewPlaying;
              const isRenaming = renamingId === track.id;
              return (
                <li key={track.id} className="motivation-music-item">
                  <div className="motivation-music-item__main">
                    {isRenaming ? (
                      <input
                        className="input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div className="motivation-music-item__title-row">
                        <strong>{track.title}</strong>
                        {track.isDefault ? (
                          <span className="motivation-music-badge">
                            {t('motivationMusic.defaultBadge')}
                          </span>
                        ) : null}
                      </div>
                    )}
                    <p className="motivation-music-item__meta">
                      {track.originalFilename || t(`motivationMusic.source.${track.sourceType}`)}
                      {' · '}
                      {formatDuration(track.durationSeconds)}
                      {' · '}
                      {formatBytes(track.fileSizeBytes)}
                      {' · '}
                      {formatUploadDate(track.createdAt, i18n.language)}
                    </p>
                  </div>

                  <div className="motivation-music-item__actions">
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => togglePreview(track)}
                    >
                      {isPreview
                        ? t('motivationMusic.actions.pause')
                        : t('motivationMusic.actions.play')}
                    </button>
                    {isRenaming ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--primary"
                          disabled={!renameValue.trim() || updateMutation.isPending}
                          onClick={() =>
                            updateMutation.mutate({
                              id: track.id,
                              title: renameValue.trim(),
                            })
                          }
                        >
                          {t('actions.save')}
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() => setRenamingId(null)}
                        >
                          {t('actions.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          onClick={() => {
                            setRenamingId(track.id);
                            setRenameValue(track.title);
                          }}
                        >
                          {t('motivationMusic.actions.rename')}
                        </button>
                        {!track.isDefault ? (
                          <button
                            type="button"
                            className="btn btn--ghost"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              updateMutation.mutate({ id: track.id, isDefault: true })
                            }
                          >
                            {t('motivationMusic.actions.setDefault')}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="btn btn--ghost"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm(t('motivationMusic.confirmDelete'))) {
                              deleteMutation.mutate(track.id);
                            }
                          }}
                        >
                          {t('motivationMusic.actions.delete')}
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
