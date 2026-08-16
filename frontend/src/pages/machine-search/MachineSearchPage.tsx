import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { isAllGymsId, isFreeWeightMachineCode } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { SearchBar } from '@/components/navigation/SearchBar/SearchBar';
import { FilterChips } from '@/components/machines/FilterChips/FilterChips';
import { BrandFilterChips } from '@/components/machines/BrandFilterChips/BrandFilterChips';
import { MachineListItem } from '@/components/machines/MachineListItem/MachineListItem';
import { RecentMachineSearches } from '@/components/machines/RecentMachineSearches/RecentMachineSearches';
import { MachineEmptyState } from '@/components/machines/MachineEmptyState/MachineEmptyState';
import { AdSlot } from '@/ads/AdSlot';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import {
  DEFAULT_SEARCH_BRAND_CODE,
  DEFAULT_SEARCH_MUSCLE_GROUP,
} from '@/constants/machine-search-defaults';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { brandApi, historyApi, machineApi, workoutCardApi, workoutLogApi } from '@/api';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
import { useAuthStore } from '@/store/auth.store';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFavoritesList } from '@/hooks/useFavoritesList';
import {
  getLocalDayRange,
  getTodayDateKey,
  normalizeDateKey,
} from '@/utils/historyDate';
import { useBrandFavorites } from '@/hooks/useBrandFavorites';
import {
  clearRecentMachineSearches,
  getRecentMachineSearches,
  pushRecentMachineSearch,
  removeRecentMachineSearch,
} from '@/utils/recentMachineSearches';
import { Seo } from '@/seo/Seo';
import { breadcrumbJsonLd, brandCollectionJsonLd } from '@/seo/jsonLd';
import '@/styles/machines.css';

function resolveMuscleParam(raw: string | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === 'all') return DEFAULT_SEARCH_MUSCLE_GROUP;
  return trimmed;
}

function resolveBrandParam(raw: string | null): string | null {
  const trimmed = raw?.trim();
  if (!trimmed || trimmed === 'all') return DEFAULT_SEARCH_BRAND_CODE;
  return trimmed;
}

function planMachineKey(machineCode: string, targetMuscleGroup?: string | null): string {
  if (isFreeWeightMachineCode(machineCode) && targetMuscleGroup) {
    return `${machineCode}::${targetMuscleGroup}`;
  }
  return machineCode;
}

