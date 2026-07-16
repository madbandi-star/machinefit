import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useSettingsStore } from '@/store/settings.store';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';
import '@/styles/recommendation.css';

function ResultLoadingSkeleton() {
  return (
    <div className="recommendation-settings-panel recommendation-settings-panel--dashboard" aria-hidden="true">
      <div className="setting-value-card-skeleton skeleton" />
      <div className="recommendation-settings-panel__grid">
        {[0, 1].map((i) => (
          <div key={i} className="setting-value-card-skeleton skeleton" />
        ))}
      </div>
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
  const queryClient = useQueryClient();
  const locale = useSettingsStore((s) => s.locale);

  const { data: fetchedResult, isLoading, isError } = useQuery({
    queryKey: ['recommendation', recommendationId, locale],
    queryFn: async () => {
      const res = await recommendationApi.getById(recommendationId!);
      return res.data.data;
    },
    enabled: !!recommendationId,
    placeholderData: stateResult,
  });

  const result = fetchedResult ?? stateResult;

  const favoriteMutation = useMutation({
    mutationFn: () => favoriteApi.add(result!.machineCode, result!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites });
      showToast(t('common:actions.save'), 'success');
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  if (recommendationId && isLoading && !result) {
    return (
      <PageShell title={t('recommendation.title')}>
        <ResultLoadingSkeleton />
      </PageShell>
    );
  }

  if (recommendationId && isError && !result) {
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
    <div className="recommendation-result-page">
      <header className="recommendation-result-page__header">
        <h1 className="recommendation-result-page__title">{machineTitle}</h1>
        <span className="recommendation-result-page__code">{result.machineCode}</span>
      </header>

      <div className="recommendation-result-page__content">
        <RecommendationWarnings warnings={result.warnings} />
        <RecommendationSettingsPanel settings={result.settings} variant="hero" />
        <RecommendationTips tips={result.tips} />
      </div>

      <RecommendationActionBar
        machineCode={result.machineCode}
        onSave={() => favoriteMutation.mutate()}
        isSaving={favoriteMutation.isPending}
        fixed
      />
    </div>
  );
}
