import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Film, ListMusic, Music2, Pause, Play, Square, X } from 'lucide-react';
import type { MotivationMediaItem } from '@machinefit/shared';
import { motivationMediaApi, userMotivationTrackApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { formatDuration, isBenignAudioPlayError, playHtmlAudio, sameMediaUrl } from '@/utils/motivationAudio';
import './MotivationMediaControls.css';

export function MotivationMediaControls({
  variant = 'default',
}: {
  variant?: 'default' | 'bundle';
}) {
  const { t } = useTranslation('common');
  const showToast = useUIStore((s) => s.showToast);
  const isAuthed = useAuthStore((s) => Boolean(s.tokens?.accessToken && s.user));
  const bundled = variant === 'bundle';
  const [mediaRequested, setMediaRequested] = useState(false);

  const requestMedia = () => {
    if (!mediaRequested) setMediaRequested(true);
  };

  const { data } = useQuery({
    queryKey: QUERY_KEYS.motivationMedia,
    queryFn: async () => {
      const res = await motivationMediaApi.playlist();
      return res.data.data;
    },
    enabled: mediaRequested,
    staleTime: 10 * 60_000,
  });

  const { data: myTracks } = useQuery({
    queryKey: QUERY_KEYS.userMotivationTracks,
    queryFn: async () => (await userMotivationTrackApi.list()).data.data,
    enabled: isAuthed && mediaRequested,
    staleTime: 5 * 60_000,
  });

  const catalogMusic = data?.music ?? [];
  const videos = data?.video ?? [];

  const music = useMemo(() => {
    // While the user library is still loading, keep catalog (or empty) so we don't
    // flash "empty" / play catalog then swap to uploads mid-play.
    if (isAuthed && mediaRequested && myTracks === undefined) {
      return catalogMusic;
    }

    const tracks = myTracks?.items ?? [];
    if (!tracks.length) return catalogMusic;

    // Prefer default first, then the rest of the user's library.
    const ordered = [
      ...tracks.filter((track) => track.isDefault),
      ...tracks.filter((track) => !track.isDefault),
    ];

    return ordered.map(
      (track): MotivationMediaItem => ({
        id: track.id,
        mediaType: 'music',
        title: track.title,
        mediaUrl: track.mediaUrl,
        youtubeId: null,
        sortOrder: 0,
        isSelected: true,
        isActive: true,
      })
    );
  }, [isAuthed, mediaRequested, myTracks, catalogMusic]);

  const [musicPanelOpen, setMusicPanelOpen] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [playAll, setPlayAll] = useState(false);
  const [musicIndex, setMusicIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const seekingRef = useRef(false);

  const [videoOpen, setVideoOpen] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);

  const safeMusicIndex = music.length > 0 ? Math.min(musicIndex, music.length - 1) : 0;
  const currentMusic = music[safeMusicIndex];
  const currentVideo = videos[videoIndex];
  const currentMusicUrl = currentMusic?.mediaUrl ?? '';

  useEffect(() => {
    if (musicIndex !== safeMusicIndex) setMusicIndex(safeMusicIndex);
  }, [musicIndex, safeMusicIndex]);

  const musicLabel = useMemo(() => {
    if (!music.length) return t('motivation.musicEmpty');
    if (musicPlaying && currentMusic) {
      return t('motivation.nowPlaying', { title: currentMusic.title });
    }
    return t('motivation.music');
  }, [music.length, musicPlaying, currentMusic, t]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!musicPlaying || !currentMusicUrl) {
      audio.pause();
      return;
    }

    const controller = new AbortController();

    const start = async () => {
      try {
        if (sameMediaUrl(audio.src, currentMusicUrl) && !audio.paused) {
          return;
        }
        if (!sameMediaUrl(audio.src, currentMusicUrl)) {
          setCurrentTime(0);
          setDuration(0);
        }
        await playHtmlAudio(audio, currentMusicUrl, { signal: controller.signal });
      } catch (error) {
        if (controller.signal.aborted || isBenignAudioPlayError(error)) return;
        setMusicPlaying(false);
        showToast(t('motivation.playFailed'), 'error');
      }
    };

    void start();
    return () => {
      controller.abort();
    };
  }, [musicPlaying, currentMusicUrl, showToast, t]);

  // Keep seek bar in sync with the audio element.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncDuration = () => {
      const next = Number.isFinite(audio.duration) ? audio.duration : 0;
      setDuration(next > 0 ? next : 0);
    };
    const syncTime = () => {
      if (seekingRef.current) return;
      setCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    };

    audio.addEventListener('loadedmetadata', syncDuration);
    audio.addEventListener('durationchange', syncDuration);
    audio.addEventListener('timeupdate', syncTime);
    audio.addEventListener('seeked', syncTime);
    syncDuration();
    syncTime();

    return () => {
      audio.removeEventListener('loadedmetadata', syncDuration);
      audio.removeEventListener('durationchange', syncDuration);
      audio.removeEventListener('timeupdate', syncTime);
      audio.removeEventListener('seeked', syncTime);
    };
  }, [currentMusicUrl]);

  // When panel opens on a selected track that isn't playing, load metadata for the seek bar.
  useEffect(() => {
    if (!musicPanelOpen || !currentMusicUrl || musicPlaying) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (sameMediaUrl(audio.src, currentMusicUrl)) return;
    audio.src = currentMusicUrl;
    audio.preload = 'metadata';
    audio.load();
    setCurrentTime(0);
    setDuration(0);
  }, [musicPanelOpen, currentMusicUrl, musicPlaying]);

  // Duck music while voice coach / rest TTS is active so counts stay audible.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onVoiceCoachAudio = (event: Event) => {
      const detail = (event as CustomEvent<{ active?: boolean; duckVolume?: number }>).detail;
      const active = Boolean(detail?.active);
      const duckVolume = typeof detail?.duckVolume === 'number' ? detail.duckVolume : 0.18;
      if (active) {
        if (audio.dataset.mfVoiceDuck == null) {
          audio.dataset.mfVoiceDuck = String(audio.volume);
        }
        audio.volume = duckVolume;
      } else if (audio.dataset.mfVoiceDuck != null) {
        const prev = Number(audio.dataset.mfVoiceDuck);
        audio.volume = Number.isFinite(prev) ? prev : 1;
        delete audio.dataset.mfVoiceDuck;
      }
    };

    window.addEventListener('machinefit:voice-coach-audio', onVoiceCoachAudio);
    return () => {
      window.removeEventListener('machinefit:voice-coach-audio', onVoiceCoachAudio);
      if (audio.dataset.mfVoiceDuck != null) {
        const prev = Number(audio.dataset.mfVoiceDuck);
        audio.volume = Number.isFinite(prev) ? prev : 1;
        delete audio.dataset.mfVoiceDuck;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!musicPanelOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setMusicPanelOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMusicPanelOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [musicPanelOpen]);

  const stopMusic = () => {
    setMusicPlaying(false);
    setPlayAll(false);
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setCurrentTime(0);
  };

  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const max = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : duration;
    const next = Math.min(Math.max(0, seconds), max > 0 ? max : seconds);
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const onSeekInput = (value: string) => {
    const next = Number(value);
    if (!Number.isFinite(next)) return;
    seekingRef.current = true;
    setCurrentTime(next);
  };

  const onSeekCommit = (value: string) => {
    const next = Number(value);
    seekingRef.current = false;
    if (!Number.isFinite(next)) return;
    seekTo(next);
  };

  const [pendingMusicAction, setPendingMusicAction] = useState<'play' | 'playAll' | 'panel' | null>(
    null
  );
  const [pendingVideoOpen, setPendingVideoOpen] = useState(false);
  const catalogReady = data !== undefined;
  const userTracksReady = !isAuthed || myTracks !== undefined;
  const mediaReady = mediaRequested && catalogReady && userTracksReady;
  const musicEmpty = mediaReady && music.length === 0;
  const videoEmpty = mediaReady && videos.length === 0;

  useEffect(() => {
    if (!pendingMusicAction || !mediaReady) return;
    if (musicEmpty) {
      showToast(t('motivation.musicEmpty'), 'info');
      setPendingMusicAction(null);
      return;
    }
    if (pendingMusicAction === 'panel') {
      setMusicPanelOpen(true);
    } else if (pendingMusicAction === 'playAll') {
      setPlayAll(true);
      setMusicIndex(0);
      setMusicPlaying(true);
    } else {
      setPlayAll(false);
      setMusicPlaying(true);
    }
    setPendingMusicAction(null);
  }, [pendingMusicAction, mediaReady, musicEmpty, showToast, t]);

  useEffect(() => {
    if (!pendingVideoOpen || !mediaReady) return;
    if (videoEmpty) {
      showToast(t('motivation.videoEmpty'), 'info');
      setPendingVideoOpen(false);
      return;
    }
    stopMusic();
    setMusicPanelOpen(false);
    setVideoIndex(0);
    setVideoOpen(true);
    setPendingVideoOpen(false);
  }, [pendingVideoOpen, mediaReady, videoEmpty, showToast, t]);

  const playSelected = () => {
    requestMedia();
    if (!mediaReady) {
      setPendingMusicAction('play');
      return;
    }
    if (musicEmpty) {
      showToast(t('motivation.musicEmpty'), 'info');
      return;
    }
    setPlayAll(false);
    setMusicPlaying(true);
  };

  const pauseMusic = () => {
    setMusicPlaying(false);
    audioRef.current?.pause();
  };

  const togglePlayPause = () => {
    if (musicPlaying) {
      pauseMusic();
      return;
    }
    playSelected();
  };

  const playAllTracks = () => {
    requestMedia();
    if (!mediaReady) {
      setPendingMusicAction('playAll');
      return;
    }
    if (musicEmpty) {
      showToast(t('motivation.musicEmpty'), 'info');
      return;
    }
    setPlayAll(true);
    setMusicIndex(0);
    setMusicPlaying(true);
  };

  const openMusicPanel = () => {
    requestMedia();
    if (musicPanelOpen) {
      setMusicPanelOpen(false);
      return;
    }
    if (!mediaReady) {
      setPendingMusicAction('panel');
      return;
    }
    if (musicEmpty) {
      showToast(t('motivation.musicEmpty'), 'info');
      return;
    }
    setMusicPanelOpen(true);
  };

  const selectTrack = (index: number) => {
    if (index === safeMusicIndex && musicPlaying) {
      pauseMusic();
      return;
    }
    setMusicIndex(index);
    setPlayAll(false);
    setMusicPlaying(true);
  };

  const onMusicEnded = () => {
    if (!playAll) {
      setMusicPlaying(false);
      return;
    }

    setMusicIndex((prev) => {
      const next = prev + 1;
      if (next >= music.length) {
        setMusicPlaying(false);
        setPlayAll(false);
        return 0;
      }
      return next;
    });
  };

  const toggleVideo = () => {
    if (videoOpen) {
      setVideoOpen(false);
      return;
    }
    requestMedia();
    if (!mediaReady) {
      setPendingVideoOpen(true);
      return;
    }
    if (videoEmpty) {
      showToast(t('motivation.videoEmpty'), 'info');
      return;
    }
    stopMusic();
    setMusicPanelOpen(false);
    setVideoIndex(0);
    setVideoOpen(true);
  };

  const closeVideo = () => setVideoOpen(false);

  const playNextVideo = () => {
    setVideoIndex((prev) => {
      const next = prev + 1;
      if (next >= videos.length) {
        setVideoOpen(false);
        return 0;
      }
      return next;
    });
  };

  return (
    <div
      ref={panelRef}
      className={`motivation-controls${bundled ? ' motivation-controls--bundle' : ''}`}
      onPointerEnter={requestMedia}
      onFocusCapture={requestMedia}
    >
      <audio ref={audioRef} preload="none" onEnded={onMusicEnded} />

      <button
        type="button"
        className={`motivation-controls__btn${musicPlaying || musicPanelOpen ? ' motivation-controls__btn--active' : ''}`}
        aria-label={musicLabel}
        title={musicLabel}
        aria-expanded={musicPanelOpen}
        aria-haspopup="dialog"
        onClick={openMusicPanel}
        disabled={musicEmpty}
      >
        <Music2 size={bundled ? 14 : 12} aria-hidden />
        {bundled ? null : musicPlaying ? <Pause size={11} aria-hidden /> : <Play size={11} aria-hidden />}
      </button>

      <button
        type="button"
        className={`motivation-controls__btn${videoOpen ? ' motivation-controls__btn--active' : ''}`}
        aria-label={t('motivation.video')}
        title={t('motivation.video')}
        onClick={toggleVideo}
        disabled={videoEmpty}
      >
        {bundled ? (
          <Film size={14} aria-hidden />
        ) : (
          <>
            <Film size={12} aria-hidden />
            {videoOpen ? <Pause size={11} aria-hidden /> : <Play size={11} aria-hidden />}
          </>
        )}
      </button>

      {musicPanelOpen ? (
        <div
          className={`mf-music-popover${musicPlaying ? ' mf-music-popover--playing' : ''}`}
          role="dialog"
          aria-label={t('motivation.musicPanelTitle')}
        >
          <div className="mf-music-popover__glow" aria-hidden="true" />

          <div className="mf-music-popover__top">
            <div className="mf-music-popover__brand">
              <span className="mf-music-popover__brand-mark" aria-hidden="true">
                <Music2 size={14} />
              </span>
              <div className="mf-music-popover__brand-copy">
                <p className="mf-music-popover__eyebrow">{t('motivation.musicPanelTitle')}</p>
                <p className="mf-music-popover__count">
                  {t('motivation.trackCount', { count: music.length })}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="mf-music-popover__close"
              aria-label={t('motivation.close')}
              onClick={() => setMusicPanelOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="mf-music-popover__now">
            <div
              className={`mf-music-popover__art${musicPlaying ? ' is-playing' : ''}`}
              aria-hidden="true"
            >
              <Music2 size={22} />
              <span className="mf-music-popover__eq">
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>
            <div className="mf-music-popover__meta">
              <p className="mf-music-popover__status">
                {musicPlaying
                  ? playAll
                    ? t('motivation.playAllMode')
                    : t('motivation.playing')
                  : t('motivation.ready')}
              </p>
              <p className="mf-music-popover__title" title={currentMusic?.title}>
                {currentMusic?.title ?? t('motivation.musicEmpty')}
              </p>
            </div>
          </div>

          <div className="mf-music-popover__progress">
            <input
              type="range"
              className="mf-music-popover__seek"
              min={0}
              max={duration > 0 ? duration : 1}
              step={0.1}
              value={duration > 0 ? Math.min(currentTime, duration) : 0}
              disabled={!currentMusic || duration <= 0}
              aria-label={t('motivation.seek')}
              style={
                duration > 0
                  ? {
                      ['--seek-progress' as string]: `${Math.min(100, (currentTime / duration) * 100)}%`,
                    }
                  : undefined
              }
              onChange={(e) => onSeekInput(e.target.value)}
              onPointerUp={(e) => onSeekCommit((e.target as HTMLInputElement).value)}
              onKeyUp={(e) => {
                if (
                  e.key === 'ArrowLeft' ||
                  e.key === 'ArrowRight' ||
                  e.key === 'Home' ||
                  e.key === 'End'
                ) {
                  onSeekCommit((e.target as HTMLInputElement).value);
                }
              }}
            />
            <div className="mf-music-popover__times" aria-hidden="true">
              <span>{formatDuration(currentTime)}</span>
              <span>{duration > 0 ? formatDuration(duration) : t('motivation.timeUnknown')}</span>
            </div>
          </div>

          <div className="mf-music-popover__transport">
            <div className="mf-music-popover__main-actions">
              <button
                type="button"
                className={`mf-music-popover__btn mf-music-popover__btn--play${
                  musicPlaying ? ' is-playing' : ''
                }`}
                onClick={togglePlayPause}
                disabled={!music.length}
              >
                <span className="mf-music-popover__btn-icon" aria-hidden="true">
                  {musicPlaying ? <Pause size={18} /> : <Play size={18} />}
                </span>
                <span className="mf-music-popover__btn-label">
                  {musicPlaying ? t('motivation.pause') : t('motivation.play')}
                </span>
              </button>

              <button
                type="button"
                className="mf-music-popover__btn mf-music-popover__btn--stop"
                onClick={stopMusic}
                disabled={!musicPlaying && currentTime <= 0}
              >
                <span className="mf-music-popover__btn-icon" aria-hidden="true">
                  <Square size={15} fill="currentColor" />
                </span>
                <span className="mf-music-popover__btn-label">{t('motivation.stop')}</span>
              </button>
            </div>

            <button
              type="button"
              className={`mf-music-popover__play-all${playAll && musicPlaying ? ' is-active' : ''}`}
              onClick={playAllTracks}
              disabled={!music.length}
            >
              <ListMusic size={15} aria-hidden />
              <span>{t('motivation.playAll')}</span>
            </button>
          </div>

          <div className="mf-music-popover__playlist">
            <p className="mf-music-popover__playlist-label">{t('motivation.playlist')}</p>
            <ul className="mf-music-popover__list">
              {music.map((track, index) => {
                const selected = index === safeMusicIndex;
                const playingThis = selected && musicPlaying;
                return (
                  <li key={track.id}>
                    <button
                      type="button"
                      className={`mf-music-popover__track${selected ? ' is-selected' : ''}${
                        playingThis ? ' is-playing' : ''
                      }`}
                      onClick={() => selectTrack(index)}
                    >
                      <span className="mf-music-popover__track-index" aria-hidden="true">
                        {playingThis ? (
                          <span className="mf-music-popover__mini-eq">
                            <i />
                            <i />
                            <i />
                          </span>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="mf-music-popover__track-title">{track.title}</span>
                      <span className="mf-music-popover__track-action" aria-hidden="true">
                        {playingThis ? <Pause size={15} /> : <Play size={15} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      {videoOpen && currentVideo ? (
        <VideoOverlay
          item={currentVideo}
          index={videoIndex}
          total={videos.length}
          onClose={closeVideo}
          onNext={playNextVideo}
          nextLabel={t('motivation.next')}
          closeLabel={t('motivation.close')}
          titleLabel={t('motivation.video')}
        />
      ) : null}
    </div>
  );
}

function VideoOverlay({
  item,
  index,
  total,
  onClose,
  onNext,
  nextLabel,
  closeLabel,
  titleLabel,
}: {
  item: MotivationMediaItem;
  index: number;
  total: number;
  onClose: () => void;
  onNext: () => void;
  nextLabel: string;
  closeLabel: string;
  titleLabel: string;
}) {
  const embedId = item.youtubeId;
  const { t } = useTranslation('common');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="motivation-video" role="dialog" aria-modal="true" aria-label={titleLabel}>
      <div className="motivation-video__backdrop" onClick={onClose} />
      <div className="motivation-video__panel">
        <div className="motivation-video__header">
          <p className="motivation-video__title">
            {item.title}
            <span className="motivation-video__count">
              {index + 1}/{total}
            </span>
          </p>
          <button
            type="button"
            className="motivation-video__icon-btn"
            aria-label={closeLabel}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        <div className="motivation-video__frame">
          {embedId ? (
            <iframe
              key={embedId}
              title={item.title}
              src={`https://www.youtube.com/embed/${embedId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <p className="motivation-video__error">{t('motivation.playFailed')}</p>
          )}
        </div>
        {total > 1 ? (
          <div className="motivation-video__actions">
            <button type="button" className="btn btn--secondary" onClick={onNext}>
              {nextLabel}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
