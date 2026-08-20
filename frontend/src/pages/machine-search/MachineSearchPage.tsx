import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Brand, Machine } from '@machinefit/shared';
import { isAllGymsId, isFreeWeightMachineCode } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { SearchBar } from '@/components/navigation/SearchBar/SearchBar';
import { FilterChips } from '@/components/machines/FilterChips/FilterChips';
import { BrandFilterChips } from '@/components/machines/BrandFilterChips/BrandFilterChips';
import { MachineListItem } from '@/components/machines/MachineListItem/MachineListItem';
import { RecentMachineSearches } from '@/components/machines/RecentMachineSearches/RecentMachineSearches';
import { MachineEmptyState } from '@/components/machines/MachineEmptyState/MachineEmptyState';
import { SearchLoadingExperience } from '@/components/machines/SearchLoadingExperience/SearchLoadingExperience';
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
import { useDeferredQueryEnabled } from '@/hooks/useDeferredQueryEnabled';
import { useFavoritesList } from '@/hooks/useFavoritesList';
import { useBrandFavorites } from '@/hooks/useBrandFavorites';
import { useMuscleGroupImageMap } from '@/hooks/useMuscleGroupImages';
import { useSearchInitialLoadingExperience } from '@/hooks/useSearchInitialLoadingExperience';
import {
  getLocalDayRange,
  getTodayDateKey,
  normalizeDateKey,
} from '@/utils/historyDate';
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
  // Explicit “전체” / missing → default 전체 (see machine-search-defaults).
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
  /** Draft text in the search field (does not hit the API while typing). */
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  /** Applied search term — updated only on Enter / search button / recent select. */
  const [appliedQuery, setAppliedQuery] = useState(() => searchParams.get('q') ?? '');
  const [muscleGroup, setMuscleGroup] = useState<string | null>(() =>
    resolveMuscleParam(searchParams.get('muscle'))
  );
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const [brandCode, setBrandCode] = useState<string | null>(() =>
    resolveBrandParam(searchParams.get('brand'))
  );
  const [recentSearches, setRecentSearches] = useState(() => getRecentMachineSearches());
  const planDateRaw = searchParams.get('planDate');
  const planDate = planDateRaw ? normalizeDateKey(planDateRaw) : null;
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  // Plan-add uses planDate; plain search still marks today’s already-added machines.
  const badgeDate = planDate ?? (isAuthenticated ? getTodayDateKey() : null);
  const dayRange = badgeDate ? getLocalDayRange(badgeDate) : null;
  const canLoadDayMarks =
    Boolean(badgeDate) &&
    isAuthenticated &&
    Boolean(activeGymId) &&
    Boolean(activeMemberId) &&
    memberScopeReady &&
    !isAllGymsId(activeGymId ?? '');
  // Catalog paints first; day badges after short idle.
  const dayMarksReady = useDeferredQueryEnabled(canLoadDayMarks, 220);

  useEffect(() => {
    setMuscleGroup(resolveMuscleParam(searchParams.get('muscle')));
    setBrandCode(resolveBrandParam(searchParams.get('brand')));
  }, [searchParams]);

  // Back/forward or shared URL: sync applied + draft from `q` only (not on muscle/brand edits).
  const urlQuery = searchParams.get('q') ?? '';
  useEffect(() => {
    setAppliedQuery(urlQuery);
    setQuery(urlQuery);
  }, [urlQuery]);

  // Default entry: muscle=전체 (omit), brand=전체 (`brand=all`).
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        let changed = false;
        if (next.get('muscle') === 'all') {
          next.delete('muscle');
          changed = true;
        }
        if (!next.has('brand')) {
          next.set('brand', 'all');
          changed = true;
        }
        next.delete('scope');
        return changed ? next : prev;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  const applySearchQuery = (raw: string) => {
    const trimmed = raw.trim();
    setQuery(trimmed);
    setAppliedQuery(trimmed);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (trimmed) next.set('q', trimmed);
        else next.delete('q');
        next.delete('scope');
        return next;
      },
      { replace: true }
    );
    if (trimmed.length >= 2) {
      setRecentSearches(pushRecentMachineSearch(trimmed));
      void import('@/utils/opsTelemetry').then(({ trackFeature }) =>
        trackFeature('machine_search')
      );
    }
  };

  const writeSearchParams = (patch: { muscle?: string | null; brand?: string | null }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const muscle = patch.muscle !== undefined ? patch.muscle : muscleGroup;
        const brand = patch.brand !== undefined ? patch.brand : brandCode;
        if (muscle) next.set('muscle', muscle);
        else next.delete('muscle');
        // null = 전체 → keep brand=all so entry default is not re-applied.
        if (brand === null) next.set('brand', 'all');
        else if (brand) next.set('brand', brand);
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

  const handleSearchSubmit = () => {
    applySearchQuery(query);
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
    applySearchQuery(value);
  };

  const handleRecentRemove = (value: string) => {
    setRecentSearches(removeRecentMachineSearch(value));
  };

  const handleRecentClearAll = () => {
    setRecentSearches(clearRecentMachineSearches());
  };

  const { data: brands = [], isLoading: brandsLoading, isError: brandsError, refetch: refetchBrands } =
    useQuery({
      queryKey: QUERY_KEYS.brands,
      queryFn: async () => {
        const res = await brandApi.list();
        return res.data.data;
      },
      staleTime: 10 * 60_000,
      retry: 3,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
    });

  const {
    data: favoriteBrandItems,
    isPending: favoriteBrandsPending,
    isError: favoriteBrandsError,
    refetch: refetchFavoriteBrands,
  } = useBrandFavorites();

  // Logged-in: only My Brands favorites (same list as 마이페이지 > 내 브랜드).
  // Guests: full catalog. Prefer catalog Brand rows; fall back to favorite payload fields.
  const brandsForFilter = useMemo((): Brand[] => {
    if (!isAuthenticated) return brands;
    const byId = new Map(brands.map((brand) => [brand.id, brand]));
    const ordered: Brand[] = [];
    for (const fav of favoriteBrandItems ?? []) {
      const fromCatalog = byId.get(fav.brandId);
      if (fromCatalog) {
        ordered.push(fromCatalog);
        continue;
      }
      if (!fav.brandCode) continue;
      ordered.push({
        id: fav.brandId,
        code: fav.brandCode,
        name: fav.brandName,
        logoUrl: fav.logoUrl,
        sortOrder: 0,
        isActive: true,
      });
    }
    return ordered;
  }, [brands, favoriteBrandItems, isAuthenticated]);

  // Keep brand chip skeletons until lists actually resolve (not just “fetched once”).
  const brandChipsLoading = !isAuthenticated
    ? brandsLoading || brandsError
    : !userId ||
      favoriteBrandsPending ||
      favoriteBrandsError ||
      brandsLoading ||
      brandsError ||
      // Favorites exist but chips not built yet (catalog / code race).
      ((favoriteBrandItems?.length ?? 0) > 0 && brandsForFilter.length === 0);

  useEffect(() => {
    if (!brandsError) return;
    const timer = window.setTimeout(() => void refetchBrands(), 1_500);
    return () => window.clearTimeout(timer);
  }, [brandsError, refetchBrands]);

  useEffect(() => {
    if (!isAuthenticated || !favoriteBrandsError) return;
    const timer = window.setTimeout(() => void refetchFavoriteBrands(), 1_500);
    return () => window.clearTimeout(timer);
  }, [favoriteBrandsError, isAuthenticated, refetchFavoriteBrands]);

  // Drop a selected brand that is no longer in the user's favorites.
  useEffect(() => {
    if (!isAuthenticated || brandChipsLoading) return;
    if (!brandCode) return;
    if (brandsForFilter.some((brand) => brand.code === brandCode)) return;
    setBrandCode(null);
    writeSearchParams({ brand: null });
    // writeSearchParams closes over muscle/brand — intentional one-shot clear
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandCode, brandsForFilter, brandChipsLoading, isAuthenticated]);

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
    enabled: dayMarksReady,
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
    enabled: dayMarksReady && Boolean(dayRange),
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
    enabled: dayMarksReady,
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
  const { ready: muscleImagesReady } = useMuscleGroupImageMap();
  const favoriteByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of favorites ?? []) {
      map.set(item.machineCode, item.id);
    }
    return map;
  }, [favorites]);

  const {
    data,
    isLoading,
    isFetching,
    isError: machinesError,
    isSuccess: machinesSuccess,
    refetch: refetchMachines,
  } = useQuery({
    queryKey: [...QUERY_KEYS.machines, 'search', appliedQuery, muscleGroup, brandCode],
    queryFn: async (): Promise<Machine[]> => {
      const params: Record<string, string | number> = {
        limit: 100,
      };
      if (muscleGroup) params.muscleGroup = muscleGroup;
      if (brandCode) params.brandCode = brandCode;
      if (appliedQuery.trim()) params.q = appliedQuery.trim();
      const res = await machineApi.list(params);
      const items = res.data.data?.items;
      return Array.isArray(items) ? items : [];
    },
    staleTime: 5 * 60_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 8_000),
  });

  useEffect(() => {
    if (!machinesError) return;
    const timer = window.setTimeout(() => void refetchMachines(), 1_500);
    return () => window.clearTimeout(timer);
  }, [machinesError, refetchMachines, appliedQuery, muscleGroup, brandCode]);

  const hasFilters = !!appliedQuery.trim() || !!muscleGroup || !!brandCode;
  // No error banners/buttons — keep skeletons until a successful list arrives.
  const showMachineSkeleton =
    brandChipsLoading ||
    isLoading ||
    isFetching ||
    machinesError ||
    !machinesSuccess ||
    data === undefined;

  // First-entry data bundle only (excludes background isFetching-only refetches).
  const initialBundlePending =
    !muscleImagesReady ||
    brandChipsLoading ||
    isLoading ||
    machinesError ||
    !machinesSuccess ||
    data === undefined;
  const machinesReady =
    machinesSuccess && !machinesError && data !== undefined && !isLoading;
  const loadingExperience = useSearchInitialLoadingExperience({
    muscleReady: muscleImagesReady,
    brandsReady: !brandChipsLoading,
    machinesReady,
    initialBundlePending,
  });
  const showListSkeleton = showMachineSkeleton || loadingExperience.visible;

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
        <SearchBar
          value={query}
          onChange={handleQueryChange}
          onSubmit={handleSearchSubmit}
          placeholder={t('searchPlaceholder')}
        />
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
          loading={brandChipsLoading}
        />
        <h2 className="filter-section__title machine-search__results-title">
          {t('recommendedMachinesTitle')}
        </h2>
        {loadingExperience.visible ? (
          <SearchLoadingExperience
            progress={loadingExperience.progress}
            stageLabel={loadingExperience.stageLabel}
          />
        ) : null}
        {showListSkeleton ? (
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
