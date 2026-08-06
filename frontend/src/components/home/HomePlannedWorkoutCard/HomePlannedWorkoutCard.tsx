import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import type { WorkoutCard } from '@machinefit/shared';
import { isAllGymsId } from '@machinefit/shared';
import { workoutCardApi } from '@/api/workout-card.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { getTodayDateKey, normalizeDateKey } from '@/utils/historyDate';
import '@/styles/records.css';

function collectMuscleSummary(cards: WorkoutCard[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const card of cards) {
    const muscle = card.targetMuscleGroup;
    if (!muscle || seen.has(muscle)) continue;
    seen.add(muscle);
    ordered.push(muscle);
  }
  return ordered;
}

export function HomePlannedWorkoutCard() {
  const { t } = useTranslation(['machines', 'common']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const today = getTodayDateKey();
  const memberKey = activeMemberId ?? '';
  const gymReady =
    isAuthenticated &&
    Boolean(activeGymId) &&
    Boolean(activeMemberId) &&
    memberScopeReady &&
    !isAllGymsId(activeGymId ?? '');

  const { data: todayCards = [] } = useQuery({
    queryKey: QUERY_KEYS.workoutCardsList(activeGymId ?? '', memberKey, {
      scheduledDate: today,
    }),
    queryFn: async () => {
      const res = await workoutCardApi.list({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        scheduledDate: today,
      });
      return res.data.data ?? [];
    },
    enabled: gymReady,
    staleTime: 30_000,
  });

  const activePlans = useMemo(
    () =>
      todayCards.filter(
        (card) => card.status === 'PLANNED' || card.status === 'IN_PROGRESS'
      ),
    [todayCards]
  );

  const muscles = useMemo(() => collectMuscleSummary(activePlans), [activePlans]);

  const startMutation = useMutation({
    mutationFn: async (cardId: string) => {
      const res = await workoutCardApi.patchStatus(cardId, { status: 'IN_PROGRESS' });
      return res.data.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCards });
      showToast(t('machines:history.planStarted'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  if (!gymReady || activePlans.length === 0) return null;

  const firstPlanned = activePlans.find((card) => card.status === 'PLANNED') ?? activePlans[0]!;
  const recordsUrl = `${ROUTES.RECORDS}?tab=history&date=${encodeURIComponent(today)}`;

  return (
    <section className="home-planned-workout" aria-label={t('machines:history.planHomeTitle')}>
      <div className="home-planned-workout__body">
        <p className="home-planned-workout__eyebrow">{t('machines:history.planHomeTitle')}</p>
        <p className="home-planned-workout__count">
          {t('machines:history.planHomeCount', { count: activePlans.length })}
        </p>
        {muscles.length > 0 ? (
          <p className="home-planned-workout__muscles">
            {muscles
              .map((group) => t(`machines:muscleGroups.${group}`, { defaultValue: group }))
              .join(' · ')}
          </p>
        ) : null}
      </div>
      <div className="home-planned-workout__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={startMutation.isPending || firstPlanned.status !== 'PLANNED'}
          onClick={() => {
            if (firstPlanned.status === 'PLANNED') {
              startMutation.mutate(firstPlanned.id);
            }
          }}
        >
          {t('machines:history.planStartWorkout')}
        </button>
        <Link to={recordsUrl} className="btn btn--secondary">
          {t('machines:history.planHomeOpenRecords')}
        </Link>
      </div>
    </section>
  );
}

export function MissedWorkoutPlansBanner() {
  const { t } = useTranslation(['machines', 'common']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set());
  const memberKey = activeMemberId ?? '';
  const gymReady =
    isAuthenticated &&
    Boolean(activeGymId) &&
    Boolean(activeMemberId) &&
    memberScopeReady &&
    !isAllGymsId(activeGymId ?? '');

  const { data: missed = [] } = useQuery({
    queryKey: QUERY_KEYS.workoutCardsMissed(activeGymId ?? '', memberKey),
    queryFn: async () => {
      const res = await workoutCardApi.listMissed({
        gymId: activeGymId!,
        memberId: activeMemberId!,
      });
      return res.data.data ?? [];
    },
    enabled: gymReady,
    staleTime: 30_000,
  });

  const visible = useMemo(
    () => missed.filter((card) => !dismissedIds.has(card.id)),
    [missed, dismissedIds]
  );

  const resolveMutation = useMutation({
    mutationFn: async (payload: {
      id: string;
      action: 'move_today' | 'move_date' | 'delete' | 'dismiss';
      scheduledDate?: string;
    }) => {
      const res = await workoutCardApi.resolveMissed(payload.id, {
        action: payload.action,
        ...(payload.scheduledDate ? { scheduledDate: payload.scheduledDate } : {}),
      });
      return res.data.data;
    },
    onSuccess: async (_data, variables) => {
      setDismissedIds((prev) => new Set(prev).add(variables.id));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workoutCards }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.workoutCardsMissed(activeGymId ?? '', memberKey),
        }),
      ]);
      showToast(t('machines:history.planMissedResolved'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  if (!gymReady || visible.length === 0) return null;

  const card = visible[0]!;
  const moreCount = visible.length - 1;

  return (
    <div className="missed-plans-banner" role="status">
      <div className="missed-plans-banner__body">
        <p className="missed-plans-banner__title">{t('machines:history.planMissedTitle')}</p>
        <p className="missed-plans-banner__message">
          {t('machines:history.planMissedMessage', {
            name: card.machineName ?? card.machineCode,
            date: normalizeDateKey(card.scheduledDate),
            count: moreCount,
          })}
        </p>
      </div>
      <div className="missed-plans-banner__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={resolveMutation.isPending}
          onClick={() => resolveMutation.mutate({ id: card.id, action: 'move_today' })}
        >
          {t('machines:history.planMissedMoveToday')}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={resolveMutation.isPending}
          onClick={() => {
            const next = window.prompt(
              t('machines:history.planDatePrompt'),
              getTodayDateKey()
            );
            if (!next || !/^\d{4}-\d{2}-\d{2}$/.test(next.trim())) return;
            resolveMutation.mutate({
              id: card.id,
              action: 'move_date',
              scheduledDate: next.trim(),
            });
          }}
        >
          {t('machines:history.planMissedChangeDate')}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={resolveMutation.isPending}
          onClick={() => resolveMutation.mutate({ id: card.id, action: 'delete' })}
        >
          {t('machines:history.planMissedDelete')}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          disabled={resolveMutation.isPending}
          onClick={() => resolveMutation.mutate({ id: card.id, action: 'dismiss' })}
        >
          {t('machines:history.planMissedDismiss')}
        </button>
      </div>
    </div>
  );
}
