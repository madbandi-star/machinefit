import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BusinessHoursDisplay } from '@/components/display/BusinessHours/BusinessHoursDisplay';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { GymInventoryPanel } from '@/components/gyms/GymInventoryPanel/GymInventoryPanel';
import { QUERY_KEYS } from '@/constants/query-keys';
import { gymApi } from '@/api';
import '@/styles/components.css';
import '@/styles/gym.css';

export function GymDetailPage() {
  const { gymId } = useParams<{ gymId: string }>();
  const { t } = useTranslation('gyms');

  const { data: gym, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.gym(gymId!),
    queryFn: async () => {
      const res = await gymApi.getById(gymId!);
      return res.data.data;
    },
    enabled: !!gymId,
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
          {gym.websiteUrl && (
            <p>
              <a href={gym.websiteUrl} target="_blank" rel="noopener noreferrer">
                {gym.websiteUrl}
              </a>
            </p>
          )}
        </section>
      )}

      <GymInventoryPanel gymId={gym.id} />
    </PageShell>
  );
}
