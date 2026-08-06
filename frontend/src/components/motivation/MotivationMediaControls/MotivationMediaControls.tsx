import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  ChevronUp,
  Film,
  ListMusic,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Square,
  X,
} from 'lucide-react';
import type { MotivationMediaItem } from '@machinefit/shared';
import { motivationMediaApi, userMotivationTrackApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { formatDuration, isBenignAudioPlayError, playHtmlAudio, sameMediaUrl } from '@/utils/motivationAudio';
import {
  loadPlaylistOrder,
  loadShuffleEnabled,
  mergePlaylistOrder,
  movePlaylistIndex,
  pickNextIndex,
  pickPrevIndex,
  savePlaylistOrder,
  saveShuffleEnabled,
} from '@/utils/motivationPlaylistOrder';
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
  const userId = useAuthStore((s) => s.user?.id ?? '');
  const playlistScope = isAuthed && userId ? userId : 'catalog';

  const sourceMusic = useMemo(() => {
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
        coverImageUrl: track.coverImageUrl ?? null,
        sortOrder: 0,
        isSelected: true,
        isActive: true,
      })
    );
  }, [isAuthed, mediaRequested, myTracks, catalogMusic]);

  const [playlistOrder, setPlaylistOrder] = useState<string[]>(() =>
    loadPlaylistOrder(playlistScope)
  );
  const [shuffle, setShuffle] = useState(() => loadShuffleEnabled());

  useEffect(() => {
    setPlaylistOrder(loadPlaylistOrder(playlistScope));
  }, [playlistScope]);

  useEffect(() => {
    const ids = sourceMusic.map((track) => track.id);
    if (!ids.length) {
      setPlaylistOrder((prev) => (prev.length ? [] : prev));
      return;
    }
    setPlaylistOrder((prev) => {
      const saved = prev.length ? prev : loadPlaylistOrder(playlistScope);
      const next = mergePlaylistOrder(saved, ids);
      if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
        return prev;
      }
      savePlaylistOrder(playlistScope, next);
      return next;
    });
  }, [sourceMusic, playlistScope]);

  const music = useMemo(() => {
    if (!sourceMusic.length) return [];
    const byId = new Map(sourceMusic.map((track) => [track.id, track]));
    const ordered = playlistOrder
      .map((id) => byId.get(id))
      .filter((track): track is MotivationMediaItem => Boolean(track));
    if (ordered.length === sourceMusic.length) return ordered;
    // Fallback if order is stale mid-render.
    const orderedIds = new Set(ordered.map((t) => t.id));
    return [...ordered, ...sourceMusic.filter((t) => !orderedIds.has(t.id))];
  }, [sourceMusic, playlistOrder]);

  const [musicPanelOpen, setMusicPanelOpen] = useState(false);
  const [musicCompact, setMusicCompact] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [playAll, setPlayAll] = useState(false);
  const [musicIndex, setMusicIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const seekingRef = useRef(false);
  const musicRef = useRef(music);
  musicRef.current = music;
  const musicIndexRef = useRef(musicIndex);
  musicIndexRef.current = musicIndex;
  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;

  const [videoOpen, setVideoOpen] = useState(false);
  const [videoCompact, setVideoCompact] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);

  const safeMusicIndex = music.length > 0 ? Math.min(musicIndex, music.length - 1) : 0;
  const currentMusic = music[safeMusicIndex];
  const currentVideo = videos[videoIndex];
  const currentMusicUrl = currentMusic?.mediaUrl ?? '';
  const hasPrev =
    music.length > 1 &&
    (shuffle || safeMusicIndex > 0);
  const hasNext =
    music.length > 1 &&
    (shuffle || safeMusicIndex < music.length - 1);

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
    setMusicCompact(false);
  };

  const selectTrack = (index: number) => {
    if (index === safeMusicIndex && musicPlaying) {
      pauseMusic();
      return;
    }
    setMusicIndex(index);
    setMusicPlaying(true);
  };

  const goToAdjacentTrack = (direction: 'next' | 'prev') => {
    const list = musicRef.current;
    const current = Math.min(musicIndexRef.current, Math.max(0, list.length - 1));
    const nextIndex =
      direction === 'next'
        ? pickNextIndex({ length: list.length, current, shuffle: shuffleRef.current })
        : pickPrevIndex({ length: list.length, current, shuffle: shuffleRef.current });
    if (nextIndex == null) {
      setMusicPlaying(false);
      setPlayAll(false);
      return;
    }
    setMusicIndex(nextIndex);
    setMusicPlaying(true);
  };

  const playNextTrack = () => goToAdjacentTrack('next');
  const playPrevTrack = () => goToAdjacentTrack('prev');

  const onMusicEnded = () => {
    // Auto-advance when another track follows (sequential or shuffle).
    const list = musicRef.current;
    const current = Math.min(musicIndexRef.current, Math.max(0, list.length - 1));
    const nextIndex = pickNextIndex({
      length: list.length,
      current,
      shuffle: shuffleRef.current,
    });
    if (nextIndex == null) {
      setMusicPlaying(false);
      setPlayAll(false);
      return;
    }
    setMusicIndex(nextIndex);
    setMusicPlaying(true);
  };

  const toggleShuffle = () => {
    setShuffle((prev) => {
      const next = !prev;
      saveShuffleEnabled(next);
      return next;
    });
  };

  const moveTrack = (fromIndex: number, delta: -1 | 1) => {
    const toIndex = fromIndex + delta;
    setPlaylistOrder((prev) => {
      const next = movePlaylistIndex(prev, fromIndex, toIndex);
      if (next === prev) return prev;
      savePlaylistOrder(playlistScope, next);
      setMusicIndex((current) => {
        if (current === fromIndex) return toIndex;
        if (delta < 0 && current === toIndex) return fromIndex;
        if (delta > 0 && current === toIndex) return fromIndex;
        return current;
      });
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
    setVideoCompact(false);
  };

  const closeVideo = () => {
    setVideoOpen(false);
    setVideoCompact(false);
  };

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

      {musicPanelOpen && musicCompact ? (
        <div className="mf-music-mini" role="dialog" aria-label={t('motivation.musicPanelTitle')}>
          <div className="mf-music-mini__art" aria-hidden="true">
            <Music2 size={14} />
          </div>
          <div className="mf-music-mini__meta">
            <p className="mf-music-mini__title" title={currentMusic?.title}>
              {currentMusic?.title ?? t('motivation.musicEmpty')}
            </p>
            <p className="mf-music-mini__status">
              {musicPlaying ? t('motivation.playing') : t('motivation.ready')}
            </p>
          </div>
          <button
            type="button"
            className="mf-music-mini__btn"
            onClick={togglePlayPause}
            aria-label={musicPlaying ? t('motivation.pause') : t('motivation.play')}
          >
            {musicPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            className="mf-music-mini__btn"
            onClick={() => setMusicCompact(false)}
            aria-label={t('motivation.expandMode')}
          >
            <Maximize2 size={14} />
          </button>
          <button
            type="button"
            className="mf-music-mini__btn"
            onClick={() => setMusicPanelOpen(false)}
            aria-label={t('motivation.close')}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}

      {musicPanelOpen && !musicCompact ? (
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
            <div className="mf-music-popover__top-actions">
              <button
                type="button"
                className="mf-music-popover__close"
                aria-label={t('motivation.compactMode')}
                onClick={() => setMusicCompact(true)}
              >
                <Minimize2 size={16} />
              </button>
              <button
                type="button"
                className="mf-music-popover__close"
                aria-label={t('motivation.close')}
                onClick={() => setMusicPanelOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="mf-music-popover__now">
            <div
              className={`mf-music-popover__art${musicPlaying ? ' is-playing' : ''}${
                currentMusic?.coverImageUrl ? ' has-cover' : ''
              }`}
              aria-hidden="true"
            >
              {currentMusic?.coverImageUrl ? (
                <img
                  className="mf-music-popover__cover"
                  src={currentMusic.coverImageUrl}
                  alt=""
                />
              ) : (
                <Music2 size={22} />
              )}
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
                  ? shuffle
                    ? t('motivation.shuffleMode')
                    : playAll
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
            <div className="mf-music-popover__skip-row">
              <button
                type="button"
                className="mf-music-popover__icon-btn"
                onClick={playPrevTrack}
                disabled={!hasPrev}
                aria-label={t('motivation.prev')}
                title={t('motivation.prev')}
              >
                <SkipBack size={16} />
              </button>
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
                className="mf-music-popover__icon-btn"
                onClick={playNextTrack}
                disabled={!hasNext}
                aria-label={t('motivation.nextTrack')}
                title={t('motivation.nextTrack')}
              >
                <SkipForward size={16} />
              </button>
            </div>

            <div className="mf-music-popover__main-actions">
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
              <button
                type="button"
                className={`mf-music-popover__btn mf-music-popover__btn--shuffle${
                  shuffle ? ' is-active' : ''
                }`}
                onClick={toggleShuffle}
                disabled={music.length < 2}
                aria-pressed={shuffle}
              >
                <span className="mf-music-popover__btn-icon" aria-hidden="true">
                  <Shuffle size={15} />
                </span>
                <span className="mf-music-popover__btn-label">{t('motivation.shuffle')}</span>
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
                  <li key={track.id} className="mf-music-popover__track-row">
                    <button
                      type="button"
                      className={`mf-music-popover__track${selected ? ' is-selected' : ''}${
                        playingThis ? ' is-playing' : ''
                      }`}
                      onClick={() => selectTrack(index)}
                    >
                      <span className="mf-music-popover__track-index" aria-hidden="true">
                        {track.coverImageUrl ? (
                          <img
                            className="mf-music-popover__track-cover"
                            src={track.coverImageUrl}
                            alt=""
                          />
                        ) : playingThis ? (
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
                    <div className="mf-music-popover__reorder">
                      <button
                        type="button"
                        className="mf-music-popover__reorder-btn"
                        disabled={index === 0}
                        aria-label={t('motivation.moveUp')}
                        title={t('motivation.moveUp')}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveTrack(index, -1);
                        }}
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="mf-music-popover__reorder-btn"
                        disabled={index >= music.length - 1}
                        aria-label={t('motivation.moveDown')}
                        title={t('motivation.moveDown')}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveTrack(index, 1);
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}

      {videoOpen && currentVideo ? (
        <VideoOverlay
          items={videos}
          index={videoIndex}
          compact={videoCompact}
          onCompactChange={setVideoCompact}
          onClose={closeVideo}
          onNext={playNextVideo}
          onSelect={(i) => setVideoIndex(i)}
        />
      ) : null}
    </div>
  );
}

function VideoOverlay({
  items,
  index,
  compact,
  onCompactChange,
  onClose,
  onNext,
  onSelect,
}: {
  items: MotivationMediaItem[];
  index: number;
  compact: boolean;
  onCompactChange: (compact: boolean) => void;
  onClose: () => void;
  onNext: () => void;
  onSelect: (index: number) => void;
}) {
  const { t } = useTranslation('common');
  const item = items[index];
  const embedId = item?.youtubeId;
  const total = items.length;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!item) return null;

  return (
    <div
      className={`mf-video-overlay${compact ? ' mf-video-overlay--compact' : ''}`}
      role="dialog"
      aria-modal={!compact}
      aria-label={t('motivation.videoPanelTitle')}
    >
      {compact ? null : <div className="mf-video-overlay__backdrop" onClick={onClose} />}
      <div className="mf-video-overlay__panel">
        <div className="mf-video-overlay__glow" aria-hidden="true" />

        <div className="mf-video-overlay__top">
          <div className="mf-video-overlay__brand">
            <span className="mf-video-overlay__brand-mark" aria-hidden="true">
              <Film size={14} />
            </span>
            <div className="mf-video-overlay__brand-copy">
              <p className="mf-video-overlay__eyebrow">{t('motivation.videoPanelTitle')}</p>
              <p className="mf-video-overlay__count">
                {t('motivation.videoCount', { count: total })}
              </p>
            </div>
          </div>
          <div className="mf-video-overlay__top-actions">
            <button
              type="button"
              className="mf-video-overlay__close"
              aria-label={compact ? t('motivation.expandMode') : t('motivation.compactMode')}
              onClick={() => onCompactChange(!compact)}
            >
              {compact ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
            <button
              type="button"
              className="mf-video-overlay__close"
              aria-label={t('motivation.close')}
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {compact ? null : (
          <div className="mf-video-overlay__now">
            <div className="mf-video-overlay__art is-playing" aria-hidden="true">
              <Film size={20} />
              <span className="mf-video-overlay__pulse" />
            </div>
            <div className="mf-video-overlay__meta">
              <p className="mf-video-overlay__status">{t('motivation.watching')}</p>
              <p className="mf-video-overlay__title" title={item.title}>
                {item.title}
              </p>
              <p className="mf-video-overlay__position">
                {index + 1} / {total}
              </p>
            </div>
          </div>
        )}

        <div className="mf-video-overlay__frame">
          {embedId ? (
            <iframe
              key={embedId}
              title={item.title}
              src={`https://www.youtube.com/embed/${embedId}?autoplay=1&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <p className="mf-video-overlay__error">{t('motivation.playFailed')}</p>
          )}
        </div>

        {compact ? (
          <p className="mf-video-overlay__compact-title" title={item.title}>
            {item.title}
          </p>
        ) : (
          <>
            <div
              className={`mf-video-overlay__transport${total > 1 ? '' : ' mf-video-overlay__transport--single'}`}
            >
              {total > 1 ? (
                <button
                  type="button"
                  className="mf-video-overlay__btn mf-video-overlay__btn--next"
                  onClick={onNext}
                >
                  <span className="mf-video-overlay__btn-icon" aria-hidden="true">
                    <SkipForward size={16} strokeWidth={2.4} />
                  </span>
                  <span className="mf-video-overlay__btn-label">{t('motivation.next')}</span>
                </button>
              ) : null}
              <button
                type="button"
                className="mf-video-overlay__btn mf-video-overlay__btn--close"
                onClick={onClose}
              >
                <span className="mf-video-overlay__btn-icon" aria-hidden="true">
                  <Square size={14} strokeWidth={2.4} fill="currentColor" />
                </span>
                <span className="mf-video-overlay__btn-label">{t('motivation.close')}</span>
              </button>
            </div>

            {total > 1 ? (
              <div className="mf-video-overlay__list">
                <p className="mf-video-overlay__list-label">{t('motivation.playlist')}</p>
                <ul className="mf-video-overlay__tracks">
                  {items.map((video, i) => {
                    const active = i === index;
                    return (
                      <li key={video.id}>
                        <button
                          type="button"
                          className={`mf-video-overlay__track${active ? ' is-playing' : ''}`}
                          onClick={() => onSelect(i)}
                          aria-current={active ? 'true' : undefined}
                        >
                          <span className="mf-video-overlay__track-index" aria-hidden="true">
                            {active ? <Film size={12} /> : i + 1}
                          </span>
                          <span className="mf-video-overlay__track-title">{video.title}</span>
                          <span className="mf-video-overlay__track-action" aria-hidden="true">
                            {active ? <Pause size={15} /> : <Play size={15} />}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
