import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LiftedRankingBoard } from '@machinefit/shared';
import { formatVolumeKg } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { liftedWeightApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import './LiftedWeightPage.css';

export function LiftedWeightRankingsPage() {
  const { t, i18n } = useTranslation();
  const { activeGymId, gyms } = useActiveGym();
  const [board, setBoard] = useState<LiftedRankingBoard>('global');
  const [gymId, setGymId] = useState<string | undefined>(activeGymId ?? undefined);
  const locale = i18n.language.startsWith('ko') ? 'ko' : 'en';

  const needsGym = board === 'gym' || board === 'friends';

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.liftedWeightRankings, board, gymId ?? ''],
    queryFn: async () => {
      const res = await liftedWeightApi.rankings({
        board,
        gymId: needsGym ? gymId : undefined,
        limit: 100,
      });
      return res.data.data;
    },
    enabled: !needsGym || Boolean(gymId),
    staleTime: 60_000,
  });

  const boards: { id: LiftedRankingBoard; label: string }[] = [
    { id: 'global', label: t('liftedWeight.boardGlobal') },
    { id: 'gym', label: t('liftedWeight.boardGym') },
    { id: 'friends', label: t('liftedWeight.boardFriends') },
    { id: 'month', label: t('liftedWeight.boardMonth') },
    { id: 'year', label: t('liftedWeight.boardYear') },
  ];

  return (
    <div className="lifted-weight">
      <PageShell
        title={t('liftedWeight.rankingsTitle')}
        action={
          <Link to={ROUTES.LIFTED_WEIGHT} className="btn btn--secondary btn--sm">
            {t('actions.back')}
          </Link>
        }
      >
        <div className="lifted-weight__modes fade-in" role="tablist">
          {boards.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`lifted-weight__mode${board === item.id ? ' is-active' : ''}`}
              onClick={() => setBoard(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {needsGym && (
          <label className="lifted-weight__gym-select fade-in">
            <span>{t('liftedWeight.selectGym')}</span>
            <select value={gymId ?? ''} onChange={(e) => setGymId(e.target.value)}>
              {gyms.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {isLoading || !data ? (
          <Skeleton count={8} height={48} />
        ) : data.items.length === 0 ? (
          <p className="lifted-weight__empty">{t('liftedWeight.noRankings')}</p>
        ) : (
          <ol className="lifted-rank-list">
            {data.items.map((item) => (
              <li
                key={`${item.rank}-${item.userId}`}
                className={`lifted-rank-list__item${item.isMe ? ' is-me' : ''} slide-in`}
              >
                <span className="lifted-rank-list__rank">#{item.rank}</span>
                <span className="lifted-rank-list__name">
                  {item.displayName}
                  {item.isMe ? ` (${t('liftedWeight.me')})` : ''}
                </span>
                <span className="lifted-rank-list__kg">
                  {formatVolumeKg(item.totalKg, locale)} KG
                </span>
              </li>
            ))}
          </ol>
        )}
      </PageShell>
    </div>
  );
}
