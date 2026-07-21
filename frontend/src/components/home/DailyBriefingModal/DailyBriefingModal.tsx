import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog';
import { historyApi, workoutLogApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useAuthStore } from '@/store/auth.store';
import { computeVolume } from '@/utils/workoutAnalytics';
import { isDismissedToday, dismissForToday } from '@/utils/dismissToday';
import { getLocalDayRange, getTodayDateKey } from '@/utils/historyDate';
import '@/styles/home.css';

const DISMISS_KEY = 'daily-briefing';
const SHOWN_KEY = 'daily-briefing-shown';

interface DailyBriefingModalProps {
  open: boolean;
  onClose: () => void;
}

export function DailyBriefingModal({ open, onClose }: DailyBriefingModalProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const memberKey = activeMemberId ?? '';
  const today = getTodayDateKey();
  const { from, to } = getLocalDayRange(today);

  const { data: todayLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: [...QUERY_KEYS.workoutLogs, activeGymId, memberKey, 'briefing', today],
    queryFn: async () => {
      const res = await workoutLogApi.list({
        gymId: activeGymId!,
        from: today,
        to: today,
        ...(activeMemberId ? { memberId: activeMemberId } : {}),
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
        ...(activeMemberId ? { memberId: activeMemberId } : {}),
      });
      return res.data.data;
    },
    enabled: open && Boolean(activeGymId) && memberScopeReady,
  });

  const summary = useMemo(() => {
    const machines = new Set([
      ...todayLogs.map((log) => log.machineCode),
      ...todayHistory.map((item) => item.machineCode),
    ]);
    const totalVolume = todayLogs.reduce((sum, log) => sum + computeVolume(log.setWeightsKg), 0);
    const maxWeight = todayLogs.reduce((max, log) => {
      const logMax = log.setWeightsKg.reduce((inner, weight) => Math.max(inner, weight), 0);
      return Math.max(max, logMax);
    }, 0);

    return {
      recommendationCount: todayHistory.length,
      loggedCount: todayLogs.length,
      machineCount: machines.size,
      totalVolume,
      maxWeight,
    };
  }, [todayHistory, todayLogs]);

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
