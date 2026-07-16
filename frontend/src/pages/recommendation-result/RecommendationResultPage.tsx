import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { RecommendationResult } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { RecommendationTips } from '@/components/recommendation/RecommendationTips/RecommendationTips';
import { RecommendationWarnings } from '@/components/recommendation/RecommendationWarnings/RecommendationWarnings';
import { RecommendationActionBar } from '@/components/recommendation/RecommendationActionBar/RecommendationActionBar';
import { favoriteApi, recommendationApi } from '@/api';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';
import '@/styles/recommendation.css';

function ResultLoadingSkeleton() {
  return (
    <div className="recommendation-settings-panel" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <div key={i} className="setting-value-card-skeleton skeleton" />
      ))}
    </div>
  );
}

export function RecommendationResultPage() {
  const [searchParams] = useSearchParams();
  const recommendationId = searchParams.get('id');
  const location = useLocation();
  const { t } = useTranslation(['machines', 'common']);
  const stateResult = location.state?.result as RecommendationResult | undefined;
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
    mutationFn: () => favoriteApi.add(result!.machineCode, result!.id),
    onSuccess: () => showToast(t('common:actions.save'), 'success'),
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  if (!stateResult && recommendationId && isLoading) {
    return (
      <PageShell title={t('recommendation.title')}>
        <ResultLoadingSkeleton />
      </PageShell>
    );
  }

  if (!stateResult && recommendationId && isError) {
    return (
      <PageShell title={t('common:errors.notFound')}>
        <QueryErrorMessage />
      </PageShell>
    );
  }

  if (!result) {
    return (
      <PageShell title={t('common:errors.notFound')} subtitle={t('common:errors.loadFailed')}>
        <Link to={ROUTES.MACHINES} className="btn btn--secondary btn--block">
          {t('common:nav.machines')}
        </Link>
      </PageShell>
    );
  }

  const machineTitle = result.machineName ?? result.machineCode;

  return (
    <PageShell title={machineTitle} subtitle={result.machineCode}>
      <RecommendationSettingsPanel settings={result.settings} variant="hero" />
      <RecommendationWarnings warnings={result.warnings} />
      <RecommendationTips tips={result.tips} />
      <RecommendationActionBar
        machineCode={result.machineCode}
        onSave={() => favoriteMutation.mutate()}
        isSaving={favoriteMutation.isPending}
      />
    </PageShell>
  );
}
