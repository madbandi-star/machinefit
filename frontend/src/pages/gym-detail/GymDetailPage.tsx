import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BusinessHoursDisplay } from '@/components/display/BusinessHours/BusinessHoursDisplay';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { GymInventoryPanel } from '@/components/gyms/GymInventoryPanel/GymInventoryPanel';
import { ShowcaseCard } from '@/components/machine-showcase/ShowcaseCard';
import { QUERY_KEYS } from '@/constants/query-keys';
import { gymApi } from '@/api';
import { machineShowcaseApi } from '@/api/machine-showcase.api';
import { useAuthStore } from '@/store/auth.store';
import { safeHttpUrl } from '@/utils/safeHttpUrl';
import '@/styles/components.css';
import '@/styles/gym.css';
import '@/styles/machine-showcase.css';

export function GymDetailPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const { t } = useTranslation('gyms');
  const { t: tc } = useTranslation('community');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data: gym, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.gym(gymId!),
    queryFn: async () => {
      const res = await gymApi.getById(gymId!);
      return res.data.data;
    },
    enabled: !!gymId,
  });

  const showcaseQuery = useQuery({
    queryKey: QUERY_KEYS.machineShowcase({ gymId, tab: 'latest' }),
    queryFn: async () =>
      (await machineShowcaseApi.list({ gymId, tab: 'latest', limit: 6 })).data.data,
    enabled: Boolean(gymId) && isAuthenticated,
  });

  if (isLoading) return <Skeleton count={4} height={80} />;
  if (isError)
    return (
      <PageShell title={t('error', { defaultValue: 'Error' })}>
        <QueryErrorMessage />
      </PageShell>
    );
  if (!gym) return <PageShell title={t('notFound', { defaultValue: 'Not Found' })} />;

  return (
    <PageShell title={gym.name} subtitle={`${gym.city ?? ''} ${gym.countryCode ?? ''}`.trim()}>
      {gym.photos[0] && (
        <img
          src={gym.photos[0].photoUrl}
          alt={gym.name}
          className="gym-detail__photo"
          loading="lazy"
          decoding="async"
        />
      )}

      <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>
        📍 {gym.address}
        {gym.isVerified && (
          <span style={{ marginLeft: '0.5rem', color: 'var(--color-primary-text)' }}>
            ✓ Verified
          </span>
        )}
      </p>

      {gym.amenities && Object.keys(gym.amenities).length > 0 && (
        <section className="gym-detail__section">
          <h3>{t('amenities')}</h3>
          <div className="amenities">
            {Object.entries(gym.amenities)
              .filter(([, v]) => v)
              .map(([key]) => (
                <span key={key} className="amenity-tag">
                  {key}
                </span>
              ))}
          </div>
        </section>
      )}

      <section className="gym-detail__section">
        <h3>{t('businessHours')}</h3>
        <BusinessHoursDisplay hours={gym.businessHours} />
      </section>

      {(gym.phone || gym.websiteUrl) && (
        <section className="gym-detail__section">
          <h3>{t('contact')}</h3>
          {gym.phone && <p>📞 {gym.phone}</p>}
          {safeHttpUrl(gym.websiteUrl) ? (
            <p>
              <a href={safeHttpUrl(gym.websiteUrl)!} target="_blank" rel="noopener noreferrer">
                {gym.websiteUrl}
              </a>
            </p>
          ) : null}
        </section>
      )}

      <GymInventoryPanel gymId={gym.id} />

      {showcaseQuery.data?.items.length ? (
        <section className="gym-detail__section">
          <h3>{tc('showcase.gymShowcase')}</h3>
          <div className="showcase-feed">
            {showcaseQuery.data.items.map((post) => (
              <ShowcaseCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}
