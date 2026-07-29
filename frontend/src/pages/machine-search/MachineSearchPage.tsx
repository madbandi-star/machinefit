import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { SearchBar } from '@/components/navigation/SearchBar/SearchBar';
import { FilterChips } from '@/components/machines/FilterChips/FilterChips';
import { BrandFilterChips } from '@/components/machines/BrandFilterChips/BrandFilterChips';
import { MachineListItem } from '@/components/machines/MachineListItem/MachineListItem';
import { MachineEmptyState } from '@/components/machines/MachineEmptyState/MachineEmptyState';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import {
  DEFAULT_SEARCH_BRAND_CODE,
  DEFAULT_SEARCH_MUSCLE_GROUP,
} from '@/constants/machine-search-defaults';
import { QUERY_KEYS } from '@/constants/query-keys';
import { brandApi, machineApi } from '@/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

function resolveMuscleParam(raw: string | null): string {
  return raw?.trim() || DEFAULT_SEARCH_MUSCLE_GROUP;
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
  const [muscleGroup, setMuscleGroup] = useState(() => resolveMuscleParam(searchParams.get('muscle')));
  const [brandCode, setBrandCode] = useState<string | null>(() =>
    resolveBrandParam(searchParams.get('brand'))
  );

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setMuscleGroup(resolveMuscleParam(searchParams.get('muscle')));
    setBrandCode(resolveBrandParam(searchParams.get('brand')));
  }, [searchParams]);

  // Ensure muscle default is in the URL; brand default is “all” (no brand param).
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        let changed = false;
        if (!next.get('muscle')?.trim()) {
          next.set('muscle', DEFAULT_SEARCH_MUSCLE_GROUP);
          changed = true;
        }
        // Drop legacy forced BODYWEIGHT default so “전체” is selected.
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

  const writeSearchParams = (patch: { muscle?: string; brand?: string | null }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const muscle = patch.muscle ?? muscleGroup;
        const brand = patch.brand !== undefined ? patch.brand : brandCode;
        next.set('muscle', muscle);
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

  const handleMuscleChange = (value: string) => {
    setMuscleGroup(value);
    writeSearchParams({ muscle: value });
  };

  const handleBrandChange = (value: string | null) => {
    setBrandCode(value);
    writeSearchParams({ brand: value });
  };

  const { data: brands = [] } = useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async () => {
      const res = await brandApi.list();
      return res.data.data;
    },
    staleTime: 10 * 60_000,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...QUERY_KEYS.machines, debouncedQuery, muscleGroup, brandCode],
    queryFn: async (): Promise<Machine[]> => {
      const params: Record<string, string | number> = {
        limit: 100,
        muscleGroup,
      };
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
          <div className={`machine-list machine-list--recommend${isFetching ? ' machine-list--fetching' : ''}`}>
            {data.map((machine) => (
              <MachineListItem key={machine.id} machine={machine} selectedMuscle={muscleGroup} />
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}
