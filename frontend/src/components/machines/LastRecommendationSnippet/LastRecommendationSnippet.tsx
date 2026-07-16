import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/icons/Icon';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { historyApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/machines.css';
import '@/styles/recommendation.css';
import '@/styles/records.css';

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

  if (!isAuthenticated || !data) return null;

  const resultUrl = `${ROUTES.RECOMMEND_RESULT.replace(':machineCode', machineCode)}?id=${data.recommendationId}`;

  return (
    <section className="saved-settings-card" aria-label={t('detail.lastRecommend')}>
      <div className="saved-settings-card__header">
        <span className="saved-settings-card__title">{t('detail.lastRecommend')}</span>
        <Link to={resultUrl} className="saved-settings-card__link">
          {t('detail.viewLastResult')}
          <Icon name="chevronRight" size={16} />
        </Link>
      </div>
      <RecommendationSettingsPanel settings={data.settings} variant="hero" />
      <p className="saved-settings-card__date">
        {new Date(data.viewedAt).toLocaleDateString()}
      </p>
    </section>
  );
}
