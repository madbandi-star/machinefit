import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Machine } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { SearchBar } from '@/components/navigation/SearchBar/SearchBar';
import { MachineCard } from '@/components/cards/MachineCard/MachineCard';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QUERY_KEYS } from '@/constants/query-keys';
import { machineApi } from '@/api';

export function MachineSearchPage() {
  const { t } = useTranslation('machines');
  const { t: tCommon } = useTranslation();
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.machines, query],
    queryFn: async (): Promise<Machine[]> => {
      if (query) {
        const res = await machineApi.search(query);
        return res.data.data;
      }
      const res = await machineApi.list();
      return res.data.data.items;
    },
  });

  return (
    <PageShell title={t('search')} subtitle={tCommon('nav.machines')}>
      <SearchBar value={query} onChange={setQuery} placeholder={t('search')} />
      {isLoading ? (
        <Skeleton count={5} height={80} />
      ) : (
        <div className="card-grid">
          {data?.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
