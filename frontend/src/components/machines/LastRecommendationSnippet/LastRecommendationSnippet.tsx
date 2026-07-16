import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { historyApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import '@/styles/machines.css';
import '@/styles/recommendation.css';

interface LastRecommendationSnippetProps {
  machineCode: string;
}

export function LastRecommendationSnippet({ machineCode }: LastRecommendationSnippetProps) {
  const { t } = useTranslation('machines');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data } = useQuery({
    queryKey: [...QUERY_KEYS.history, machineCode],
    queryFn: async () => {
      const res = await historyApi.list({ machineCode, limit: 1 });
      return res.data.data[0] ?? null;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || !data) return null;

  return (
    <div className="last-recommend-snippet">
      <div className="last-recommend-snippet__header">
        <span className="last-recommend-snippet__title">{t('detail.lastRecommend')}</span>
        <span className="last-recommend-snippet__date">
          {new Date(data.viewedAt).toLocaleDateString()}
        </span>
      </div>
      <RecommendationSettingsPanel settings={data.settings} variant="compact" />
      <Link
        to={`${ROUTES.RECOMMEND_RESULT.replace(':machineCode', machineCode)}?id=${data.recommendationId}`}
        className="btn btn--secondary btn--block"
        style={{ marginTop: '0.75rem' }}
      >
        {t('detail.viewLastResult')}
      </Link>
    </div>
  );
}
