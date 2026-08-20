import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  isAllGymsId,
  isFreeWeightMachineCode,
  TARGET_MUSCLE_GROUPS,
  type Machine,
  type TargetMuscleGroup,
} from '@machinefit/shared';
import { brandApi, historyApi, machineApi, workoutCardApi, workoutLogApi } from '@/api';
import { EasyDuplicateReplacePanel } from '@/components/easy-mode/EasyDuplicateReplacePanel';
import { BrandFilterChips } from '@/components/machines/BrandFilterChips/BrandFilterChips';
import { FilterChips } from '@/components/machines/FilterChips/FilterChips';
import { MachineEmptyState } from '@/components/machines/MachineEmptyState/MachineEmptyState';
import { MachineHero } from '@/components/machines/MachineHero/MachineHero';
import { MachineListItem } from '@/components/machines/MachineListItem/MachineListItem';
import { SearchBar } from '@/components/navigation/SearchBar/SearchBar';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import {
  DEFAULT_SEARCH_BRAND_CODE,
  DEFAULT_SEARCH_MUSCLE_GROUP,
} from '@/constants/machine-search-defaults';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFavoritesList } from '@/hooks/useFavoritesList';
import { useAuthStore } from '@/store/auth.store';
import { getLocalDayRange, getTodayDateKey } from '@/utils/historyDate';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/machines.css';

export interface EasyMachinePickResult {
  code: string;
  name: string;
  brandName?: string;
  targetMuscle: TargetMuscleGroup | null;
}

interface EasyMachinePickerProps {
  open: boolean;
  onClose: () => void;
  /** Return false to keep the detail view (e.g. duplicate recommendation). */
  onConfirm: (pick: EasyMachinePickResult) => boolean | Promise<boolean>;
  /**
   * Delete today's existing recommendation for this machine and continue.
   * Shown as a prominent CTA when confirm is rejected for duplicate.
   */
  onReplaceExisting?: (pick: EasyMachinePickResult) => boolean | Promise<boolean>;
  /** Open directly on detail for a known code (recent/favorites). */
  initialCode?: string | null;
}

function planMachineKey(machineCode: string, targetMuscleGroup?: string | null): string {
  if (isFreeWeightMachineCode(machineCode) && targetMuscleGroup) {
    return `${machineCode}::${targetMuscleGroup}`;
  }
  return machineCode;
}

