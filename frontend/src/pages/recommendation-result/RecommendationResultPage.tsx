import { Link, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { RecommendationResult } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { RecommendationCard } from '@/components/cards/RecommendationCard/RecommendationCard';
import { favoriteApi } from '@/api';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { ROUTES } from '@/constants/routes';
import '@/styles/components.css';

export function RecommendationResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result as RecommendationResult | undefined;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showToast = useUIStore((s) => s.showToast);

  const favoriteMutation = useMutation({
    mutationFn: () =>
      favoriteApi.add(result!.machineCode, result!.id),
    onSuccess: () => showToast('Saved to favorites!', 'success'),
    onError: () => showToast('Failed to save favorite', 'error'),
  });

  if (!result) {
    return <PageShell title="No Result" subtitle="Please submit a recommendation first." />;
  }

  return (
    <PageShell title="Your Recommendation" subtitle={result.machineCode}>
      <RecommendationCard result={result} />
      {result.warnings.length > 0 && (
        <div style={{ marginTop: '1rem', color: 'var(--color-error)', fontSize: '0.9rem' }}>
          <strong>Warnings:</strong>
          <ul style={{ paddingLeft: '1.25rem' }}>
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
        {isAuthenticated ? (
          <button
            className="btn btn--primary btn--block"
            onClick={() => favoriteMutation.mutate()}
            disabled={favoriteMutation.isPending}
          >
            ⭐ Save to Favorites
          </button>
        ) : (
          <Link to={ROUTES.LOGIN} className="btn btn--secondary btn--block">
            Login to save favorites
          </Link>
        )}
        <Link
          to={`${ROUTES.GYMS}?machineCode=${result.machineCode}`}
          className="btn btn--secondary btn--block"
        >
          📍 Find Gyms with this Machine
        </Link>
        <button
          className="btn btn--secondary btn--block"
          onClick={() => navigate(ROUTES.MACHINE_DETAIL.replace(':machineCode', result.machineCode))}
        >
          Back to Machine
        </button>
      </div>
    </PageShell>
  );
}
