import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RecommendationSettings, SettingsActiveSource } from '@machinefit/shared';
import { hasMeaningfulCustomSettings, roundRecommendWeightKg } from '@machinefit/shared';
import {
  machinePreferenceApi,
  recommendationFeedbackApi,
  type FitRating,
} from '@/api';
import { useUIStore } from '@/store/ui.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';

interface UseMachineFitFeedbackOptions {
  recommendationId: string;
  machineCode: string;
  recommendedSettings?: RecommendationSettings;
  /** Initial active source from the recommendation response when available. */
  initialActiveSource?: SettingsActiveSource;
  enabled?: boolean;
}

function seedCustomSettingsFromRecommendation(
  settings: RecommendationSettings
): Partial<RecommendationSettings> {
  const seeded: Partial<RecommendationSettings> = {
    seatPosition: settings.seatPosition,
    backPadPosition: settings.backPadPosition,
    footPosition: settings.footPosition,
    handlePosition: settings.handlePosition,
    romSetting: settings.romSetting,
  };

  if (settings.recommendedWeightKg != null) {
    seeded.recommendedWeightKg = roundRecommendWeightKg(settings.recommendedWeightKg);
  }
  if (settings.recommendedRepsMin != null) {
    seeded.recommendedRepsMin = settings.recommendedRepsMin;
  }
  if (settings.recommendedRepsMax != null) {
    seeded.recommendedRepsMax = settings.recommendedRepsMax;
  }

  return seeded;
}

function areSettingsEqual(
  a?: Partial<RecommendationSettings> | null,
  b?: Partial<RecommendationSettings> | null
): boolean {
  return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {});
}

