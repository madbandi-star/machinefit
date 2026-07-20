import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { OwnerApplication } from '@machinefit/shared';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import '@/styles/components.css';
import '@/styles/gym.css';

export function AdminOwnerApplicationsPage() {
  const { t } = useTranslation(['admin', 'gyms', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | ''>('pending');
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: [...QUERY_KEYS.adminOwnerApplications, status] as const,
    queryFn: async () => {
      const res = await adminApi.listOwnerApplications(status ? { status } : undefined);
      return res.data.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      status: 'approved' | 'rejected';
      adminNote?: string;
    }) =>
      adminApi.reviewOwnerApplication(payload.id, {
        status: payload.status,
        adminNote: payload.adminNote,
      }),
    onSuccess: async (_data, variables) => {
      showToast(
        variables.status === 'approved'
          ? t('admin:ownerApplications.approved')
          : t('admin:ownerApplications.rejected'),
        'success'
      );
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminOwnerApplications });
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  if (isLoading) return <Skeleton count={4} height={88} />;
  if (isError) return <QueryErrorMessage />;

  return (
    <div className="admin-owner-apps">
      <header className="admin-owner-apps__header">
        <h1>{t('admin:ownerApplications.title')}</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          aria-label={t('admin:ownerApplications.filter')}
        >
          <option value="pending">{t('admin:ownerApplications.pending')}</option>
          <option value="approved">{t('admin:ownerApplications.approvedStatus')}</option>
          <option value="rejected">{t('admin:ownerApplications.rejectedStatus')}</option>
          <option value="">{t('admin:ownerApplications.all')}</option>
        </select>
      </header>

      {!data?.length ? (
        <p className="admin-owner-apps__empty">{t('admin:ownerApplications.empty')}</p>
      ) : (
        <ul className="admin-owner-apps__list">
          {data.map((item: OwnerApplication) => (
            <li key={item.id} className="card admin-owner-apps__item">
              <div className="admin-owner-apps__meta">
                <strong>{item.businessName}</strong>
                <span className={`admin-owner-apps__status admin-owner-apps__status--${item.status}`}>
                  {item.status}
                </span>
              </div>
              <p>
                {item.applicantName} · {item.businessPhone} · {item.businessEmail}
              </p>
              <p className="admin-owner-apps__sub">
                {item.userDisplayName} ({item.userEmail}) · payment: {item.paymentStatus}
              </p>
              {item.description ? <p>{item.description}</p> : null}
              {item.evidenceUrl ? (
                <p>
                  <a href={item.evidenceUrl} target="_blank" rel="noopener noreferrer">
                    {t('admin:ownerApplications.evidence')}
                  </a>
                </p>
              ) : null}

              {item.status === 'pending' ? (
                <div className="admin-owner-apps__actions">
                  <textarea
                    className="input"
                    rows={2}
                    placeholder={t('admin:ownerApplications.adminNote')}
                    value={noteById[item.id] ?? ''}
                    onChange={(e) =>
                      setNoteById((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                  />
                  <div className="admin-owner-apps__buttons">
                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({
                          id: item.id,
                          status: 'approved',
                          adminNote: noteById[item.id],
                        })
                      }
                    >
                      {t('admin:ownerApplications.approve')}
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger"
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({
                          id: item.id,
                          status: 'rejected',
                          adminNote: noteById[item.id],
                        })
                      }
                    >
                      {t('admin:ownerApplications.reject')}
                    </button>
                  </div>
                </div>
              ) : item.adminNote ? (
                <p className="admin-owner-apps__note">{item.adminNote}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
