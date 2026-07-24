import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { photoBoardApi } from '@/api/photo-board.api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

type Tab = 'reports' | 'blocks';

export function AdminPhotoBoardPage() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('community');
  const queryClient = useQueryClient();
  const showToast = useUIStore((s) => s.showToast);
  const [tab, setTab] = useState<Tab>('reports');
  const [blockUserId, setBlockUserId] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const reportsQuery = useQuery({
    queryKey: [...QUERY_KEYS.adminPhotoBoard, 'reports'],
    queryFn: async () => (await photoBoardApi.adminListReports()).data.data,
    enabled: tab === 'reports',
  });

  const blocksQuery = useQuery({
    queryKey: [...QUERY_KEYS.adminPhotoBoard, 'blocks'],
    queryFn: async () => (await photoBoardApi.adminListBlocks()).data.data,
    enabled: tab === 'blocks',
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'resolved' | 'dismissed' }) =>
      photoBoardApi.adminResolveReport(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPhotoBoard });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const hideMutation = useMutation({
    mutationFn: (postId: string) => photoBoardApi.adminHidePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPhotoBoard });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const blockMutation = useMutation({
    mutationFn: () =>
      photoBoardApi.adminBlockUser({
        userId: blockUserId.trim(),
        reason: blockReason.trim() || undefined,
      }),
    onSuccess: () => {
      setBlockUserId('');
      setBlockReason('');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminPhotoBoard });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  const loading =
    (tab === 'reports' && reportsQuery.isLoading) || (tab === 'blocks' && blocksQuery.isLoading);

  return (
    <PageShell title={t('photoBoard.nav')} subtitle={t('photoBoard.subtitle')}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          type="button"
          className={`btn ${tab === 'reports' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setTab('reports')}
        >
          {t('photoBoard.reports')}
        </button>
        <button
          type="button"
          className={`btn ${tab === 'blocks' ? 'btn--primary' : 'btn--secondary'}`}
          onClick={() => setTab('blocks')}
        >
          {t('photoBoard.blocks')}
        </button>
      </div>

      {loading ? <Skeleton count={3} height={72} /> : null}

      {tab === 'reports' && !loading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {(reportsQuery.data ?? []).length === 0 ? (
            <div className="card" style={{ padding: '1rem' }}>
              {t('photoBoard.noReports')}
            </div>
          ) : (
            (reportsQuery.data ?? []).map((report) => (
              <div key={report.id} className="card" style={{ padding: '0.85rem' }}>
                <strong>{report.postTitle || report.postId || report.commentId}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  {report.reason} · {report.status} · {report.reporterName || report.reporterId}
                </div>
                {report.description ? <p>{report.description}</p> : null}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                  {report.postId ? (
                    <>
                      <Link
                        to={ROUTES.PHOTO_BOARD_DETAIL.replace(':postId', report.postId)}
                        className="btn btn--secondary"
                      >
                        {tc('photoBoard')}
                      </Link>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() => hideMutation.mutate(report.postId!)}
                      >
                        {t('photoBoard.hidePost')}
                      </button>
                    </>
                  ) : null}
                  {report.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={() =>
                          resolveMutation.mutate({ id: report.id, status: 'resolved' })
                        }
                      >
                        {t('photoBoard.resolve')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--secondary"
                        onClick={() =>
                          resolveMutation.mutate({ id: report.id, status: 'dismissed' })
                        }
                      >
                        {t('photoBoard.dismiss')}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === 'blocks' && !loading ? (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <form
            className="card"
            style={{ padding: '0.85rem', display: 'grid', gap: '0.5rem' }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!blockUserId.trim()) return;
              blockMutation.mutate();
            }}
          >
            <label>
              {t('photoBoard.blockUserId')}
              <input
                className="input"
                value={blockUserId}
                onChange={(e) => setBlockUserId(e.target.value)}
                required
              />
            </label>
            <label>
              {t('photoBoard.blockReason')}
              <input
                className="input"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </label>
            <button type="submit" className="btn btn--primary" disabled={blockMutation.isPending}>
              {t('photoBoard.block')}
            </button>
          </form>
          {(blocksQuery.data ?? []).map((block) => (
            <div key={block.id} className="card" style={{ padding: '0.85rem' }}>
              <strong>{block.userName || block.userId}</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                {block.reason || '—'}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </PageShell>
  );
}
