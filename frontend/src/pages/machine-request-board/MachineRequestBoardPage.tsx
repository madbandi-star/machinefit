import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { machineRequestApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/community.css';

export function MachineRequestBoardPage() {
  const { t } = useTranslation('community');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showToast = useUIStore((s) => s.showToast);

  const [showForm, setShowForm] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [machineName, setMachineName] = useState('');
  const [description, setDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.machineRequests,
    queryFn: async () => {
      const res = await machineRequestApi.list({ limit: 30 });
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      machineRequestApi.create({
        brandName: brandName || undefined,
        machineName,
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.machineRequests });
      setShowForm(false);
      setBrandName('');
      setMachineName('');
      setDescription('');
      showToast(t('createSuccess'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const handleNew = () => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineName.trim()) return;
    createMutation.mutate();
  };

  return (
    <PageShell
      title={t('machineRequests')}
      subtitle={t('machineRequestsSubtitle')}
      action={
        <button className="btn btn--primary" onClick={handleNew}>
          {t('newRequest')}
        </button>
      }
    >
      {showForm && (
        <form className="card" style={{ marginBottom: '1rem' }} onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="req-brand">{t('brandName')}</label>
            <input
              id="req-brand"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
            />
          </div>
          <div className="form-row">
            <label htmlFor="req-machine">{t('machineName')}</label>
            <input
              id="req-machine"
              value={machineName}
              onChange={(e) => setMachineName(e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label htmlFor="req-desc">{t('description')}</label>
            <textarea
              id="req-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn--primary" disabled={createMutation.isPending}>
              {t('submit')}
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <Skeleton count={3} />
      ) : data?.items.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.items.map((req) => (
            <div key={req.id} className="card request-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {req.brandName ? `${req.brandName} — ` : ''}{req.machineName}
                  </h3>
                  {req.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {req.description}
                    </p>
                  )}
                </div>
                <span className={`request-card__status request-card__status--${req.status}`}>
                  {req.status}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                {req.authorName} · {new Date(req.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--color-text-muted)' }}>{t('noRequests')}</p>
      )}

      <Link to={ROUTES.COMMUNITY} className="btn btn--secondary btn--block" style={{ marginTop: '1rem' }}>
        ← {t('title')}
      </Link>
    </PageShell>
  );
}