export function useMachineFitFeedback({
  recommendationId,
  machineCode,
  recommendedSettings,
  initialActiveSource,
  enabled = true,
}: UseMachineFitFeedbackOptions) {
  const { t } = useTranslation(['machines', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const { activeGymId } = useActiveGym();
  const { activeMemberId, isRealGym } = useActiveMember();
  const [customSettings, setCustomSettings] = useState<Partial<RecommendationSettings>>({});
  /** True while the user has local edits not yet confirmed by a successful save. */
  const [settingsDirty, setSettingsDirty] = useState(false);
  const customSettingsRef = useRef(customSettings);
  customSettingsRef.current = customSettings;

  const preferenceScope =
    isRealGym && activeGymId && activeMemberId
      ? { gymId: activeGymId, memberId: activeMemberId }
      : undefined;

  const feedbackQueryKey = ['recommendation-feedback', recommendationId];
  const prefsQueryKey = ['machine-preferences', machineCode, preferenceScope?.gymId, preferenceScope?.memberId];

  // Reset local edit state when switching machine / recommendation.
  useEffect(() => {
    setCustomSettings({});
    setSettingsDirty(false);
    customSettingsRef.current = {};
  }, [machineCode, recommendationId]);

  const { data: savedRating } = useQuery({
    queryKey: feedbackQueryKey,
    queryFn: () => recommendationFeedbackApi.get(recommendationId),
    enabled,
  });

  const { data: machinePreferences } = useQuery({
    queryKey: prefsQueryKey,
    queryFn: () => machinePreferenceApi.get(machineCode, preferenceScope),
    enabled,
  });

  const savedPreferences = machinePreferences?.customSettings;
  const hasSavedPreferences = hasMeaningfulCustomSettings(savedPreferences);

  // UI source for banner/highlight.
  // Explicit fit rating wins: "추천값 잘맞음" must not keep adjusted UI just because
  // machine prefs still have activeSource=adjusted (or briefly lag after save).
  const activeSource: SettingsActiveSource = (() => {
    if (savedRating === 'good') return 'recommended';
    const stored = machinePreferences?.activeSource;
    if (stored === 'adjusted') return 'adjusted';
    if (
      savedRating === 'bad' &&
      (hasMeaningfulCustomSettings(customSettings) || hasSavedPreferences)
    ) {
      return 'adjusted';
    }
    return stored ?? initialActiveSource ?? (savedRating === 'bad' ? 'adjusted' : 'recommended');
  })();

  // Hydrate from server only when the user is not mid-edit. Skip no-op writes so
  // a prefs refetch cannot flash the previous weight (e.g. 100 → 90 → 100).
  // Also skip when local ref already holds newer edits than the incoming row
  // (stale GET after concurrent tip upsert / race).
  useEffect(() => {
    if (settingsDirty) return;
    if (!savedPreferences || !hasMeaningfulCustomSettings(savedPreferences)) return;
    setCustomSettings((prev) => {
      const local = customSettingsRef.current;
      if (
        hasMeaningfulCustomSettings(local) &&
        !areSettingsEqual(local, savedPreferences) &&
        areSettingsEqual(prev, local)
      ) {
        // Local UI already shows the saved/edited value; ignore stale server row.
        const localWeight = local.recommendedWeightKg;
        const serverWeight = savedPreferences.recommendedWeightKg;
        if (
          typeof localWeight === 'number' &&
          typeof serverWeight === 'number' &&
          localWeight !== serverWeight
        ) {
          return prev;
        }
      }
      return areSettingsEqual(prev, savedPreferences) ? prev : savedPreferences;
    });
  }, [savedPreferences, settingsDirty]);

  useEffect(() => {
    if (settingsDirty) return;
    if (activeSource !== 'adjusted' || !recommendedSettings) return;

    setCustomSettings((prev) => {
      if (savedPreferences && hasMeaningfulCustomSettings(savedPreferences)) {
        return areSettingsEqual(prev, savedPreferences) ? prev : savedPreferences;
      }
      if (Object.keys(prev).length > 0) return prev;
      return seedCustomSettingsFromRecommendation(recommendedSettings);
    });
  }, [activeSource, recommendedSettings, savedPreferences, settingsDirty]);

  const invalidateHistoryComparison = async () => {
    await queryClient.invalidateQueries({ queryKey: ['history-settings-comparison'] });
  };

  const feedbackMutation = useMutation({
    mutationFn: (fitRating: FitRating) =>
      recommendationFeedbackApi.submit({
        recommendationId,
        fitRating,
        ...preferenceScope,
      }),
    onSuccess: async (_data, fitRating) => {
      queryClient.setQueryData(feedbackQueryKey, fitRating);
      const nextSource: SettingsActiveSource = fitRating === 'bad' ? 'adjusted' : 'recommended';
      queryClient.setQueryData(prefsQueryKey, (prev: unknown) => {
        const current = (prev && typeof prev === 'object' ? prev : {}) as {
          customSettings?: Partial<RecommendationSettings>;
          personalTipMemo?: string;
          activeSource?: SettingsActiveSource;
        };
        return {
          // Keep whatever custom settings are already in cache (including just-saved
          // adjusted weight). Do not blank them on rating-only updates.
          customSettings: current.customSettings ?? {},
          personalTipMemo: current.personalTipMemo ?? '',
          activeSource: nextSource,
        };
      });
      // Do not invalidate machine-preferences here — a refetch can race with
      // 「조정값 저장」 and flash the previous weight (70 after editing to 90).
      await invalidateHistoryComparison();
      showToast(
        fitRating === 'bad'
          ? t('machines:feedback.savedBad')
          : t('machines:feedback.savedGood'),
        'success'
      );
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  const preferenceMutation = useMutation({
    mutationFn: (input: {
      customSettings?: Partial<RecommendationSettings>;
      activeSource?: SettingsActiveSource;
    }) =>
      machinePreferenceApi.upsert({
        machineCode,
        ...preferenceScope,
        ...input,
      }),
    onMutate: async (variables) => {
      // Keep UI on the value being saved; block hydrate-from-server flashes.
      setSettingsDirty(true);
      if (variables.customSettings) {
        customSettingsRef.current = variables.customSettings;
        setCustomSettings(variables.customSettings);
        await queryClient.cancelQueries({ queryKey: prefsQueryKey });
        queryClient.setQueryData(prefsQueryKey, (prev: unknown) => {
          const current = (prev && typeof prev === 'object' ? prev : {}) as {
            customSettings?: Partial<RecommendationSettings>;
            personalTipMemo?: string;
            activeSource?: SettingsActiveSource;
          };
          return {
            customSettings: variables.customSettings,
            personalTipMemo: current.personalTipMemo ?? '',
            activeSource: variables.activeSource ?? 'adjusted',
          };
        });
      }
    },
    onSuccess: async (data, variables) => {
      const nextSource: SettingsActiveSource =
        variables.activeSource ?? data.activeSource ?? 'adjusted';
      const nextCustom = data.customSettings ?? variables.customSettings ?? {};
      queryClient.setQueryData(prefsQueryKey, {
        customSettings: nextCustom,
        personalTipMemo: data.personalTipMemo ?? '',
        activeSource: nextSource,
      });
      setCustomSettings(nextCustom);
      customSettingsRef.current = nextCustom;
      // Keep history summary prefs in sync immediately after 조정값 저장.
      queryClient.setQueriesData(
        { queryKey: ['history-settings-comparison'] },
        (prev: unknown) => {
          if (!prev || typeof prev !== 'object') return prev;
          const row = prev as {
            preferencesByMachine?: Record<string, Partial<RecommendationSettings>>;
            activeSourceByMachine?: Record<string, SettingsActiveSource>;
            feedbackByRecommendation?: Record<string, FitRating | null>;
          };
          if (!row.preferencesByMachine) return prev;
          const nextPrefs = { ...row.preferencesByMachine };
          nextPrefs[machineCode] = nextCustom;
          const nextActive = { ...(row.activeSourceByMachine ?? {}) };
          nextActive[machineCode] = nextSource;
          return {
            ...row,
            preferencesByMachine: nextPrefs,
            activeSourceByMachine: nextActive,
          };
        }
      );
      // Do not refetch prefs here — response + setQueryData already match the UI.
      // A concurrent/stale GET could briefly write the previous weight (90) back.
      await invalidateHistoryComparison();
      setSettingsDirty(false);
      showToast(t('machines:feedback.preferencesSaved'), 'success');
    },
    onError: () => showToast(t('machines:feedback.preferencesSaveFailed'), 'error'),
  });

  const handleRating = (fitRating: FitRating) => {
    if (fitRating === 'bad' && recommendedSettings) {
      // Keep in-progress / already-shown adjusted values.
      // Re-tapping 「셋팅값 조정 필요」 used to always reload savedPreferences and
      // wipe a newer local edit (e.g. 70 saved → edit 90 → tap again → back to 70).
      setCustomSettings((prev) => {
        if (hasMeaningfulCustomSettings(prev)) return prev;
        const fromRef = customSettingsRef.current;
        if (hasMeaningfulCustomSettings(fromRef)) return fromRef;
        if (savedPreferences && hasMeaningfulCustomSettings(savedPreferences)) {
          return savedPreferences;
        }
        return seedCustomSettingsFromRecommendation(recommendedSettings);
      });
      setSettingsDirty((dirty) => {
        if (dirty && hasMeaningfulCustomSettings(customSettingsRef.current)) return true;
        return false;
      });
    }
    feedbackMutation.mutate(fitRating);
  };

  /** Keep history 「총 볼륨」 in sync with on-screen 조정횟수 (same as weight→setWeights). */
  const patchHistoryComparisonPrefs = (nextCustom: Partial<RecommendationSettings>) => {
    queryClient.setQueriesData(
      { queryKey: ['history-settings-comparison'] },
      (prev: unknown) => {
        if (!prev || typeof prev !== 'object') return prev;
        const row = prev as {
          preferencesByMachine?: Record<string, Partial<RecommendationSettings>>;
          activeSourceByMachine?: Record<string, SettingsActiveSource>;
          feedbackByRecommendation?: Record<string, FitRating | null>;
        };
        if (!row.preferencesByMachine) return prev;
        return {
          ...row,
          preferencesByMachine: {
            ...row.preferencesByMachine,
            [machineCode]: nextCustom,
          },
          activeSourceByMachine: {
            ...(row.activeSourceByMachine ?? {}),
            [machineCode]: 'adjusted',
          },
        };
      }
    );
  };

  const handleCustomChange = (
    key: keyof RecommendationSettings,
    raw: string,
    type: 'number' | 'text' = 'text'
  ) => {
    setSettingsDirty(true);
    if (type === 'number') {
      const parsed = raw === '' ? undefined : Number.parseFloat(raw);
      setCustomSettings((prev) => {
        const next = {
          ...prev,
          [key]: parsed != null && Number.isFinite(parsed) ? parsed : undefined,
        };
        customSettingsRef.current = next;
        // Live-patch so 총 볼륨 picks up 조정횟수 like 총 중량 picks up 조정중량.
        patchHistoryComparisonPrefs(next);
        return next;
      });
      return;
    }

    setCustomSettings((prev) => {
      const next = {
        ...prev,
        [key]: raw.trim(),
      };
      customSettingsRef.current = next;
      patchHistoryComparisonPrefs(next);
      return next;
    });
  };

  // Only show 추천/조정 비교 when NOT on "추천값 잘맞음".
  // Saved adjusted weights may still exist in prefs, but good rating means AI-only UI.
  const showAdjustment =
    savedRating !== 'good' && (savedRating === 'bad' || activeSource === 'adjusted');
  const displayAdjustedSettings = showAdjustment
    ? hasMeaningfulCustomSettings(customSettings)
      ? customSettings
      : !settingsDirty && hasSavedPreferences
        ? savedPreferences
        : undefined
    : undefined;

  return {
    savedRating,
    customSettings,
    displayAdjustedSettings,
    activeSource,
    showAdjustment,
    hasSavedPreferences,
    handleRating,
    handleCustomChange,
    savePreferences: (onDone?: () => void) => {
      // Always read the latest edits — avoids closing over a stale customSettings
      // from an earlier render (N-1 save bug).
      const latestCustomSettings = customSettingsRef.current;
      preferenceMutation.mutate(
        { customSettings: latestCustomSettings, activeSource: 'adjusted' },
        {
          onSuccess: (data) => {
            const saved = data.customSettings ?? latestCustomSettings;
            queryClient.setQueryData(feedbackQueryKey, 'bad');
            queryClient.setQueryData(prefsQueryKey, {
              customSettings: saved,
              personalTipMemo: data.personalTipMemo ?? '',
              activeSource: 'adjusted' as SettingsActiveSource,
            });
            setCustomSettings(saved);
            customSettingsRef.current = saved;
            onDone?.();
          },
        }
      );
    },
    isFeedbackPending: feedbackMutation.isPending,
    isPreferencesPending: preferenceMutation.isPending,
  };
}
