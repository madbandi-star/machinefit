import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { computePerformedTotalWeightKg } from '@machinefit/shared';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { historyApi, machinePreferenceApi, workoutLogApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useAuthStore } from '@/store/auth.store';
import { isDismissedToday, dismissForToday } from '@/utils/dismissToday';
import { getLocalDayRange, getTodayDateKey } from '@/utils/historyDate';
import '@/styles/home.css';

const DISMISS_KEY = 'daily-briefing';
const SHOWN_KEY = 'daily-briefing-shown';

interface DailyBriefingModalProps {
  open: boolean;
  onClose: () => void;
}

function resolveReps(min?: number, max?: number): number | null {
  if (min != null && min > 0) return min;
  if (max != null && max > 0) return max;
  return null;
}

export function DailyBriefingModal({ open, onClose }: DailyBriefingModalProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady, isRealGym } = useActiveMember();
  const memberKey = activeMemberId ?? '';
  const today = getTodayDateKey();
  const { from, to } = getLocalDayRange(today);

  const { data: todayLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.workoutLogs, activeGymId, memberKey, 'briefing', today],
    queryFn: async () => {
      const res = await workoutLogApi.list({
        gymId: activeGymId!,
        memberId: activeMemberId ?? undefined,
        from: today,
        to: today,
      });
      return res.data.data;
    },
    enabled: open && Boolean(activeGymId) && memberScopeReady,
  });

  const { data: todayHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: [...QUERY_KEYS.history, activeGymId, memberKey, 'briefing', today],
    queryFn: async () => {
      const res = await historyApi.list(activeGymId!, {
        from,
        to,
        limit: 20,
        memberId: activeMemberId ?? undefined,
      });
      return res.data.data;
    },
    enabled: open && Boolean(activeGymId) && memberScopeReady,
  });

  const machineCodes = useMemo(
    () => [...new Set(todayLogs.map((log) => log.machineCode))],
    [todayLogs]
  );

  const preferenceScope =
    isRealGym && activeGymId && activeMemberId
      ? { gymId: activeGymId, memberId: activeMemberId }
      : undefined;

  const { data: preferencesByMachine } = useQuery({
    queryKey: ['briefing-preferences', activeGymId, memberKey, machineCodes],
    queryFn: () => machinePreferenceApi.getBatch(machineCodes, preferenceScope),
    enabled: open && machineCodes.length > 0 && Boolean(preferenceScope),
    staleTime: 60_000,
  });

  const summary = useMemo(() => {
    const machines = new Set([
      ...todayLogs.map((log) => log.machineCode),
      ...todayHistory.map((item) => item.machineCode),
    ]);

    const historyByMachine = new Map(
      todayHistory.map((item) => [item.machineCode, item] as const)
    );

    const totalVolume = todayLogs.reduce((sum, log) => {
      const history = historyByMachine.get(log.machineCode);
      const adjusted = preferencesByMachine?.[log.machineCode]?.customSettings;
      return (
        sum +
        computePerformedTotalWeightKg({
          setWeightsKg: log.setWeightsKg,
          setCompleted: log.setCompleted,
          sets: log.setCount,
          adjustedWeight: adjusted?.recommendedWeightKg,
          recommendedWeight: history?.settings.recommendedWeightKg,
          adjustedReps: resolveReps(adjusted?.recommendedRepsMin, adjusted?.recommendedRepsMax),
          recommendedReps: resolveReps(
            history?.settings.recommendedRepsMin,
            history?.settings.recommendedRepsMax
          ),
        })
      );
    }, 0);

    const maxWeight = todayLogs.reduce((max, log) => {
      const history = historyByMachine.get(log.machineCode);
      const adjusted = preferencesByMachine?.[log.machineCode]?.customSettings;
      const effective =
        (adjusted?.recommendedWeightKg != null && adjusted.recommendedWeightKg > 0
          ? adjusted.recommendedWeightKg
          : null) ??
        (history?.settings.recommendedWeightKg != null &&
        history.settings.recommendedWeightKg > 0
          ? history.settings.recommendedWeightKg
          : null) ??
        log.setWeightsKg.reduce((inner, weight) => Math.max(inner, weight), 0);
      return Math.max(max, effective);
    }, 0);

    return {
      recommendationCount: todayHistory.length,
      loggedCount: todayLogs.length,
      machineCount: machines.size,
      totalVolume,
      maxWeight,
    };
  }, [todayHistory, todayLogs, preferencesByMachine]);

  if (!open) return null;

  const isLoading = logsLoading || historyLoading || !memberScopeReady;
  const hasActivity = summary.recommendationCount > 0 || summary.loggedCount > 0;

  return (
    <ConfirmDialog
      open={open}
      title={t('briefing.title', { name: user?.displayName ?? '' })}
      message={
        isLoading
          ? t('briefing.loading')
          : hasActivity
            ? t('briefing.summary', {
                recommendations: summary.recommendationCount,
                logs: summary.loggedCount,
                machines: summary.machineCount,
                volume: summary.totalVolume.toLocaleString(),
                maxWeight: summary.maxWeight > 0 ? summary.maxWeight : '—',
              })
            : t('briefing.empty')
      }
      confirmLabel={t('briefing.cta')}
      cancelLabel={t('actions.close')}
      dismissTodayKey={DISMISS_KEY}
      dismissTodayLabel={t('dismissToday')}
      onClose={onClose}
      onConfirm={onClose}
    />
  );
}

export function useDailyBriefing(): {
  showBriefing: boolean;
  closeBriefing: () => void;
} {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [showBriefing, setShowBriefing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowBriefing(false);
      return;
    }
    if (isDismissedToday(DISMISS_KEY) || isDismissedToday(SHOWN_KEY)) return;
    setShowBriefing(true);
  }, [isAuthenticated]);

  return {
    showBriefing,
    closeBriefing: () => {
      dismissForToday(SHOWN_KEY);
      setShowBriefing(false);
    },
  };
}
