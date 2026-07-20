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
import { filterMachinesByEquipmentScope, type EquipmentScope } from '@/utils/machineEquipmentScope';

function readEquipmentScope(value: string | null): EquipmentScope {
  return value === 'all' ? 'all' : 'machines_only';
}

export function MachineSearchPage() {
  const { t } = useTranslation('machines');
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '');
  const [muscleGroup, setMuscleGroup] = useState<string | null>(
    () => searchParams.get('muscle')
  );
  const [brandCode, setBrandCode] = useState<string | null>(() => searchParams.get('brand'));
  const [equipmentScope, setEquipmentScope] = useState<EquipmentScope>(() =>
    readEquipmentScope(searchParams.get('scope'))
  );

  useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
    setMuscleGroup(searchParams.get('muscle'));
    setBrandCode(searchParams.get('brand'));
    setEquipmentScope(readEquipmentScope(searchParams.get('scope')));
  }, [searchParams]);

  const writeSearchParams = (patch: {
    q?: string;
    muscle?: string | null;
    brand?: string | null;
    scope?: EquipmentScope;
  }) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const q = patch.q !== undefined ? patch.q : query;
        const muscle = patch.muscle !== undefined ? patch.muscle : muscleGroup;
        const brand = patch.brand !== undefined ? patch.brand : brandCode;
        const scope = patch.scope !== undefined ? patch.scope : equipmentScope;

        if (q.trim()) next.set('q', q.trim());
        else next.delete('q');

        if (muscle) next.set('muscle', muscle);
        else next.delete('muscle');

        if (brand) next.set('brand', brand);
        else next.delete('brand');

        if (scope && scope !== 'machines_only') next.set('scope', scope);
        else next.delete('scope');

        return next;
      },
      { replace: true }
    );
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    writeSearchParams({ q: value });
  };

  const handleMuscleChange = (value: string | null) => {
    setMuscleGroup(value);
    writeSearchParams({ muscle: value });
  };

  const handleBrandChange = (value: string | null) => {
    setBrandCode(value);
    writeSearchParams({ brand: value });
  };

  const handleScopeChange = (value: EquipmentScope) => {
    setEquipmentScope(value);
    writeSearchParams({ scope: value });
  };

  const { data: brands = [] } = useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async () => {
      const res = await brandApi.list();
      return res.data.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.machines, query, muscleGroup, brandCode, equipmentScope],
    queryFn: async (): Promise<Machine[]> => {
      const params: Record<string, string | number> = { limit: 100 };
      if (muscleGroup) params.muscleGroup = muscleGroup;
      if (brandCode) params.brandCode = brandCode;
      if (query.trim()) params.q = query.trim();
      const res = await machineApi.list(params);
      return filterMachinesByEquipmentScope(res.data.data.items, equipmentScope);
    },
  });

  const hasFilters = !!query.trim() || !!muscleGroup || !!brandCode;

  return (
    <div className="machine-search">
      <PageShell title={t('searchTitle')}>
        <SearchBar value={query} onChange={handleQueryChange} placeholder={t('searchPlaceholder')} />
        <FilterChips value={muscleGroup} onChange={handleMuscleChange} />
        <BrandFilterChips
          brands={brands}
          value={brandCode}
          onChange={handleBrandChange}
          equipmentScope={equipmentScope}
          onEquipmentScopeChange={handleScopeChange}
        />
        {isLoading ? (
          <Skeleton count={5} height={72} />
        ) : !data?.length ? (
          <MachineEmptyState hasQuery={hasFilters} />
        ) : (
          <div className="machine-list">
            {data.map((machine) => (
              <MachineListItem key={machine.id} machine={machine} selectedMuscle={muscleGroup} />
            ))}
          </div>
        )}
      </PageShell>
    </div>
  );
}
