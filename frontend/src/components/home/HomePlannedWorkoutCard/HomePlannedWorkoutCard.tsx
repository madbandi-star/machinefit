import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { isAllGymsId } from '@machinefit/shared';
import { workoutCardApi } from '@/api/workout-card.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useTodayActivePlanCount } from '@/hooks/useTodayActivePlanCount';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { PlanDatePickerDialog } from '@/components/records/PlanDatePickerDialog/PlanDatePickerDialog';
import { dismissForToday, isDismissedToday } from '@/utils/dismissToday';
import { getTodayDateKey, getTomorrowDateKey, normalizeDateKey } from '@/utils/historyDate';
import '@/styles/home.css';

const HOME_PLANNED_DISMISS_KEY = 'home-planned-workout';

export function HomePlannedWorkoutCard() {
  const { t } = useTranslation(['machines', 'common']);
  const { count, gymReady } = useTodayActivePlanCount();
  const today = getTodayDateKey();
  const [dismissed, setDismissed] = useState(() =>
    isDismissedToday(HOME_PLANNED_DISMISS_KEY)
  );

  if (!gymReady || count <= 0 || dismissed) return null;

  const recordsUrl = `${ROUTES.RECORDS}?tab=history&date=${encodeURIComponent(today)}`;

  return (
    <section className="home-planned-workout" aria-label={t('machines:history.planHomeTitle')}>
      <Link to={recordsUrl} className="home-planned-workout__main">
        <span className="home-planned-workout__title">{t('machines:history.planHomeTitle')}</span>
        <span className="home-planned-workout__sep" aria-hidden>
          ·
        </span>
        <span className="home-planned-workout__count">
          {t('machines:history.planHomeCount', { count })}
        </span>
        <span className="home-planned-workout__open">
          {t('machines:history.planHomeOpenRecords')}
        </span>
      </Link>
      <button
        type="button"
        className="home-planned-workout__dismiss"
        onClick={() => {
          dismissForToday(HOME_PLANNED_DISMISS_KEY);
          setDismissed(true);
        }}
      >
        {t('machines:history.planHomeDismissToday')}
      </button>
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
  const [datePickerCardId, setDatePickerCardId] = useState<string | null>(null);
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

  const datePickerCard =
    datePickerCardId != null
      ? (visible.find((c) => c.id === datePickerCardId) ??
        missed.find((c) => c.id === datePickerCardId) ??
        null)
      : null;

  if (!gymReady || (visible.length === 0 && !datePickerCard)) return null;

  const card = visible[0] ?? datePickerCard!;
  const moreCount = Math.max(0, visible.length - 1);
  const machineLabel = card.machineName ?? card.machineCode;
  const dateKey = normalizeDateKey(card.scheduledDate);
  const dateLabel = /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey.slice(5) : dateKey;
  const busy = resolveMutation.isPending;

  return (
    <>
      {visible.length > 0 ? (
        <section
          className="home-missed-plans"
          role="status"
          aria-label={t('machines:history.planMissedTitle')}
        >
          <div className="home-missed-plans__main">
            <span className="home-missed-plans__title">
              {t('machines:history.planMissedTitle')}
            </span>
            <span className="home-missed-plans__sep" aria-hidden>
              ·
            </span>
            <span className="home-missed-plans__detail" title={`${machineLabel} · ${dateLabel}`}>
              {machineLabel}
              <span className="home-missed-plans__sep" aria-hidden>
                ·
              </span>
              {dateLabel}
              {moreCount > 0 ? (
                <span className="home-missed-plans__more">
                  {t('machines:history.planMissedMore', { count: moreCount })}
                </span>
              ) : null}
            </span>
          </div>
          <div className="home-missed-plans__actions">
            <button
              type="button"
              className="home-missed-plans__btn home-missed-plans__btn--primary"
              disabled={busy}
              onClick={() => resolveMutation.mutate({ id: card.id, action: 'move_today' })}
            >
              {t('machines:history.planMissedMoveToday')}
            </button>
            <button
              type="button"
              className="home-missed-plans__btn"
              disabled={busy}
              onClick={() => setDatePickerCardId(card.id)}
            >
              {t('machines:history.planMissedChangeDate')}
            </button>
            <button
              type="button"
              className="home-missed-plans__btn"
              disabled={busy}
              onClick={() => resolveMutation.mutate({ id: card.id, action: 'delete' })}
            >
              {t('machines:history.planMissedDelete')}
            </button>
            <button
              type="button"
              className="home-missed-plans__btn home-missed-plans__btn--ghost"
              disabled={busy}
              onClick={() => resolveMutation.mutate({ id: card.id, action: 'dismiss' })}
            >
              {t('machines:history.planMissedDismiss')}
            </button>
          </div>
        </section>
      ) : null}

      <PlanDatePickerDialog
        open={Boolean(datePickerCard)}
        title={t('machines:history.planDateMoveTitle')}
        message={t('machines:history.planDatePrompt')}
        initialDate={getTomorrowDateKey()}
        confirmLabel={t('machines:history.planDateMoveConfirm')}
        onClose={() => setDatePickerCardId(null)}
        onConfirm={(scheduledDate) => {
          if (!datePickerCard) return;
          const id = datePickerCard.id;
          setDatePickerCardId(null);
          resolveMutation.mutate({ id, action: 'move_date', scheduledDate });
        }}
      />
    </>
  );
}