export function EasyMachinePicker({
  open,
  onClose,
  onConfirm,
  onReplaceExisting,
  initialCode = null,
}: EasyMachinePickerProps) {
  const { t, i18n } = useTranslation(['common', 'machines']);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeGymId } = useActiveGym();
  const { activeMemberId } = useActiveMember();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [muscleGroup, setMuscleGroup] = useState<string | null>(DEFAULT_SEARCH_MUSCLE_GROUP);
  const [brandCode, setBrandCode] = useState<string | null>(DEFAULT_SEARCH_BRAND_CODE);
  const [detail, setDetail] = useState<Machine | null>(null);
  const [targetMuscle, setTargetMuscle] = useState<TargetMuscleGroup | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const [replacePending, setReplacePending] = useState(false);
  /** Shown under confirm after duplicate / rejected confirm. */
  const [showReselect, setShowReselect] = useState(false);

  const badgeDate = isAuthenticated ? getTodayDateKey() : null;
  const dayRange = badgeDate ? getLocalDayRange(badgeDate) : null;
  const canLoadDayMarks =
    open &&
    Boolean(badgeDate) &&
    isAuthenticated &&
    Boolean(activeGymId) &&
    Boolean(activeMemberId) &&
    !isAllGymsId(activeGymId ?? '');

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setMuscleGroup(DEFAULT_SEARCH_MUSCLE_GROUP);
    setBrandCode(DEFAULT_SEARCH_BRAND_CODE);
    setDetail(null);
    setTargetMuscle(null);
    setShowReselect(false);
    setConfirmPending(false);
    setReplacePending(false);

    if (!initialCode) return;
    let cancelled = false;
    setDetailLoading(true);
    void machineApi
      .getByCode(initialCode)
      .then((res) => {
        if (cancelled) return;
        setDetail(res.data.data);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, initialCode]);

  const detailCode = detail?.code ?? '';
  const needsMuscleCover =
    Boolean(detailCode) && isFreeWeightMachineCode(detailCode) && Boolean(targetMuscle);

  // Mirror MachineDetailPage: refetch cover when freeweight 세부부위 changes.
  const { data: detailWithMuscle } = useQuery({
    queryKey: QUERY_KEYS.machine(detailCode, targetMuscle ?? undefined),
    queryFn: async () => {
      const res = await machineApi.getByCode(
        detailCode,
        targetMuscle ? { muscle: targetMuscle } : undefined
      );
      return res.data.data;
    },
    enabled: open && needsMuscleCover,
    placeholderData: (prev) => prev,
  });

  const { data: brands = [] } = useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async () => (await brandApi.list()).data.data,
    staleTime: 10 * 60_000,
    enabled: open,
  });

  const { data: dayPlans = [] } = useQuery({
    queryKey: QUERY_KEYS.workoutCardsList(activeGymId ?? '', activeMemberId ?? '', {
      scheduledDate: badgeDate ?? undefined,
    }),
    queryFn: async () => {
      const res = await workoutCardApi.list({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        scheduledDate: badgeDate!,
      });
      return res.data.data;
    },
    enabled: canLoadDayMarks,
    staleTime: 30_000,
  });

  const { data: dayHistory = [] } = useQuery({
    queryKey: QUERY_KEYS.historyList(activeGymId ?? '', activeMemberId ?? '', {
      from: badgeDate ?? undefined,
      to: badgeDate ?? undefined,
      limit: 100,
    }),
    queryFn: async () => {
      const res = await historyApi.list(activeGymId!, {
        memberId: activeMemberId!,
        from: dayRange!.from,
        to: dayRange!.to,
        limit: 100,
      });
      return res.data.data;
    },
    enabled: canLoadDayMarks && Boolean(dayRange),
    staleTime: 30_000,
  });

  const { data: dayLogs = [] } = useQuery({
    queryKey: QUERY_KEYS.workoutLogsList(activeGymId ?? '', activeMemberId ?? '', {
      from: badgeDate ?? undefined,
      to: badgeDate ?? undefined,
      limit: 100,
    }),
    queryFn: async () => {
      const res = await workoutLogApi.list({
        gymId: activeGymId!,
        memberId: activeMemberId!,
        logDate: badgeDate!,
        limit: 100,
      });
      return res.data.data;
    },
    enabled: canLoadDayMarks,
    staleTime: 30_000,
  });

  const plannedKeys = useMemo(() => {
    const keys = new Set<string>();
    const add = (machineCode: string, targetMuscleGroup?: string | null) => {
      keys.add(planMachineKey(machineCode, targetMuscleGroup));
      if (!isFreeWeightMachineCode(machineCode)) {
        keys.add(machineCode);
      }
    };
    for (const card of dayPlans) {
      add(card.machineCode, card.targetMuscleGroup);
    }
    for (const item of dayHistory) {
      add(item.machineCode, item.targetMuscleGroup);
    }
    for (const log of dayLogs) {
      add(log.machineCode, log.targetMuscleGroup);
    }
    return keys;
  }, [dayPlans, dayHistory, dayLogs]);

  const { data: favorites, isFetched: favoritesFetched } = useFavoritesList();
  const favoriteByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of favorites ?? []) {
      map.set(item.machineCode, item.id);
    }
    return map;
  }, [favorites]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QUERY_KEYS.machines, 'easy-picker', debouncedQuery, muscleGroup, brandCode],
    queryFn: async (): Promise<Machine[]> => {
      const params: Record<string, string | number> = {
        limit: 100,
      };
      if (muscleGroup) params.muscleGroup = muscleGroup;
      if (brandCode) params.brandCode = brandCode;
      if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
      const res = await machineApi.list(params);
      return res.data.data.items;
    },
    staleTime: 5 * 60_000,
    placeholderData: (prev) => prev,
    enabled: open && !detail && !detailLoading,
  });

  if (!open) return null;

  const needsMuscle = detail ? isFreeWeightMachineCode(detail.code) : false;
  const heroMachine =
    needsMuscle &&
    targetMuscle &&
    detailWithMuscle &&
    detailWithMuscle.code === detail?.code
      ? detailWithMuscle
      : detail;
  const canConfirm = Boolean(detail) && (!needsMuscle || Boolean(targetMuscle));
  const hasFilters = !!debouncedQuery.trim() || !!muscleGroup || !!brandCode;

  const goBackToList = () => {
    setDetail(null);
    setTargetMuscle(null);
    setShowReselect(false);
  };

  const buildPick = (): EasyMachinePickResult | null => {
    if (!detail) return null;
    if (needsMuscle && !targetMuscle) return null;
    const name = getLocalizedName(detail.name, i18n.language, detail.code);
    const brand =
      detail.brandName && !isFreeWeightMachineCode(detail.code)
        ? getLocalizedName(detail.brandName, i18n.language, '')
        : undefined;
    return {
      code: detail.code,
      name,
      brandName: brand || undefined,
      targetMuscle: needsMuscle ? targetMuscle : null,
    };
  };

  const confirm = async () => {
    if (!detail || confirmPending || replacePending) return;
    const pick = buildPick();
    if (!pick) return;
    setConfirmPending(true);
    try {
      const accepted = await onConfirm(pick);
      if (accepted === false) {
        setShowReselect(true);
      }
    } finally {
      setConfirmPending(false);
    }
  };

  const replaceExisting = async () => {
    if (!onReplaceExisting || replacePending || confirmPending) return;
    const pick = buildPick();
    if (!pick) return;
    setReplacePending(true);
    try {
      const accepted = await onReplaceExisting(pick);
      if (accepted === false) {
        setShowReselect(true);
      }
    } finally {
      setReplacePending(false);
    }
  };

  return (
    <div className="easy-picker" role="dialog" aria-modal="true" aria-label={t('easyMode.pickerTitle')}>
      <header className="easy-picker__top">
        <button
          type="button"
          className="easy-shell__icon-btn"
          onClick={() => {
            if (detail) {
              goBackToList();
              return;
            }
            onClose();
          }}
          aria-label={t('easyMode.back')}
        >
          ←
        </button>
        <h2 className="easy-shell__title">
          {detail ? t('easyMode.pickerDetailTitle') : t('easyMode.pickerTitle')}
        </h2>
        <button
          type="button"
          className="easy-shell__icon-btn"
          onClick={onClose}
          aria-label={t('easyMode.close')}
        >
          ✕
        </button>
      </header>

      <div className="easy-picker__body">
        {detailLoading ? (
          <Skeleton count={3} height={72} />
        ) : detail ? (
          <>
            <MachineHero machine={heroMachine!} selectedMuscle={targetMuscle} />
            {needsMuscle ? (
              <>
                <p className="easy-list__label">{t('easyMode.muscleTitle')}</p>
                <div className="easy-muscle-grid">
                  {TARGET_MUSCLE_GROUPS.map((group) => (
                    <button
                      key={group}
                      type="button"
                      className={`easy-fit__btn${targetMuscle === group ? ' easy-fit__btn--on' : ''}`}
                      onClick={() => {
                        setTargetMuscle(group);
                        setShowReselect(false);
                      }}
                    >
                      {t(`machines:muscleGroups.${group}`, { defaultValue: group })}
                    </button>
                  ))}
                </div>
                {!targetMuscle ? <p className="easy-hint">{t('easyMode.needMuscle')}</p> : null}
              </>
            ) : null}
          </>
        ) : (
          <div className="machine-search easy-picker__search">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder={t('machines:searchPlaceholder')}
            />
            <FilterChips value={muscleGroup} onChange={setMuscleGroup} />
            <BrandFilterChips brands={brands} value={brandCode} onChange={setBrandCode} />
            {isLoading && !data ? (
              <Skeleton count={5} height={72} />
            ) : !data?.length ? (
              <MachineEmptyState hasQuery={hasFilters} />
            ) : (
              <div className={`machine-list${isFetching ? ' machine-list--fetching' : ''}`}>
                {data.map((machine) => {
                  const alreadyPlanned = plannedKeys.has(
                    planMachineKey(
                      machine.code,
                      isFreeWeightMachineCode(machine.code) ? muscleGroup : null
                    )
                  );
                  return (
                    <MachineListItem
                      key={machine.id}
                      machine={machine}
                      selectedMuscle={muscleGroup}
                      alreadyPlanned={alreadyPlanned}
                      showFavorite
                      initialFavorited={favoritesFetched ? favoriteByCode.has(machine.code) : null}
                      initialFavoriteId={favoriteByCode.get(machine.code)}
                      onSelect={(m) => {
                        setDetail(m);
                        if (
                          isFreeWeightMachineCode(m.code) &&
                          muscleGroup &&
                          (TARGET_MUSCLE_GROUPS as readonly string[]).includes(muscleGroup)
                        ) {
                          setTargetMuscle(muscleGroup as TargetMuscleGroup);
                        } else {
                          setTargetMuscle(null);
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {detail && !detailLoading ? (
        <div className="easy-picker__footer">
          {showReselect && onReplaceExisting ? (
            <EasyDuplicateReplacePanel
              compact
              pending={replacePending}
              onReplace={() => void replaceExisting()}
              onPickAnother={goBackToList}
              onGoRecords={() => {
                onClose();
                navigate(`${ROUTES.RECORDS}?tab=history&date=${getTodayDateKey()}`);
              }}
            />
          ) : (
            <>
              <button
                type="button"
                className="easy-btn easy-btn--primary"
                disabled={!canConfirm || confirmPending || replacePending}
                onClick={() => void confirm()}
              >
                {confirmPending ? t('easyMode.working') : t('easyMode.pickerConfirm')}
              </button>
              {showReselect ? (
                <>
                  <button
                    type="button"
                    className="easy-btn easy-btn--secondary"
                    onClick={goBackToList}
                  >
                    {t('easyMode.pickerReselect')}
                  </button>
                  <button
                    type="button"
                    className="easy-btn easy-btn--ghost"
                    onClick={() => {
                      onClose();
                      navigate(`${ROUTES.RECORDS}?tab=history&date=${getTodayDateKey()}`);
                    }}
                  >
                    {t('easyMode.pickerGoRecords')}
                  </button>
                </>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
