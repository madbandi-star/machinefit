import type { RecommendationResult } from '@machinefit/shared';
import { useUserUnits } from '@/hooks/useUserUnits';
import '@/styles/components.css';

interface RecommendationCardProps {
  result: RecommendationResult;
}

export function RecommendationCard({ result }: RecommendationCardProps) {
  const { settings } = result;
  const { formatWeight } = useUserUnits();

  return (
    <div className="card">
      <h3 style={{ color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
        {result.machineName ?? result.machineCode}
      </h3>
      <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
        {settings.seatPosition != null && (
          <>
            <dt>Seat</dt><dd>{settings.seatPosition}</dd>
          </>
        )}
        {settings.backPadPosition != null && (
          <>
            <dt>Back Pad</dt><dd>{settings.backPadPosition}</dd>
          </>
        )}
        {settings.recommendedWeightKg != null && (
          <>
            <dt>Weight</dt>
            <dd>{formatWeight(settings.recommendedWeightKg)}</dd>
          </>
        )}
      </dl>
      {result.tips.length > 0 && (
        <ul style={{ marginTop: '0.75rem', fontSize: '0.85rem', paddingLeft: '1.25rem' }}>
          {result.tips.map((tip, i) => (
            <li key={i}>{tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
