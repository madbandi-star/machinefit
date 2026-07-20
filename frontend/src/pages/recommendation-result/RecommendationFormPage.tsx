import { useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isFreeWeightMachineCode } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { useRecommendMachine } from '@/hooks/useRecommendMachine';
import { ROUTES } from '@/constants/routes';

export function RecommendationFormPage() {
  const { machineCode } = useParams<{ machineCode: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['machines', 'common']);
  const { requestRecommendation, isPending, isError, reset } = useRecommendMachine(machineCode);
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

  const detailPath = machineCode
    ? ROUTES.MACHINE_DETAIL.replace(':machineCode', machineCode)
    : ROUTES.MACHINES;

  const handleRetry = () => {
    reset();
    started.current = true;
    requestRecommendation();
  };

  if (isError && !isPending) {
    return (
      <PageShell title={t('machines:recommend')}>
        <QueryErrorMessage />
        <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn--primary btn--block" onClick={handleRetry}>
            {t('common:actions.retry', { defaultValue: '다시 시도' })}
          </button>
          <Link to={detailPath} className="btn btn--secondary btn--block" replace>
            {t('common:actions.back', { defaultValue: '돌아가기' })}
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title={t('machines:recommend')}>
      <Skeleton count={3} height={100} />
      {isPending && (
        <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {t('machines:recommendLoading', { defaultValue: 'Generating recommendation...' })}
        </p>
      )}
    </PageShell>
  );
}
