import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fortuneApi } from '@/api/fortune.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { getTodayDateKey } from '@/utils/historyDate';
import { isAllGymsId } from '@machinefit/shared';

function starsText(n: number): string {
  const filled = Math.min(5, Math.max(0, Math.round(n)));
  return `${'★'.repeat(filled)}${'☆'.repeat(5 - filled)}`;
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
        <h2 className="home-fortune-card__title">{t('title')}</h2>
        <p className="home-fortune-card__muted">…</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="home-fortune-card" aria-live="polite">
        <h2 className="home-fortune-card__title">{t('title')}</h2>
        <p className="home-fortune-card__muted">{t('loadError')}</p>
      </section>
    );
  }

  if (!data || data.status === 'needs_birth_profile') {
    return (
      <section className="home-fortune-card">
        <h2 className="home-fortune-card__title">{t('title')}</h2>
        <p className="home-fortune-card__body">{t('needsBirth')}</p>
        <Link to={`${ROUTES.SETTINGS}#birth-profile`} className="btn btn--secondary btn--block">
          {t('enterBirth')}
        </Link>
      </section>
    );
  }

  const fortune = data.fortune;
  const scores = data.scores;
  if (!fortune || !scores) return null;

  return (
    <section className="home-fortune-card">
      <div className="home-fortune-card__header">
        <h2 className="home-fortune-card__title">{t('title')}</h2>
        <span className="home-fortune-card__date">
          {t('subtitle', { date: data.date })}
        </span>
      </div>
      <p className="home-fortune-card__stars">
        {t('starsLabel')} {starsText(fortune.scoreStars)}
      </p>
      <p className="home-fortune-card__keyword">{fortune.keywordTitle}</p>
      <p className="home-fortune-card__headline">{fortune.title}</p>
      <ul className="home-fortune-card__scores">
        <li>{t('healthmanIndex', { score: scores.healthmanIndex })}</li>
        <li>{t('prLuck', { score: scores.prLuck })}</li>
        <li>{t('recoveryLuck', { score: scores.recoveryLuck })}</li>
      </ul>
      <Link to={ROUTES.FORTUNE_TODAY} className="btn btn--secondary btn--block">
        {t('viewDetail')}
      </Link>
    </section>
  );
}
