import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';

export function AdminCompliancePage() {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});
  const [consentUserId, setConsentUserId] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['admin-compliance-overview'],
    queryFn: async () => (await complianceApi.adminOverview()).data.data,
  });

  const ticketsQuery = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: async () => (await complianceApi.adminListTickets()).data.data,
  });

  const docsQuery = useQuery({
    queryKey: ['legal-documents'],
    queryFn: async () => (await complianceApi.listLegalDocuments({ regionCode: 'KR' })).data.data,
  });

  const auditQuery = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => (await complianceApi.adminAuditLogs(50)).data.data,
  });

  const consentsQuery = useQuery({
    queryKey: ['admin-consents', consentUserId],
    queryFn: async () =>
      (await complianceApi.adminConsents(consentUserId || undefined)).data.data,
  });

  const updateTicket = useMutation({
    mutationFn: ({
      id,
      status,
      reply,
    }: {
      id: string;
      status?: string;
      reply?: string;
    }) => complianceApi.adminUpdateTicket(id, { status, reply }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-compliance-overview'] });
      showToast(t('saved'), 'success');
    },
    onError: () => showToast(t('error'), 'error'),
  });

  if (overviewQuery.isLoading) {
    return (
      <PageShell title={tc('compliance.admin.title')}>
        <Skeleton count={4} />
      </PageShell>
    );
  }

  const o = overviewQuery.data;

  return (
    <PageShell title={tc('compliance.admin.title')} subtitle={tc('compliance.admin.subtitle')}>
      <section className="admin-panel">
        <h2 className="admin-panel__title">{tc('compliance.admin.overview')}</h2>
        <div className="admin-stats">
          <div className="admin-stat">
            <div className="admin-stat__value">{o?.pendingSupportTickets ?? 0}</div>
            <div className="admin-stat__label">{tc('compliance.admin.pendingTickets')}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat__value">{o?.pendingCommunityReports ?? 0}</div>
            <div className="admin-stat__label">{tc('compliance.admin.pendingReports')}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat__value">{o?.marketingOptInUsers ?? 0}</div>
            <div className="admin-stat__label">{tc('compliance.admin.marketingOptIns')}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat__value">{o?.locationOptInUsers ?? 0}</div>
            <div className="admin-stat__label">{tc('compliance.admin.locationOptIns')}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat__value">{o?.activeLegalDocuments ?? 0}</div>
            <div className="admin-stat__label">{tc('compliance.admin.legalDocs')}</div>
          </div>
          <div className="admin-stat">
            <div className="admin-stat__value">{o?.recentLoginFailures ?? 0}</div>
            <div className="admin-stat__label">{tc('compliance.admin.loginFailures')}</div>
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel__title">{tc('compliance.admin.tickets')}</h2>
        <div className="admin-table-wrap">
          {(ticketsQuery.data ?? []).map((ticket) => (
            <div key={ticket.id} className="admin-row">
              <div>
                <strong>{ticket.subject}</strong>
                <div>
                  {ticket.status} · {ticket.category}
                </div>
                <div>{ticket.latestMessagePreview}</div>
                <textarea
                  rows={2}
                  placeholder={tc('support.reply')}
                  value={replyDraft[ticket.id] ?? ''}
                  onChange={(e) =>
                    setReplyDraft((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                  }
                />
                <div className="admin-row__actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() =>
                      updateTicket.mutate({
                        id: ticket.id,
                        status: 'in_progress',
                        reply: replyDraft[ticket.id],
                      })
                    }
                  >
                    {tc('compliance.admin.reply')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() =>
                      updateTicket.mutate({
                        id: ticket.id,
                        status: 'resolved',
                        reply: replyDraft[ticket.id],
                      })
                    }
                  >
                    {t('resolve')}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {(ticketsQuery.data?.length ?? 0) === 0 && <p>{tc('support.empty')}</p>}
        </div>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel__title">{tc('compliance.admin.documents')}</h2>
        <ul>
          {(docsQuery.data ?? []).map((d) => (
            <li key={d.id}>
              [{d.regionCode}] {d.docType} v{d.version} — {d.title}
            </li>
          ))}
        </ul>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel__title">{tc('compliance.admin.consents')}</h2>
        <div className="admin-row__actions">
          <input
            placeholder="userId UUID"
            value={consentUserId}
            onChange={(e) => setConsentUserId(e.target.value)}
          />
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => consentsQuery.refetch()}
          >
            {tc('compliance.admin.search')}
          </button>
        </div>
        <ul>
          {(consentsQuery.data ?? []).slice(0, 40).map((c, idx) => {
            const row = c as Record<string, unknown>;
            return (
              <li key={String(row.id ?? idx)}>
                {String(row.email ?? row.userId ?? '')} · {String(row.consentType)} · v
                {String(row.version)} · {row.agreed ? 'agreed' : 'revoked'} ·{' '}
                {String(row.agreedAt)}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="admin-panel">
        <h2 className="admin-panel__title">{tc('compliance.admin.auditLogs')}</h2>
        <ul>
          {(auditQuery.data ?? []).map((log) => (
            <li key={log.id}>
              {new Date(log.createdAt).toLocaleString()} · {log.action} · {log.targetType}/
              {log.targetId}
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}
