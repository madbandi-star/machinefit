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
import { QUERY_KEYS } from '@/constants/query-keys';
import { brandApi, machineApi } from '@/api';
import '@/styles/machines.css';

export function MachineSearchPage() {
  const { t } = useTranslation('machines');
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [muscleGroup, setMuscleGroup] = useState<string | null>(
    () => searchParams.get('muscle')
  );
  const [brandCode, setBrandCode] = useState<string | null>(() => searchParams.get('brand'));

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setMuscleGroup(searchParams.get('muscle'));
    setBrandCode(searchParams.get('brand'));
  }, [searchParams]);

  const { data: brands = [] } = useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async () => {
      const res = await brandApi.list();
      return res.data.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.machines, query, muscleGroup, brandCode],
    queryFn: async (): Promise<Machine[]> => {
      const params: Record<string, string | number> = { limit: 100 };
      if (muscleGroup) params.muscleGroup = muscleGroup;
      if (brandCode) params.brandCode = brandCode;
      if (query.trim()) params.q = query.trim();
      const res = await machineApi.list(params);
      return res.data.data.items;
    },
  });

  const hasFilters = !!query.trim() || !!muscleGroup || !!brandCode;

  return (
    <div className="machine-search">
      <PageShell title={t('searchTitle')}>
        <SearchBar value={query} onChange={setQuery} placeholder={t('searchPlaceholder')} />
        <FilterChips value={muscleGroup} onChange={setMuscleGroup} />
        <BrandFilterChips brands={brands} value={brandCode} onChange={setBrandCode} />
        {isLoading ? (
          <Skeleton count={5} height={72} />
        ) : !data?.length ? (
          <MachineEmptyState hasQuery={hasFilters} />
        ) : (
          <div className="machine-list">
            {data.map((machine) => (
              <MachineListItem key={machine.id} machine={machine} />
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}
