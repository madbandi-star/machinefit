import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BusinessHoursDisplay } from '@/components/display/BusinessHours/BusinessHoursDisplay';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QUERY_KEYS } from '@/constants/query-keys';
import { gymApi } from '@/api';
import { ROUTES } from '@/constants/routes';
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
  if (isError) return <PageShell title={t('error', { defaultValue: 'Error' })}><QueryErrorMessage /></PageShell>;
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
          <span style={{ marginLeft: '0.5rem', color: 'var(--color-primary)' }}>
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
                <span key={key} className="amenity-tag">{key}</span>
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

      <section className="gym-detail__section">
        <h3>{t('machineInventory')} ({gym.machines.length})</h3>
        {gym.machines.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)' }}>No machines listed</p>
        ) : (
          gym.machines.map((item) => (
            <div
              key={item.id}
              className={`machine-inventory-item${!item.isAvailable ? ' machine-inventory-item--unavailable' : ''}`}
            >
              <div>
                <strong>{item.machineName ?? item.machineCode}</strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  {item.machineCode}
                  {item.floorZone && ` · ${item.floorZone}`}
                  {item.quantity > 1 && ` · ${item.quantity} ${t('units')}`}
                </p>
                {!item.isAvailable && item.notes && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-error)' }}>{item.notes}</p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: item.isAvailable ? 'var(--color-success)' : 'var(--color-error)' }}>
                  {item.isAvailable ? t('available') : t('unavailable')}
                </span>
                {item.machineCode && (
                  <Link
                    to={ROUTES.MACHINE_DETAIL.replace(':machineCode', item.machineCode)}
                    className="btn btn--secondary"
                    style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
                  >
                    {t('viewMachine')}
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </section>
    </PageShell>
  );
}
