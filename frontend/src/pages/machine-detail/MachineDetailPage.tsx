import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QUERY_KEYS } from '@/constants/query-keys';
import { machineApi } from '@/api';
import { useRecommendMachine } from '@/hooks/useRecommendMachine';
import '@/styles/components.css';

export function MachineDetailPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const { t } = useTranslation('machines');
  const { requestRecommendation, isPending } = useRecommendMachine(machineCode);

  const { data: machine, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.machine(machineCode!),
    queryFn: async () => {
      const res = await machineApi.getByCode(machineCode!);
      return res.data.data;
    },
    enabled: !!machineCode,
  });

  if (isLoading) return <Skeleton count={3} height={100} />;
  if (isError) return <PageShell title={t('error', { defaultValue: 'Error' })}><QueryErrorMessage /></PageShell>;
  if (!machine) return <PageShell title={t('notFound', { defaultValue: 'Not Found' })} />;

  const name = machine.name.en ?? machine.code;

  return (
    <PageShell title={name} subtitle={machine.code}>
      <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
        {machine.muscleGroup} · {machine.machineType}
      </p>
      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => requestRecommendation()}
        disabled={isPending}
      >
        {isPending ? t('recommendLoading', { defaultValue: 'Generating recommendation...' }) : t('recommend')}
      </button>
    </PageShell>
  );
}
