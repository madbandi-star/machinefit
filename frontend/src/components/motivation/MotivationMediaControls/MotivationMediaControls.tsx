import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Film, Music2, Pause, Play, X } from 'lucide-react';
import type { MotivationMediaItem } from '@machinefit/shared';
import { motivationMediaApi, userMotivationTrackApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
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

  const { data } = useQuery({
    queryKey: QUERY_KEYS.motivationMedia,
    queryFn: async () => {
      const res = await motivationMediaApi.playlist();
      return res.data.data;
    },
    staleTime: 60_000,
  });

  const { data: myTracks } = useQuery({
    queryKey: QUERY_KEYS.userMotivationTracks,
    queryFn: async () => (await userMotivationTrackApi.list()).data.data,
    enabled: isAuthed,
    staleTime: 30_000,
  });

  const catalogMusic = data?.music ?? [];
  const videos = data?.video ?? [];

  const music = useMemo(() => {
    const tracks = myTracks?.items ?? [];
    if (!tracks.length) return catalogMusic;

    const defaults = tracks.filter((track) => track.isDefault);
    const selected = defaults.length ? defaults : tracks;
    return selected.map(
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
  }, [myTracks?.items, catalogMusic]);

  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicIndex, setMusicIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [videoOpen, setVideoOpen] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);

  const currentMusic = music[musicIndex];
  const currentVideo = videos[videoIndex];

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

    if (!musicPlaying || !currentMusic) {
      audio.pause();
      return;
    }

    if (audio.src !== currentMusic.mediaUrl) {
      audio.src = currentMusic.mediaUrl;
    }

    void audio.play().catch(() => {
      setMusicPlaying(false);
      showToast(t('motivation.playFailed'), 'error');
    });
  }, [musicPlaying, currentMusic, showToast, t]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const stopMusic = () => {
    setMusicPlaying(false);
    audioRef.current?.pause();
  };

  const toggleMusic = () => {
    if (!music.length) {
      showToast(t('motivation.musicEmpty'), 'info');
      return;
    }
    if (musicPlaying) {
      stopMusic();
      return;
    }
    setMusicIndex(0);
    setMusicPlaying(true);
  };

  const onMusicEnded = () => {
    setMusicIndex((prev) => {
      const next = prev + 1;
      if (next >= music.length) {
        setMusicPlaying(false);
        return 0;
      }
      return next;
    });
  };

  const toggleVideo = () => {
    if (!videos.length) {
      showToast(t('motivation.videoEmpty'), 'info');
      return;
    }
    if (videoOpen) {
      setVideoOpen(false);
      return;
    }
    stopMusic();
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
    <div className={`motivation-controls${bundled ? ' motivation-controls--bundle' : ''}`}>
      <audio ref={audioRef} preload="none" onEnded={onMusicEnded} />

      <button
        type="button"
        className={`motivation-controls__btn${musicPlaying ? ' motivation-controls__btn--active' : ''}`}
        aria-label={musicLabel}
        title={musicLabel}
        onClick={toggleMusic}
        disabled={!music.length}
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
        disabled={!videos.length}
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
