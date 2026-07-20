import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { useRecommendMachine } from '@/hooks/useRecommendMachine';
import { ROUTES } from '@/constants/routes';

export function RecommendationFormPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('machines');
  const { requestRecommendation, isPending } = useRecommendMachine(machineCode);
  const started = useRef(false);

  useEffect(() => {
    if (!machineCode || started.current) return;
    started.current = true;

    if (isFreeWeightMachineCode(machineCode)) {
      navigate(ROUTES.MACHINE_DETAIL.replace(':machineCode', machineCode), { replace: true });
      return;
    }

    requestRecommendation();
  }, [machineCode, navigate, requestRecommendation]);

  return (
    <PageShell title={t('recommend')}>
      <Skeleton count={3} height={100} />
      {isPending && (
        <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {t('recommendLoading', { defaultValue: 'Generating recommendation...' })}
        </p>
      )}
    </PageShell>
  );
}
