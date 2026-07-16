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
import { machineApi } from '@/api';
import { getLocalizedName } from '@/utils/localizedName';
import '@/styles/components.css';
import '@/styles/machines.css';

export function MachineDetailPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const { t, i18n } = useTranslation('machines');

  const { data: machine, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.machine(machineCode!),
    queryFn: async () => {
      const res = await machineApi.getByCode(machineCode!);
      return res.data.data;
    },
    enabled: !!machineCode,
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

  const name = getLocalizedName(machine.name, i18n.language, machine.code);

  return (
    <PageShell title={name}>
      <div className="machine-detail-content">
        <MachineHero machine={machine} />
        {machineCode && <LastRecommendationSnippet machineCode={machineCode} />}
        {machineCode && <RecommendCTA machineCode={machineCode} />}
      </div>
    </PageShell>
  );
}
