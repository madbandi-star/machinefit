import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { SearchBar } from '@/components/navigation/SearchBar/SearchBar';
import { FilterChips } from '@/components/machines/FilterChips/FilterChips';
import { BrandFilterChips } from '@/components/machines/BrandFilterChips/BrandFilterChips';
import { MachineListItem } from '@/components/machines/MachineListItem/MachineListItem';
import { RecentMachineSearches } from '@/components/machines/RecentMachineSearches/RecentMachineSearches';
import { MachineEmptyState } from '@/components/machines/MachineEmptyState/MachineEmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import {
  DEFAULT_SEARCH_BRAND_CODE,
  DEFAULT_SEARCH_MUSCLE_GROUP,
} from '@/constants/machine-search-defaults';
import { QUERY_KEYS } from '@/constants/query-keys';
import { brandApi, machineApi } from '@/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useFavoritesList } from '@/hooks/useFavoritesList';
import {
  clearRecentMachineSearches,
  getRecentMachineSearches,
  pushRecentMachineSearch,
  removeRecentMachineSearch,
} from '@/utils/recentMachineSearches';

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

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setMuscleGroup(resolveMuscleParam(searchParams.get('muscle')));
    setBrandCode(resolveBrandParam(searchParams.get('brand')));
  }, [searchParams]);

  // Drop legacy forced muscle=back so “전체” is the default.
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

  return (
    <div className="machine-search">
      <PageShell>
        <SearchBar value={query} onChange={handleQueryChange} placeholder={t('searchPlaceholder')} />
        <RecentMachineSearches
          items={recentSearches}
          onSelect={handleRecentSelect}
          onRemove={handleRecentRemove}
          onClearAll={handleRecentClearAll}
        />
        <FilterChips value={muscleGroup} onChange={handleMuscleChange} />
        <BrandFilterChips brands={brands} value={brandCode} onChange={handleBrandChange} />
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
            {data.map((machine) => (
              <MachineListItem
                key={machine.id}
                machine={machine}
                selectedMuscle={muscleGroup}
                initialFavorited={favoritesFetched ? favoriteByCode.has(machine.code) : null}
                initialFavoriteId={favoriteByCode.get(machine.code)}
                showFavorite
              />
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}
