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

function resolveBrandParam(raw: string | null): string {
  return raw?.trim() || DEFAULT_SEARCH_BRAND_CODE;
}

export function MachineSearchPage() {
  const { t } = useTranslation('machines');
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [muscleGroup, setMuscleGroup] = useState(() => resolveMuscleParam(searchParams.get('muscle')));
  const [brandCode, setBrandCode] = useState(() => resolveBrandParam(searchParams.get('brand')));

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setMuscleGroup(resolveMuscleParam(searchParams.get('muscle')));
    setBrandCode(resolveBrandParam(searchParams.get('brand')));
  }, [searchParams]);

  // Ensure defaults are reflected in the URL when landing without filters.
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        let changed = false;
        if (!next.get('muscle')?.trim()) {
          next.set('muscle', DEFAULT_SEARCH_MUSCLE_GROUP);
          changed = true;
        }
        if (!next.get('brand')?.trim()) {
          next.set('brand', DEFAULT_SEARCH_BRAND_CODE);
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

  const writeSearchParams = (patch: { muscle?: string; brand?: string }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const muscle = patch.muscle ?? muscleGroup;
        const brand = patch.brand ?? brandCode;
        next.set('muscle', muscle);
        next.set('brand', brand);
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

  const handleBrandChange = (value: string) => {
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
        brandCode,
      };
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
        {isLoading && !data ? (
          <Skeleton count={5} height={72} />
        ) : !data?.length ? (
          <MachineEmptyState hasQuery={hasFilters} />
        ) : (
          <div className={`machine-list${isFetching ? ' machine-list--fetching' : ''}`}>
            {data.map((machine) => (
              <MachineListItem key={machine.id} machine={machine} selectedMuscle={muscleGroup} />
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}
