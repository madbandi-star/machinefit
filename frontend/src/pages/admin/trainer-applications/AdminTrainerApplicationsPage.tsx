import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TrainerApplication } from '@machinefit/shared';
import { adminApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useUIStore } from '@/store/ui.store';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { QueryErrorMessage } from '@/components/feedback/QueryErrorMessage/QueryErrorMessage';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { AdminPanel } from '@/components/admin/AdminPanel/AdminPanel';
import '@/styles/admin.css';
import '@/styles/components.css';

export function AdminTrainerApplicationsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | ''>('pending');
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: [...QUERY_KEYS.adminTrainerApplications, status] as const,
    queryFn: async () => {
      const res = await adminApi.listTrainerApplications(status ? { status } : undefined);
      return res.data.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: {
      id: string;
      status: 'approved' | 'rejected';
      adminNote?: string;
    }) =>
      adminApi.reviewTrainerApplication(payload.id, {
        status: payload.status,
        adminNote: payload.adminNote,
      }),
    onSuccess: async (_data, variables) => {
      showToast(
        variables.status === 'approved'
          ? t('admin:trainerApplications.approved')
          : t('admin:trainerApplications.rejected'),
        'success'
      );
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminTrainerApplications });
    },
    onError: () => showToast(t('common:errors.submitFailed'), 'error'),
  });

  if (isLoading) {
    return (
      <AdminPageShell title={t('admin:trainerApplications.title')}>
        <Skeleton count={4} height={88} />
      </AdminPageShell>
    );
  }
  if (isError) {
    return (
      <AdminPageShell title={t('admin:trainerApplications.title')}>
        <QueryErrorMessage />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={t('admin:trainerApplications.title')}
      subtitle={t('admin:menu.trainerDesc')}
      actions={
        <select
          className="admin-select"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          aria-label={t('admin:trainerApplications.filter')}
        >
          <option value="pending">{t('admin:trainerApplications.pending')}</option>
          <option value="approved">{t('admin:trainerApplications.approvedStatus')}</option>
          <option value="rejected">{t('admin:trainerApplications.rejectedStatus')}</option>
          <option value="">{t('admin:trainerApplications.all')}</option>
        </select>
      }
    >
      {!data?.length ? (
        <p className="admin-owner-apps__empty">{t('admin:trainerApplications.empty')}</p>
      ) : (
        <AdminPanel count={data.length} countLabel={t('admin:listCount', { count: data.length })}>
          <ul className="admin-owner-apps__list">
            {data.map((item: TrainerApplication) => (
              <li key={item.id} className="card admin-owner-apps__item">
                <div className="admin-owner-apps__meta">
                  <strong>{item.applicantName}</strong>
                  <span className={`admin-owner-apps__status admin-owner-apps__status--${item.status}`}>
                    {item.status}
                  </span>
                </div>
                <p>
                  {item.phone} · {item.email}
                </p>
                <p className="admin-owner-apps__sub">
                  {item.userDisplayName} ({item.userEmail})
                </p>
                {item.specialties ? (
                  <p>
                    <strong>{t('admin:trainerApplications.specialties')}:</strong> {item.specialties}
                  </p>
                ) : null}
                {item.career ? (
                  <p>
                    <strong>{t('admin:trainerApplications.career')}:</strong> {item.career}
                  </p>
                ) : null}
                {item.certifications ? (
                  <p>
                    <strong>{t('admin:trainerApplications.certs')}:</strong> {item.certifications}
                  </p>
                ) : null}
                {item.message ? <p>{item.message}</p> : null}

                {item.status === 'pending' ? (
                  <div className="admin-owner-apps__actions">
                    <textarea
                      className="input"
                      rows={2}
                      placeholder={t('admin:trainerApplications.adminNote')}
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
                        {t('admin:trainerApplications.approve')}
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
                        {t('admin:trainerApplications.reject')}
                      </button>
                    </div>
                  </div>
                ) : item.adminNote ? (
                  <p className="admin-owner-apps__note">{item.adminNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </AdminPanel>
      )}
    </AdminPageShell>
  );
}
