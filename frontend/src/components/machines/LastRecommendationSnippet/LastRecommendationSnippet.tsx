import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icons/Icon';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { historyApi, machinePreferenceApi, recommendationFeedbackApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { shouldShowHistorySettingsCompare } from '@/utils/recommendationSettingsCompare';
import '@/styles/machines.css';
import '@/styles/recommendation.css';
import '@/styles/records.css';
import '@/styles/history-premium.css';

interface LastRecommendationSnippetProps {
  machineCode: string;
}

export function LastRecommendationSnippet({ machineCode }: LastRecommendationSnippetProps) {
  const { t } = useTranslation('machines');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data } = useQuery({
    queryKey: QUERY_KEYS.historyForMachine(machineCode),
    queryFn: async () => {
      const res = await historyApi.list({ machineCode, limit: 1 });
      return res.data.data[0] ?? null;
    },
    enabled: isAuthenticated,
  });

  const recommendationId = data?.recommendationId;

  const { data: fitRating } = useQuery({
    queryKey: ['recommendation-feedback', recommendationId],
    queryFn: async () => {
      const rating = await recommendationFeedbackApi.get(recommendationId!);
      return rating ?? null;
    },
    enabled: isAuthenticated && Boolean(recommendationId),
    staleTime: 60_000,
  });

  const { data: customSettings } = useQuery({
    queryKey: ['machine-preferences', machineCode],
    queryFn: async () => {
      const settings = await machinePreferenceApi.get(machineCode);
      return settings ?? {};
    },
    enabled: isAuthenticated && Boolean(data),
    staleTime: 60_000,
  });

  if (!isAuthenticated || !data) return null;

  const resultUrl = `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', machineCode)}?id=${data.recommendationId}`;
  const showSettingsCompare = shouldShowHistorySettingsCompare(fitRating);

  return (
    <section className="saved-settings-card" aria-label={t('detail.lastRecommend')}>
      <div className="saved-settings-card__header">
        <span className="saved-settings-card__title">{t('detail.lastRecommend')}</span>
        <Link to={resultUrl} className="saved-settings-card__link">
          {t('detail.viewLastResult')}
          <Icon name="chevronRight" size={16} />
        </Link>
      </div>
      <div className="history-page-premium machine-detail-last-settings">
        <article className="history-record-card history-record-card--premium history-record-card--unlogged machine-detail-last-settings__card">
          <div className="history-record-card__section">
            <Link
              to={resultUrl}
              className="history-record-card__settings-link"
              aria-label={t('detail.viewLastResult')}
            >
              <RecommendationSettingsPanel
                settings={data.settings}
                variant="history"
                showAdjustment={showSettingsCompare}
                adjustmentReadOnly
                customSettings={showSettingsCompare ? customSettings : undefined}
              />
            </Link>
          </div>
        </article>
      </div>
      <p className="saved-settings-card__date">
        {new Date(data.viewedAt).toLocaleDateString()}
      </p>
    </section>
  );
}
