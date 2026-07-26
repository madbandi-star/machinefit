import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { BoardIndexPanel } from '@/components/community/BoardIndexPanel';
import { BoardIndexSkeleton } from '@/components/community/BoardIndexSkeleton';
import { BoardRequestRow } from '@/components/community/BoardRequestRow';
import { machineRequestApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/community.css';

export function MachineRequestBoardPage() {
  const { t } = useTranslation('community');
  const { t: tCommon } = useTranslation();
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
    <div className="community-board-page">
      <PageShell
        title={t('machineRequests')}
        subtitle={t('machineRequestsSubtitle')}
        action={
          <div className="page-shell__header-action">
            <button type="button" className="btn btn--primary" onClick={handleNew}>
              {t('newRequest')}
            </button>
          </div>
        }
      >
        {showForm && (
          <form className="card community-board-page__form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="req-brand">{t('brandName')}</label>
              <input
                id="req-brand"
                className="input"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="req-machine">{t('machineName')}</label>
              <input
                id="req-machine"
                className="input"
                value={machineName}
                onChange={(e) => setMachineName(e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="req-desc">{t('description')}</label>
              <textarea
                id="req-desc"
                className="input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="community-board-page__form-actions">
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
          <BoardIndexSkeleton rows={8} />
        ) : data?.items.length ? (
          <BoardIndexPanel countLabel={t('requestCount', { count: data.items.length })}>
            {data.items.map((req) => (
              <BoardRequestRow key={req.id} request={req} />
            ))}
          </BoardIndexPanel>
        ) : (
          <p className="community-board-page__empty">{t('noRequests')}</p>
        )}

        <Link to={ROUTES.MY_PAGE} className="btn btn--secondary btn--block community-board-page__back">
          ← {tCommon('nav.myPage')}
        </Link>
      </PageShell>
    </div>
  );
}
