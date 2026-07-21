import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Icon } from '@/components/icons/Icon';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { HistorySectionHeader } from '@/components/records/history-ui/HistorySectionHeader';
import { historyApi, machinePreferenceApi, recommendationFeedbackApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useActiveGym } from '@/hooks/useActiveGym';
import { useActiveMember } from '@/hooks/useActiveMember';
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
  const { t } = useTranslation(['machines', 'common']);
  const [expanded, setExpanded] = useState(true);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { activeGymId } = useActiveGym();
  const { activeMemberId, memberScopeReady } = useActiveMember();
  const memberKey = activeMemberId ?? '';

  const { data, isLoading, isFetched } = useQuery({
    queryKey: QUERY_KEYS.historyForMachine(activeGymId ?? '', memberKey, machineCode),
    queryFn: async () => {
      const res = await historyApi.list(activeGymId!, {
        machineCode,
        limit: 1,
        ...(activeMemberId ? { memberId: activeMemberId } : {}),
      });
      return res.data.data[0] ?? null;
    },
    enabled: isAuthenticated && Boolean(activeGymId) && memberScopeReady,
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

  const { data: machinePreferences } = useQuery({
    queryKey: ['machine-preferences', machineCode],
    queryFn: async () => machinePreferenceApi.get(machineCode),
    enabled: isAuthenticated && Boolean(data),
    staleTime: 60_000,
  });

  if (!isAuthenticated) return null;

  const resultUrl = data
    ? `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', machineCode)}?id=${data.recommendationId}`
    : null;
  const showSettingsCompare = shouldShowHistorySettingsCompare(fitRating);
  const showLoading = isLoading || !memberScopeReady;

  return (
    <section className="saved-settings-card" aria-label={t('machines:detail.lastRecommend')}>
      <div className="saved-settings-card__header">
        <span className="saved-settings-card__title">{t('machines:detail.lastRecommend')}</span>
        <div className="saved-settings-card__header-actions">
          {data ? (
            <button
              type="button"
              className="history-record-card__collapse"
              aria-expanded={expanded}
              aria-label={expanded ? t('common:collapse') : t('common:expand')}
              onClick={() => setExpanded((prev) => !prev)}
            >
              <ChevronDown
                size={17}
                strokeWidth={2.25}
                className={`history-record-card__collapse-icon${
                  expanded ? ' history-record-card__collapse-icon--open' : ''
                }`}
              />
            </button>
          ) : null}
          {resultUrl ? (
            <Link to={resultUrl} className="saved-settings-card__link">
              {t('machines:detail.viewLastResult')}
              <Icon name="chevronRight" size={16} />
            </Link>
          ) : null}
        </div>
      </div>
      {expanded ? (
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
                  customSettings={showSettingsCompare ? machinePreferences?.customSettings : undefined}
                />
              </Link>
            ) : showLoading ? (
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
      ) : data ? (
        <button
          type="button"
          className="saved-settings-card__expand"
          aria-expanded={false}
          onClick={() => setExpanded(true)}
        >
          <span>{t('common:expandCardDetails')}</span>
          <ChevronDown size={16} strokeWidth={2.25} aria-hidden />
        </button>
      ) : null}
      {data && expanded ? (
        <p className="saved-settings-card__date">
          {new Date(data.viewedAt).toLocaleDateString()}
        </p>
      ) : null}
    </section>
  );
}
