import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { pointsApi } from '@/api/points.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';

function formatRemaining(ms: number, t: (key: string, opts?: Record<string, unknown>) => string) {
  const totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return t('points.powerBox.nextMinutes', { minutes: Math.max(1, minutes) });
  }
  return t('points.powerBox.nextHoursMinutes', { hours, minutes });
}

export function PowerBox() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [phase, setPhase] = useState<'idle' | 'spark' | 'reward'>('idle');
  const [rewardFlash, setRewardFlash] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const statusQuery = useQuery({
    queryKey: QUERY_KEYS.pointsPowerBox,
    queryFn: async () => {
      const res = await pointsApi.getPowerBox();
      return res.data.data;
    },
    staleTime: 30_000,
  });

  const status = statusQuery.data;
  const claimed = Boolean(status?.claimedToday);
  const available = Boolean(status?.available);

  useEffect(() => {
    if (!claimed || !status?.nextAvailableAt) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, [claimed, status?.nextAvailableAt]);

  const claimMutation = useMutation({
    mutationFn: async () => {
      const res = await pointsApi.claimPowerBox();
      return res.data.data;
    },
    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pointsBalance }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pointsPowerBox }),
        queryClient.invalidateQueries({ queryKey: ['points', 'ledger'] }),
      ]);

      if (result.awarded && result.points > 0) {
        setPhase('spark');
        window.setTimeout(() => {
          setRewardFlash(result.points);
          setPhase('reward');
        }, 220);
        window.setTimeout(() => {
          setPhase('idle');
          setRewardFlash(null);
        }, 1800);
        showToast(t('points.earnedToast', { points: result.points }), 'success');
        return;
      }

      showToast(t('points.powerBox.alreadyClaimed'), 'info');
    },
    onError: () => {
      showToast(t('points.powerBox.claimFailed'), 'error');
    },
  });

  const remainingMs = status?.nextAvailableAt
    ? Math.max(0, new Date(status.nextAvailableAt).getTime() - nowMs)
    : 0;

  const disabled = claimed || !available || claimMutation.isPending || statusQuery.isLoading;

  const handleClick = () => {
    if (disabled) return;
    claimMutation.mutate();
  };

  return (
    <div className="power-box">
      <button
        type="button"
        className={`power-box__btn${claimed ? ' power-box__btn--claimed' : ''}${
          phase !== 'idle' ? ' power-box__btn--animating' : ''
        }`}
        onClick={handleClick}
        disabled={disabled}
        aria-label={
          claimed ? t('points.powerBox.alreadyClaimed') : t('points.powerBox.openLabel')
        }
        title={
          claimed ? t('points.powerBox.alreadyClaimed') : t('points.powerBox.openLabel')
        }
      >
        <span className="power-box__emoji" aria-hidden>
          {phase === 'spark' ? '✨' : '🎁'}
        </span>
        {phase === 'reward' && rewardFlash != null ? (
          <span className="power-box__gain" aria-live="polite">
            +{rewardFlash}
          </span>
        ) : null}
      </button>
      {claimed ? (
        <p className="power-box__hint">
          {t('points.powerBox.alreadyClaimed')}
          {remainingMs > 0 ? (
            <>
              <br />
              {formatRemaining(remainingMs, t)}
            </>
          ) : null}
        </p>
      ) : (
        <p className="power-box__hint power-box__hint--ready">{t('points.powerBox.readyHint')}</p>
      )}
    </div>
  );
}
