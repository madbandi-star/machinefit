import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Share2 } from 'lucide-react';
import { fortuneApi } from '@/api/fortune.api';
import {
  keywordEmoji,
  keywordTone,
  parseFortuneDateParts,
} from '@/components/fortune/fortuneVisuals';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { getTodayDateKey } from '@/utils/historyDate';
import { shareFortuneCard } from '@/utils/shareFortuneCard';
import { isAllGymsId } from '@machinefit/shared';

const EXPANDED_KEY = 'machinefit.homeFortuneExpanded';

function readExpandedPreference(): boolean {
  try {
    const raw = localStorage.getItem(EXPANDED_KEY);
    if (raw === null) return false;
    return raw === '1';
  } catch {
    return false;
  }
}

function writeExpandedPreference(expanded: boolean) {
  try {
    localStorage.setItem(EXPANDED_KEY, expanded ? '1' : '0');
  } catch {
    /* ignore quota / private mode */
  }
}

function StarsRow({ score }: { score: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(score)));
  return (
    <span className="home-fortune-card__stars-row" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`home-fortune-card__star${i < filled ? ' home-fortune-card__star--on' : ''}`}
        >
          {i < filled ? '★' : '☆'}
        </span>
      ))}
    </span>
  );
}

function FortuneCardShell({
  className,
  expanded,
  onToggle,
  peek,
  children,
}: {
  className: string;
  expanded: boolean;
  onToggle: () => void;
  peek?: ReactNode;
  children: ReactNode;
}) {
  const { t } = useTranslation(['fortune', 'common']);

  return (
    <section className={className}>
      <button
        type="button"
        className="home-fortune-card__toggle"
        aria-expanded={expanded}
        aria-controls="home-fortune-card-body"
        onClick={onToggle}
      >
        <span className="home-fortune-card__toggle-main">
          <span className="home-fortune-card__eyebrow">
            <span aria-hidden>🔥</span> {t('fortune:title')}
          </span>
          {!expanded && peek ? (
            <span className="home-fortune-card__peek">{peek}</span>
          ) : null}
        </span>
        <span className="home-fortune-card__fold" aria-hidden>
          <ChevronDown
            className={`home-fortune-card__chevron${expanded ? ' is-open' : ''}`}
            size={22}
            strokeWidth={2.5}
          />
        </span>
      </button>
      {expanded ? (
        <div id="home-fortune-card-body" className="home-fortune-card__body-wrap">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function HomeFortuneCard() {
  const { t, i18n } = useTranslation(['fortune', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const displayName = useAuthStore((s) => s.user?.displayName);
  const { activeGymId } = useActiveGym();
  const { activeMemberId } = useActiveMember();
  const today = getTodayDateKey();
  const [expanded, setExpanded] = useState(readExpandedPreference);
  const [sharing, setSharing] = useState(false);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      writeExpandedPreference(next);
      return next;
    });
  };

  const gymId =
    activeGymId && !isAllGymsId(activeGymId) ? activeGymId : undefined;
  const memberId = gymId && activeMemberId ? activeMemberId : undefined;

  const { data, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.fortuneToday(today, gymId, memberId),
    queryFn: async () => {
      const res = await fortuneApi.getToday({
        gymId,
        memberId,
        date: today,
        locale: i18n.language?.slice(0, 2),
      });
      return res.data.data;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <FortuneCardShell
        className="home-fortune-card home-fortune-card--loading"
        expanded={expanded}
        onToggle={toggleExpanded}
      >
        <p className="home-fortune-card__muted" aria-busy="true">
          …
        </p>
      </FortuneCardShell>
    );
  }

  if (isError) {
    return (
      <FortuneCardShell
        className="home-fortune-card"
        expanded={expanded}
        onToggle={toggleExpanded}
      >
        <p className="home-fortune-card__muted" aria-live="polite">
          {t('loadError')}
        </p>
      </FortuneCardShell>
    );
  }

  if (!data || data.status === 'needs_birth_profile') {
    return (
      <FortuneCardShell
        className="home-fortune-card home-fortune-card--gate"
        expanded={expanded}
        onToggle={toggleExpanded}
        peek={<span aria-hidden>🔮</span>}
      >
        <p className="home-fortune-card__gate-emoji" aria-hidden>
          🔮
        </p>
        <p className="home-fortune-card__body">{t('needsBirth')}</p>
        <Link to={`${ROUTES.SETTINGS}#birth-profile`} className="btn btn--primary btn--block">
          {t('enterBirth')}
        </Link>
      </FortuneCardShell>
    );
  }

  const fortune = data.fortune;
  const scores = data.scores;
  if (!fortune || !scores) return null;

  const emoji = keywordEmoji(fortune.keyword);
  const tone = keywordTone(fortune.keyword);
  const filled = Math.min(5, Math.max(0, Math.round(fortune.scoreStars)));
  const themeLabel = data.narrative
    ? t(data.narrative.coreThemeLabelKey)
    : fortune.keywordTitle;
  const parts = parseFortuneDateParts(data.date);
  const dateLabel = parts
    ? t('dateLong', { year: parts.year, month: parts.month, day: parts.day })
    : data.date;

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await shareFortuneCard({
        fortune,
        scores,
        themeLabel,
        dateLabel,
        labels: {
          title: t('title'),
          healthman: t('healthmanIndexLabel'),
          prLuck: t('prLuckLabel'),
          recoveryLuck: t('recoveryLuckLabel'),
          tagline: t('shareTagline'),
          shareHashtags: t('shareHashtags'),
        },
        displayName,
        showToast,
        shareSavedMessage: t('shareSaved'),
        errorMessage: t('common:errors.submitFailed'),
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <FortuneCardShell
      className={`home-fortune-card home-fortune-card--ready home-fortune-card--${tone}`}
      expanded={expanded}
      onToggle={toggleExpanded}
      peek={
        <>
          <span aria-hidden>{emoji}</span> {fortune.keywordTitle}
        </>
      }
    >
      <div className="home-fortune-card__glow" aria-hidden />

      <div className="home-fortune-card__keyword-block">
        <span className="home-fortune-card__keyword-emoji" aria-hidden>
          {emoji}
        </span>
        <p className="home-fortune-card__keyword">{fortune.keywordTitle}</p>
      </div>

      {data.narrative ? (
        <p className="home-fortune-card__core-theme">
          {t('coreThemeLabel')} · {t(data.narrative.coreThemeLabelKey)}
        </p>
      ) : null}

      <div className="home-fortune-card__luck" aria-label={`${t('starsLabel')} ${filled} / 5`}>
        <span className="home-fortune-card__luck-label">{t('starsLabel')}</span>
        <StarsRow score={fortune.scoreStars} />
        <span className="home-fortune-card__luck-meta">{filled} / 5</span>
      </div>

      <div className="home-fortune-card__metrics" aria-label={t('sectionFortuneVisual')}>
        <div className="home-fortune-card__metric home-fortune-card__metric--primary">
          <span className="home-fortune-card__metric-label">
            <span aria-hidden>🔥</span> {t('healthmanIndexLabel')}
          </span>
          <strong className="home-fortune-card__metric-value">{scores.healthmanIndex}</strong>
        </div>
        <div className="home-fortune-card__metric">
          <span className="home-fortune-card__metric-label">
            <span aria-hidden>🏆</span> {t('prLuckLabel')}
          </span>
          <strong className="home-fortune-card__metric-value">{scores.prLuck}%</strong>
        </div>
        <div className="home-fortune-card__metric">
          <span className="home-fortune-card__metric-label">
            <span aria-hidden>🧘</span> {t('recoveryLuckLabel')}
          </span>
          <strong className="home-fortune-card__metric-value">{scores.recoveryLuck}%</strong>
        </div>
      </div>

      <div className="home-fortune-card__actions">
        <Link to={ROUTES.FORTUNE_TODAY} className="home-fortune-card__cta">
          {t('viewDetail')}
          <span aria-hidden>→</span>
        </Link>
        <button
          type="button"
          className="home-fortune-card__share"
          onClick={() => void handleShare()}
          disabled={sharing}
          aria-label={t('share')}
          title={t('share')}
        >
          <Share2 size={18} strokeWidth={2.25} aria-hidden />
        </button>
      </div>
    </FortuneCardShell>
  );
}
