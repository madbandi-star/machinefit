import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { machineApi, recommendationApi } from '@/api';
import { RecommendationGuideSegments } from '@/components/recommendation/RecommendationGuideSegments/RecommendationGuideSegments';

interface HistoryCardGuideSegmentsProps {
  machineCode: string;
  recommendationId?: string;
  enabled?: boolean;
}

function pickLocaleLines(
  value: Record<string, string[]> | null | undefined,
  locale: string
): string[] {
  if (!value) return [];
  const preferred = value[locale] ?? value.en ?? value.ko;
  if (Array.isArray(preferred)) return preferred.map((s) => s.trim()).filter(Boolean);
  for (const entry of Object.values(value)) {
    if (Array.isArray(entry) && entry.length) {
      return entry.map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}

/** Loads guide copy for a history card and renders the same chip UI as the result page. */
export function HistoryCardGuideSegments({
  machineCode,
  recommendationId,
  enabled = true,
}: HistoryCardGuideSegmentsProps) {
  const { i18n } = useTranslation('machines');
  const locale = i18n.language?.split('-')[0] || 'ko';

  const guideQuery = useQuery({
    queryKey: ['history-card-guide', recommendationId ?? machineCode, locale],
    queryFn: async () => {
      if (recommendationId) {
        const res = await recommendationApi.getById(recommendationId);
        const data = res.data.data;
        return {
          warnings: (data.warnings ?? []).map((s) => s.trim()).filter(Boolean),
          tips: (data.tips ?? []).map((s) => s.trim()).filter(Boolean),
          proTips: (data.proTips ?? []).map((s) => s.trim()).filter(Boolean),
        };
      }
      const res = await machineApi.getByCode(machineCode);
      const machine = res.data.data;
      return {
        warnings: pickLocaleLines(machine.warnings, locale),
        tips: pickLocaleLines(machine.tips, locale),
        proTips: pickLocaleLines(machine.proTips, locale),
      };
    },
    enabled: enabled && Boolean(machineCode),
    staleTime: 5 * 60_000,
  });

  const warnings = useMemo(() => guideQuery.data?.warnings ?? [], [guideQuery.data?.warnings]);
  const tips = useMemo(() => guideQuery.data?.tips ?? [], [guideQuery.data?.tips]);
  const proTips = useMemo(() => guideQuery.data?.proTips ?? [], [guideQuery.data?.proTips]);

  if (!enabled || guideQuery.isError || guideQuery.isLoading) return null;
  if (!warnings.length && !tips.length && !proTips.length) return null;

  return (
    <RecommendationGuideSegments
      warnings={warnings}
      tips={tips}
      proTips={proTips}
      machineCode={machineCode}
    />
  );
}
