import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RecommendationResult } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { RecommendationCard } from '@/components/cards/RecommendationCard/RecommendationCard';
import { favoriteApi, recommendationApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

export function RecommendationResultPage() {
  const [searchParams] = useSearchParams();
  const recommendationId = searchParams.get('id');
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const stateResult = location.state?.result as RecommendationResult | undefined;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showToast = useUIStore((s) => s.showToast);

  const { data: fetchedResult, isLoading, isError } = useQuery({
    queryKey: ['recommendation', recommendationId],
    queryFn: async () => {
      const res = await recommendationApi.getById(recommendationId!);
      return res.data.data;
    },
    enabled: !!recommendationId && !stateResult,
  });

  const result = stateResult ?? fetchedResult;

  const favoriteMutation = useMutation({
    mutationFn: () =>
      favoriteApi.add(result!.machineCode, result!.id),
    onSuccess: () => showToast(t('actions.save'), 'success'),
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  if (!stateResult && recommendationId && isLoading) {
    return (
      <PageShell title={t('nav.machines')}>
        <Skeleton count={3} height={100} />
      </PageShell>
    );
  }

  if (!stateResult && recommendationId && isError) {
    return (
      <PageShell title={t('errors.notFound')}>
        <QueryErrorMessage />
      </PageShell>
    );
  }

  if (!result) {
    return (
      <PageShell title={t('errors.notFound')} subtitle={t('errors.loadFailed')}>
        <Link to={ROUTES.MACHINES} className="btn btn--secondary btn--block">
          {t('nav.machines')}
        </Link>
      </PageShell>
    );
  }

  return (
    <PageShell title="Your Recommendation" subtitle={result.machineCode}>
      <RecommendationCard result={result} />
      {result.warnings.length > 0 && (
        <div style={{ marginTop: '1rem', color: 'var(--color-error)', fontSize: '0.9rem' }}>
          <strong>Warnings:</strong>
          <ul style={{ paddingLeft: '1.25rem' }}>
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
        {isAuthenticated ? (
          <button
            className="btn btn--primary btn--block"
            onClick={() => favoriteMutation.mutate()}
            disabled={favoriteMutation.isPending}
          >
            ⭐ {t('actions.save')}
          </button>
        ) : (
          <Link to={ROUTES.LOGIN} className="btn btn--secondary btn--block">
            {t('nav.login')}
          </Link>
        )}
        <Link
          to={`${ROUTES.GYMS}?machineCode=${result.machineCode}`}
          className="btn btn--secondary btn--block"
        >
          📍 {t('nav.gyms')}
        </Link>
        <button
          className="btn btn--secondary btn--block"
          onClick={() => navigate(ROUTES.MACHINE_DETAIL.replace(':machineCode', result.machineCode))}
        >
          {t('actions.back')}
        </button>
      </div>
    </PageShell>
  );
}
