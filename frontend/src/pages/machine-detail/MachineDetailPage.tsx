import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { MachineHero } from '@/components/machines/MachineHero/MachineHero';
import { LastRecommendationSnippet } from '@/components/machines/LastRecommendationSnippet/LastRecommendationSnippet';
import { RecommendCTA } from '@/components/machines/RecommendCTA/RecommendCTA';
import { QUERY_KEYS } from '@/constants/query-keys';
import { historyApi, machineApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/components.css';
import '@/styles/machines.css';
import '@/styles/records.css';

export function MachineDetailPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const { t } = useTranslation('machines');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: machine, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.machine(machineCode!),
    queryFn: async () => {
      const res = await machineApi.getByCode(machineCode!);
      return res.data.data;
    },
    enabled: !!machineCode,
  });

  const { data: lastHistory } = useQuery({
    queryKey: QUERY_KEYS.historyForMachine(machineCode!),
    queryFn: async () => {
      const res = await historyApi.list({ machineCode: machineCode!, limit: 1 });
      return res.data.data[0] ?? null;
    },
    enabled: !!machineCode && isAuthenticated,
  });

  if (isLoading) return <Skeleton count={3} height={100} />;
  if (isError) {
    return (
      <PageShell title={t('error', { defaultValue: 'Error' })}>
        <QueryErrorMessage />
      </PageShell>
    );
  }
  if (!machine) {
    return <PageShell title={t('notFound', { defaultValue: 'Not Found' })} />;
  }

  const hasSavedSettings = !!lastHistory;

  return (
    <div className={`machine-detail-page${hasSavedSettings ? ' machine-detail-page--compact' : ''}`}>
      <MachineHero machine={machine} compact={hasSavedSettings} />
      {machineCode && <LastRecommendationSnippet machineCode={machineCode} />}
      {machineCode && <RecommendCTA machineCode={machineCode} fixed={hasSavedSettings} />}
    </div>
  );
}
