import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { Icon } from '@/components/icons/Icon';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { HistorySectionHeader } from '@/components/records/history-ui/HistorySectionHeader';
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

function LastRecommendationSettingsSkeleton() {
  return (
    <div className="recommendation-settings-panel recommendation-settings-panel--history" aria-hidden="true">
      <div className="recommendation-settings-panel__grid recommendation-settings-panel__grid--history">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="history-mini-setting-wrap">
            <div className="setting-value-card-skeleton skeleton" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LastRecommendationSnippet({ machineCode }: LastRecommendationSnippetProps) {
  const { t } = useTranslation('machines');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading, isFetched } = useQuery({
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

  if (!isAuthenticated) return null;

  const resultUrl = data
    ? `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', machineCode)}?id=${data.recommendationId}`
    : null;
  const showSettingsCompare = shouldShowHistorySettingsCompare(fitRating);

  return (
    <section className="saved-settings-card" aria-label={t('detail.lastRecommend')}>
      <div className="saved-settings-card__header">
        <span className="saved-settings-card__title">{t('detail.lastRecommend')}</span>
        {resultUrl ? (
          <Link to={resultUrl} className="saved-settings-card__link">
            {t('detail.viewLastResult')}
            <Icon name="chevronRight" size={16} />
          </Link>
        ) : null}
      </div>
      <div className="history-page-premium machine-detail-last-settings">
        <article
          className={`history-record-card history-record-card--premium history-record-card--unlogged machine-detail-last-settings__card${
            !data && isFetched ? ' machine-detail-last-settings__card--empty' : ''
          }`}
        >
          <div className="history-record-card__section">
            {data ? (
              <Link
                to={resultUrl!}
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
            ) : isLoading ? (
              <LastRecommendationSettingsSkeleton />
            ) : (
              <>
                <HistorySectionHeader
                  title={t('history.settingsSectionTitle')}
                  icon={<SlidersHorizontal size={14} strokeWidth={2.25} aria-hidden />}
                />
                <div className="machine-detail-last-settings__empty">
                  <p className="machine-detail-last-settings__empty-title">
                    {t('detail.lastRecommendEmpty')}
                  </p>
                  <p className="machine-detail-last-settings__empty-hint">
                    {t('detail.lastRecommendEmptyHint')}
                  </p>
                </div>
              </>
            )}
          </div>
        </article>
      </div>
      {data ? (
        <p className="saved-settings-card__date">
          {new Date(data.viewedAt).toLocaleDateString()}
        </p>
      ) : null}
    </section>
  );
}
