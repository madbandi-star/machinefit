import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { PrivacyRightsRequest } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/legal.css';
import '@/styles/components.css';

export function AdminPrivacyRightsPage() {
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<PrivacyRightsRequest | null>(null);
  const [resultMessage, setResultMessage] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const listQuery = useQuery({
    queryKey: ['admin-privacy-rights', statusFilter],
    queryFn: async () =>
      (
        await complianceApi.adminListRightsRequests(
          statusFilter ? { status: statusFilter } : undefined
        )
      ).data.data,
  });

  const updateMutation = useMutation({
    mutationFn: (input: {
      id: string;
      status: 'received' | 'reviewing' | 'completed' | 'rejected';
    }) =>
      complianceApi.adminUpdateRightsRequest(input.id, {
        status: input.status,
        resultMessage: resultMessage || undefined,
        rejectionReason: rejectionReason || undefined,
        noteLegalRetention: input.status === 'completed',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-privacy-rights'] });
      showToast(t('compliance.rights.admin.saved'), 'success');
      setSelected(null);
      setResultMessage('');
      setRejectionReason('');
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  return (
    <PageShell
      title={t('compliance.rights.admin.title')}
      subtitle={t('compliance.rights.admin.subtitle')}
    >
      <section className="form-section">
        <label className="form-field">
          <span>{t('compliance.rights.admin.filterStatus')}</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">{t('compliance.rights.admin.allStatuses')}</option>
            <option value="received">{t('compliance.rights.status.received')}</option>
            <option value="reviewing">{t('compliance.rights.status.reviewing')}</option>
            <option value="completed">{t('compliance.rights.status.completed')}</option>
            <option value="rejected">{t('compliance.rights.status.rejected')}</option>
          </select>
        </label>
      </section>

      {listQuery.isLoading ? (
        <Skeleton count={4} />
      ) : (
        <section className="form-section">
          <ul className="legal-link-list">
            {(listQuery.data ?? []).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setSelected(r)}
                >
                  {t(`compliance.rights.requestType.${r.requestType}`)} ·{' '}
                  {t(`compliance.rights.status.${r.status}`)}
                  {r.dueState === 'overdue'
                    ? ` ⚠ ${t('compliance.rights.admin.overdue')}`
                    : r.dueState === 'soon'
                      ? ` ⏰ ${t('compliance.rights.admin.dueSoon')}`
                      : ''}
                </button>
                <div className="form-section__desc">
                  {r.requesterDisplayName || r.requesterEmail} ·{' '}
                  {new Date(r.createdAt).toLocaleString()} ·{' '}
                  {t('compliance.rights.admin.dueAt')}:{' '}
                  {new Date(r.dueAt).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
          {(listQuery.data ?? []).length === 0 ? (
            <p className="form-section__desc">{t('compliance.rights.admin.empty')}</p>
          ) : null}
        </section>
      )}

      {selected ? (
        <section className="form-section">
          <h3 className="form-section__title">
            {t(`compliance.rights.requestType.${selected.requestType}`)}
          </h3>
          <dl className="privacy-summary">
            <div>
              <dt>{t('compliance.rights.admin.requester')}</dt>
              <dd>
                {selected.requesterDisplayName} ({selected.requesterEmail})
              </dd>
            </div>
            <div>
              <dt>{t('compliance.rights.admin.status')}</dt>
              <dd>{t(`compliance.rights.status.${selected.status}`)}</dd>
            </div>
            <div>
              <dt>{t('compliance.rights.admin.dueAt')}</dt>
              <dd>
                {new Date(selected.dueAt).toLocaleString()}
                {selected.dueState === 'overdue'
                  ? ` — ${t('compliance.rights.admin.overdue')}`
                  : selected.dueState === 'soon'
                    ? ` — ${t('compliance.rights.admin.dueSoon')}`
                    : ''}
              </dd>
            </div>
            <div>
              <dt>{t('compliance.rights.admin.detail')}</dt>
              <dd>{selected.detail || selected.subject || '—'}</dd>
            </div>
            <div>
              <dt>{t('compliance.rights.admin.payload')}</dt>
              <dd>
                <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                  {JSON.stringify(selected.payload, null, 2)}
                </pre>
              </dd>
            </div>
          </dl>
          <label className="form-field">
            <span>{t('compliance.rights.admin.resultMessage')}</span>
            <textarea
              value={resultMessage}
              onChange={(e) => setResultMessage(e.target.value)}
              rows={3}
            />
          </label>
          <label className="form-field">
            <span>{t('compliance.rights.admin.rejectionReason')}</span>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={2}
            />
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({ id: selected.id, status: 'reviewing' })
              }
            >
              {t('compliance.rights.status.reviewing')}
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({ id: selected.id, status: 'completed' })
              }
            >
              {t('compliance.rights.status.completed')}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({ id: selected.id, status: 'rejected' })
              }
            >
              {t('compliance.rights.status.rejected')}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setSelected(null)}
            >
              {t('actions.cancel')}
            </button>
          </div>
          <p className="form-section__desc">{t('compliance.rights.admin.dueHint')}</p>
        </section>
      ) : null}
    </PageShell>
  );
}
