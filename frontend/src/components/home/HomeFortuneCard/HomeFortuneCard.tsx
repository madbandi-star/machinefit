import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fortuneApi } from '@/api/fortune.api';
import {
  formatFortuneDate,
  keywordEmoji,
  keywordTone,
} from '@/components/fortune/fortuneVisuals';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { getTodayDateKey } from '@/utils/historyDate';
import { isAllGymsId } from '@machinefit/shared';

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

export function HomeFortuneCard() {
  const { t, i18n } = useTranslation('fortune');
  const { activeGymId } = useActiveGym();
  const { activeMemberId } = useActiveMember();
  const today = getTodayDateKey();

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
      <section className="home-fortune-card home-fortune-card--loading" aria-busy="true">
        <p className="home-fortune-card__eyebrow">
          <span aria-hidden>🔥</span> {t('title')}
        </p>
        <p className="home-fortune-card__muted">…</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="home-fortune-card" aria-live="polite">
        <p className="home-fortune-card__eyebrow">
          <span aria-hidden>🔥</span> {t('title')}
        </p>
        <p className="home-fortune-card__muted">{t('loadError')}</p>
      </section>
    );
  }

  if (!data || data.status === 'needs_birth_profile') {
    return (
      <section className="home-fortune-card home-fortune-card--gate">
        <p className="home-fortune-card__eyebrow">
          <span aria-hidden>🔥</span> {t('title')}
        </p>
        <p className="home-fortune-card__gate-emoji" aria-hidden>
          🔮
        </p>
        <p className="home-fortune-card__body">{t('needsBirth')}</p>
        <Link to={`${ROUTES.SETTINGS}#birth-profile`} className="btn btn--primary btn--block">
          {t('enterBirth')}
        </Link>
      </section>
    );
  }

  const fortune = data.fortune;
  const scores = data.scores;
  if (!fortune || !scores) return null;

  const emoji = keywordEmoji(fortune.keyword);
  const tone = keywordTone(fortune.keyword);
  const filled = Math.min(5, Math.max(0, Math.round(fortune.scoreStars)));

  return (
    <section className={`home-fortune-card home-fortune-card--ready home-fortune-card--${tone}`}>
      <div className="home-fortune-card__glow" aria-hidden />
      <div className="home-fortune-card__top">
        <p className="home-fortune-card__eyebrow">
          <span aria-hidden>🔥</span> {t('title')}
        </p>
        <span className="home-fortune-card__date">{formatFortuneDate(data.date)}</span>
      </div>

      <div className="home-fortune-card__keyword-block">
        <span className="home-fortune-card__keyword-emoji" aria-hidden>
          {emoji}
        </span>
        <p className="home-fortune-card__keyword">{fortune.keywordTitle}</p>
      </div>

      <p className="home-fortune-card__headline">{fortune.title}</p>

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

      <Link to={ROUTES.FORTUNE_TODAY} className="home-fortune-card__cta">
        {t('viewDetail')}
        <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
