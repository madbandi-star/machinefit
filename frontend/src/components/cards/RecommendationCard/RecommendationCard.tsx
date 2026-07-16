import type { RecommendationResult } from '@machinefit/shared';
import { RecommendationSettingsPanel } from '@/components/recommendation/RecommendationSettingsPanel/RecommendationSettingsPanel';
import { RecommendationTips } from '@/components/recommendation/RecommendationTips/RecommendationTips';
import '@/styles/recommendation.css';

interface RecommendationCardProps {
  result: RecommendationResult;
  variant?: 'hero' | 'compact';
  showTips?: boolean;
}

export function RecommendationCard({
  result,
  variant = 'hero',
  showTips = variant === 'hero',
}: RecommendationCardProps) {
  return (
    <div className="card">
      {variant === 'hero' && (
        <h3 style={{ color: 'var(--color-primary-text)', marginBottom: '0.75rem' }}>
          {result.machineName ?? result.machineCode}
        </h3>
      )}
      <RecommendationSettingsPanel settings={result.settings} variant={variant} />
      {showTips && result.tips.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <RecommendationTips tips={result.tips} />
        </div>
      )}
    </div>
  );
}