export function MachineSearchPage() {
  const { t } = useTranslation('machines');
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [muscleGroup, setMuscleGroup] = useState<string | null>(() =>
    resolveMuscleParam(searchParams.get('muscle'))
  );
  const [brandCode, setBrandCode] = useState<string | null>(() =>
    resolveBrandParam(searchParams.get('brand'))
  );
  const [recentSearches, setRecentSearches] = useState(() => getRecentMachineSearches());
  const planDateRaw = searchParams.get('planDate');
  const planDate = planDateRaw ? normalizeDateKey(planDateRaw) : null;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeGymId } = useActiveGym();
  const { activeMemberId } = useActiveMember();
  // Plan-add uses planDate; plain search still marks today’s already-added machines.
  const badgeDate = planDate ?? (isAuthenticated ? getTodayDateKey() : null);
  const dayRange = badgeDate ? getLocalDayRange(badgeDate) : null;
  const canLoadDayMarks =
    Boolean(badgeDate) &&
    isAuthenticated &&
    Boolean(activeGymId) &&
    Boolean(activeMemberId) &&
    !isAllGymsId(activeGymId ?? '');

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setMuscleGroup(resolveMuscleParam(searchParams.get('muscle')));
    setBrandCode(resolveBrandParam(searchParams.get('brand')));
  }, [searchParams]);

  // Drop legacy forced muscle=back so “전체” is the default. Preserve planDate.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        let changed = false;
        if (next.get('muscle') === 'all') {
          next.delete('muscle');
          changed = true;
        }
        if (next.get('brand') === 'all') {
          next.delete('brand');
          changed = true;
        }
        next.delete('scope');
        return changed ? next : prev;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debouncedQuery.trim()) next.set('q', debouncedQuery.trim());
        else next.delete('q');
        next.delete('scope');
        return next;
      },
      { replace: true }
    );
  }, [debouncedQuery, setSearchParams]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) return;
    setRecentSearches(pushRecentMachineSearch(trimmed));
    void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
      trackFeature('machine_search')
    );
  }, [debouncedQuery]);

  const writeSearchParams = (patch: { muscle?: string | null; brand?: string | null }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const muscle = patch.muscle !== undefined ? patch.muscle : muscleGroup;
        const brand = patch.brand !== undefined ? patch.brand : brandCode;
        if (muscle) next.set('muscle', muscle);
        else next.delete('muscle');
        if (brand) next.set('brand', brand);
        else next.delete('brand');
        next.delete('scope');
        return next;
      },
      { replace: true }
    );
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
  };

  const handleMuscleChange = (value: string | null) => {
    setMuscleGroup(value);
    writeSearchParams({ muscle: value });
  };

  const handleBrandChange = (value: string | null) => {
    setBrandCode(value);
    writeSearchParams({ brand: value });
  };

  const handleRecentSelect = (value: string) => {
    setQuery(value);
  };

  const handleRecentRemove = (value: string) => {
    setRecentSearches(removeRecentMachineSearch(value));
  };

  const handleRecentClearAll = () => {
    setRecentSearches(clearRecentMachineSearches());
  };

  const { data: brands = [] } = useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async () => {
      const res = await brandApi.list();
      return res.data.data;
    },
    staleTime: 10 * 60_000,
  });

  const { data: favoriteBrandItems, isFetched: favoriteBrandsFetched } = useBrandFavorites();

  const brandsForFilter = useMemo(() => {
    if (!isAuthenticated) return brands;
    if (!favoriteBrandsFetched) return [];
    const ids = new Set((favoriteBrandItems ?? []).map((item) => item.brandId));
    return brands.filter((brand) => ids.has(brand.id));
  }, [brands, favoriteBrandItems, favoriteBrandsFetched, isAuthenticated]);

  const favoriteBrandEmpty =
    isAuthenticated && favoriteBrandsFetched && brandsForFilter.length === 0;

  useEffect(() => {
    if (!isAuthenticated || !favoriteBrandsFetched) return;
    if (!brandCode) return;
    if (brandsForFilter.some((brand) => brand.code === brandCode)) return;
    setBrandCode(null);
    writeSearchParams({ brand: null });
    // writeSearchParams closes over brandCode/muscle — intentional one-shot clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandCode, brandsForFilter, favoriteBrandsFetched, isAuthenticated]);

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

  // Today’s recommends live in history (not only workout_cards). Future plan-add is cards-only.
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

  const { plannedKeys, plannedCount } = useMemo(() => {
    const keys = new Set<string>();
    const items = new Set<string>();
    const add = (machineCode: string, targetMuscleGroup?: string | null) => {
      const itemKey = planMachineKey(machineCode, targetMuscleGroup);
      items.add(itemKey);
      keys.add(itemKey);
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
    return { plannedKeys: keys, plannedCount: items.size };
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
    queryKey: [...QUERY_KEYS.machines, debouncedQuery, muscleGroup, brandCode],
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
  });

  const hasFilters = !!debouncedQuery.trim() || !!muscleGroup || !!brandCode;
  const recordsForDateUrl = planDate
    ? `${ROUTES.RECORDS}?tab=history&date=${encodeURIComponent(planDate)}`
    : ROUTES.RECORDS;

  return (
    <div className="machine-search">
      <Seo
        title="헬스장 머신 검색"
        description="머신핏에서 해머 스트렝스, 사이벡스, 라이프 피트니스, 테크노짐 등 헬스장 머신을 검색하고 맞춤 세팅을 확인하세요."
        path="/machines"
        robots={
          searchParams.toString() ? 'noindex,follow' : 'index,follow'
        }
        jsonLd={[
          brandCollectionJsonLd({
            name: '헬스장 머신 검색',
            description:
              '해머 스트렝스, 사이벡스, 라이프 피트니스, 테크노짐 등 헬스장 머신을 검색하고 맞춤 세팅을 확인하세요.',
            path: '/machines',
          }),
          breadcrumbJsonLd([
            { name: '홈', path: '/' },
            { name: '머신', path: '/machines' },
          ]),
        ]}
      />
      <PageShell>
        {planDate ? (
          <div className="machine-search__plan-banner" role="status">
            <div className="machine-search__plan-banner-text">
              <p className="machine-search__plan-banner-title">
                {t('history.planPickMoreTitle', { date: planDate })}
              </p>
              <p className="machine-search__plan-banner-meta">
                {t('history.planPickMoreCount', { count: plannedCount })}
              </p>
            </div>
            <Link to={recordsForDateUrl} className="btn btn--secondary machine-search__plan-banner-done">
              {t('history.planPickMoreDone')}
            </Link>
          </div>
        ) : null}
        <SearchBar value={query} onChange={handleQueryChange} placeholder={t('searchPlaceholder')} />
        <RecentMachineSearches
          items={recentSearches}
          onSelect={handleRecentSelect}
          onRemove={handleRecentRemove}
          onClearAll={handleRecentClearAll}
        />
        <FilterChips value={muscleGroup} onChange={handleMuscleChange} />
        <BrandFilterChips
          brands={brandsForFilter}
          value={brandCode}
          onChange={handleBrandChange}
          includeFallbacks={!isAuthenticated}
          emptyState={
            favoriteBrandEmpty ? (
              <div className="brand-filter-empty">
                <p className="brand-filter-empty__title">{t('brandFavorites.filterEmptyTitle')}</p>
                <p className="brand-filter-empty__hint">{t('brandFavorites.filterEmptyHint')}</p>
                <Link to={ROUTES.BRAND_FAVORITES} className="btn btn--secondary brand-filter-empty__cta">
                  {t('brandFavorites.filterEmptyCta')}
                </Link>
              </div>
            ) : undefined
          }
        />
        <h2 className="filter-section__title machine-search__results-title">
          {t('recommendedMachinesTitle')}
        </h2>
        {isLoading && !data ? (
          <Skeleton count={5} height={120} />
        ) : !data?.length ? (
          <MachineEmptyState hasQuery={hasFilters} />
        ) : (
          <div
            className={`machine-list machine-list--recommend${isFetching ? ' machine-list--fetching' : ''}`}
          >
            {data.map((machine, index) => {
              const alreadyPlanned = plannedKeys.has(
                planMachineKey(
                  machine.code,
                  isFreeWeightMachineCode(machine.code) ? muscleGroup : null
                )
              );
              return (
                <div key={machine.id}>
                  {index === 3 ? (
                    <AdSlot placement="SEARCH_NATIVE_MID" event="SEARCH_RESULT" />
                  ) : null}
                  <MachineListItem
                    machine={machine}
                    selectedMuscle={muscleGroup}
                    planDate={planDate}
                    alreadyPlanned={alreadyPlanned}
                    initialFavorited={favoritesFetched ? favoriteByCode.has(machine.code) : null}
                    initialFavoriteId={favoriteByCode.get(machine.code)}
                    showFavorite
                  />
                </div>
              );
            })}
          </div>
        )}
      </PageShell>
    </div>
  );
}
