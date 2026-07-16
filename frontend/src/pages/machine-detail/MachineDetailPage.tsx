import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { ROUTES } from '@/constants/routes';
import { QUERY_KEYS } from '@/constants/query-keys';
import { machineApi } from '@/api';
import '@/styles/components.css';

export function MachineDetailPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const { t } = useTranslation('machines');

  const { data: machine, isLoading } = useQuery({
    queryKey: QUERY_KEYS.machine(machineCode!),
    queryFn: async () => {
      const res = await machineApi.getByCode(machineCode!);
      return res.data.data;
    },
    enabled: !!machineCode,
  });

  if (isLoading) return <Skeleton count={3} height={100} />;
  if (!machine) return <PageShell title="Not Found" />;

  const name = machine.name.en ?? machine.code;

  return (
    <PageShell title={name} subtitle={machine.code}>
      <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
        {machine.muscleGroup} · {machine.machineType}
      </p>
      <Link
        to={ROUTES.RECOMMEND.replace(':machineCode', machine.code)}
        className="btn btn--primary btn--block"
      >
        {t('recommend')}
      </Link>
    </PageShell>
  );
}
