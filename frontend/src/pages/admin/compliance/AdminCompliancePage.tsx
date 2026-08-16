import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/admin.css';
import '@/styles/admin-compliance.css';

type TabId = 'tickets' | 'documents' | 'consents' | 'audit';

function ticketPriority(status: string): number {
  if (status === 'open') return 0;
  if (status === 'in_progress') return 1;
  if (status === 'resolved') return 2;
  return 3;
}

function formatWhen(value: string, locale: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(locale.startsWith('en') ? 'en-US' : 'ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AdminCompliancePage() {
  const { t, i18n } = useTranslation();
  const { t: ta } = useTranslation('admin');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>('tickets');
  const [ticketFilter, setTicketFilter] = useState<'active' | 'all'>('active');
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
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
      showToast(ta('saved'), 'success');
      setExpandedTicketId(null);
    },
    onError: () => showToast(ta('error'), 'error'),
  });

  const o = overviewQuery.data;

  const tickets = useMemo(() => {
    const list = [...(ticketsQuery.data ?? [])];
    list.sort((a, b) => {
      const d = ticketPriority(String(a.status)) - ticketPriority(String(b.status));
      if (d !== 0) return d;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    if (ticketFilter === 'active') {
      return list.filter((x) => x.status === 'open' || x.status === 'in_progress');
    }
    return list;
  }, [ticketsQuery.data, ticketFilter]);

  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    {
      id: 'tickets',
      label: t('compliance.admin.tickets'),
      count: o?.pendingSupportTickets,
    },
    {
      id: 'documents',
      label: t('compliance.admin.documents'),
      count: o?.activeLegalDocuments,
    },
    { id: 'consents', label: t('compliance.admin.consents') },
    { id: 'audit', label: t('compliance.admin.auditLogs') },
  ];

  if (overviewQuery.isLoading) {
    return (
      <AdminPageShell title={t('compliance.admin.title')}>
        <Skeleton count={4} />
      </AdminPageShell>
    );
  }

  return (
    <AdminPageShell
      title={t('compliance.admin.title')}
      subtitle={t('compliance.admin.subtitle')}
    >
      <div className="ac">
        <section className="ac-kpis" aria-label={t('compliance.admin.overview')}>
          <button
            type="button"
            className={`ac-kpi${tab === 'tickets' ? ' is-active' : ''}${
              (o?.pendingSupportTickets ?? 0) > 0 ? ' is-warn' : ''
            }`}
            onClick={() => {
              setTab('tickets');
              setTicketFilter('active');
            }}
          >
            <span className="ac-kpi__value">{o?.pendingSupportTickets ?? 0}</span>
            <span className="ac-kpi__label">{t('compliance.admin.pendingTickets')}</span>
          </button>
          <div className="ac-kpi">
            <span className="ac-kpi__value">{o?.pendingCommunityReports ?? 0}</span>
            <span className="ac-kpi__label">{t('compliance.admin.pendingReports')}</span>
          </div>
          <Link
            to={ROUTES.ADMIN_PRIVACY_RIGHTS}
            className={`ac-kpi ac-kpi--link${
              (o?.pendingPrivacyRightsRequests ?? 0) > 0 ? ' is-warn' : ''
            }`}
          >
            <span className="ac-kpi__value">{o?.pendingPrivacyRightsRequests ?? 0}</span>
            <span className="ac-kpi__label">{t('compliance.admin.pendingRights')}</span>
          </Link>
          <div className="ac-kpi">
            <span className="ac-kpi__value">{o?.marketingOptInUsers ?? 0}</span>
            <span className="ac-kpi__label">{t('compliance.admin.marketingOptIns')}</span>
          </div>
          <div className="ac-kpi">
            <span className="ac-kpi__value">{o?.locationOptInUsers ?? 0}</span>
            <span className="ac-kpi__label">{t('compliance.admin.locationOptIns')}</span>
          </div>
          <button
            type="button"
            className={`ac-kpi${tab === 'documents' ? ' is-active' : ''}`}
            onClick={() => setTab('documents')}
          >
            <span className="ac-kpi__value">{o?.activeLegalDocuments ?? 0}</span>
            <span className="ac-kpi__label">{t('compliance.admin.legalDocs')}</span>
          </button>
          <div className={`ac-kpi${(o?.recentLoginFailures ?? 0) > 0 ? ' is-danger' : ''}`}>
            <span className="ac-kpi__value">{o?.recentLoginFailures ?? 0}</span>
            <span className="ac-kpi__label">{t('compliance.admin.loginFailures')}</span>
          </div>
        </section>

        <div className="ac-tabs" role="tablist" aria-label={t('compliance.admin.title')}>
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`ac-tab${tab === item.id ? ' is-active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {typeof item.count === 'number' ? (
                <span className="ac-tab__count">{item.count}</span>
              ) : null}
            </button>
          ))}
        </div>

        {tab === 'tickets' ? (
          <section className="ac-panel" aria-labelledby="ac-tickets-title">
            <div className="ac-panel__head">
              <h2 id="ac-tickets-title" className="ac-panel__title">
                {t('compliance.admin.tickets')}
              </h2>
              <div className="ac-seg" role="group" aria-label={t('compliance.admin.ticketFilter')}>
                <button
                  type="button"
                  className={`ac-seg__btn${ticketFilter === 'active' ? ' is-active' : ''}`}
                  onClick={() => setTicketFilter('active')}
                >
                  {t('compliance.admin.ticketActive')}
                </button>
                <button
                  type="button"
                  className={`ac-seg__btn${ticketFilter === 'all' ? ' is-active' : ''}`}
                  onClick={() => setTicketFilter('all')}
                >
                  {t('compliance.admin.ticketAll')}
                </button>
              </div>
            </div>

            {ticketsQuery.isLoading ? (
              <Skeleton count={3} />
            ) : tickets.length === 0 ? (
              <p className="ac-empty">{t('support.empty')}</p>
            ) : (
              <div className="ac-queue">
                {tickets.map((ticket) => {
                  const open = expandedTicketId === ticket.id;
                  const catLabel = t(`support.categories.${ticket.category}`, {
                    defaultValue: ticket.category,
                  });
                  const statusLabel = t(`support.statuses.${ticket.status}`, {
                    defaultValue: ticket.status,
                  });
                  return (
                    <article
                      key={ticket.id}
                      className={`ac-row${open ? ' is-open' : ''} ac-row--${ticket.status}`}
                    >
                      <button
                        type="button"
                        className="ac-row__main"
                        onClick={() =>
                          setExpandedTicketId((prev) =>
                            prev === ticket.id ? null : ticket.id
                          )
                        }
                      >
                        <span className={`ac-pill ac-pill--${ticket.status}`}>
                          {statusLabel}
                        </span>
                        <span className="ac-row__body">
                          <span className="ac-row__title">{ticket.subject}</span>
                          <span className="ac-row__meta">
                            {catLabel}
                            {' · '}
                            {formatWhen(ticket.updatedAt, i18n.language)}
                            {ticket.latestMessagePreview
                              ? ` · ${ticket.latestMessagePreview}`
                              : ''}
                          </span>
                        </span>
                        <span className="ac-row__chevron" aria-hidden>
                          {open ? '▾' : '▸'}
                        </span>
                      </button>

                      {open ? (
                        <div className="ac-row__detail">
                          <label className="ac-field">
                            <span>{t('support.reply')}</span>
                            <textarea
                              rows={3}
                              value={replyDraft[ticket.id] ?? ''}
                              placeholder={t('compliance.admin.replyPlaceholder')}
                              onChange={(e) =>
                                setReplyDraft((prev) => ({
                                  ...prev,
                                  [ticket.id]: e.target.value,
                                }))
                              }
                            />
                          </label>
                          <div className="ac-row__actions">
                            <button
                              type="button"
                              className="btn btn--secondary"
                              disabled={updateTicket.isPending}
                              onClick={() =>
                                updateTicket.mutate({
                                  id: ticket.id,
                                  status: 'in_progress',
                                  reply: replyDraft[ticket.id],
                                })
                              }
                            >
                              {t('compliance.admin.reply')}
                            </button>
                            <button
                              type="button"
                              className="btn btn--primary"
                              disabled={updateTicket.isPending}
                              onClick={() =>
                                updateTicket.mutate({
                                  id: ticket.id,
                                  status: 'resolved',
                                  reply: replyDraft[ticket.id],
                                })
                              }
                            >
                              {ta('resolve')}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {tab === 'documents' ? (
          <section className="ac-panel" aria-labelledby="ac-docs-title">
            <div className="ac-panel__head">
              <h2 id="ac-docs-title" className="ac-panel__title">
                {t('compliance.admin.documents')}
              </h2>
            </div>
            {docsQuery.isLoading ? (
              <Skeleton count={2} />
            ) : (docsQuery.data?.length ?? 0) === 0 ? (
              <p className="ac-empty">{t('compliance.admin.docsEmpty')}</p>
            ) : (
              <div className="ac-docs">
                {(docsQuery.data ?? []).map((d) => (
                  <article key={d.id} className="ac-doc">
                    <span className="ac-doc__type">{d.docType}</span>
                    <div className="ac-doc__main">
                      <strong>{d.title}</strong>
                      <span>
                        {d.regionCode} · v{d.version}
                        {d.isActive ? ` · ${t('compliance.admin.docActive')}` : ''}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {tab === 'consents' ? (
          <section className="ac-panel" aria-labelledby="ac-consents-title">
            <div className="ac-panel__head">
              <h2 id="ac-consents-title" className="ac-panel__title">
                {t('compliance.admin.consents')}
              </h2>
            </div>
            <div className="ac-search">
              <input
                className="ac-search__input"
                placeholder={t('compliance.admin.consentUserPlaceholder')}
                value={consentUserId}
                onChange={(e) => setConsentUserId(e.target.value)}
                aria-label={t('compliance.admin.consentUserPlaceholder')}
              />
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => void consentsQuery.refetch()}
              >
                {t('compliance.admin.search')}
              </button>
            </div>
            {consentsQuery.isLoading ? (
              <Skeleton count={2} />
            ) : (consentsQuery.data?.length ?? 0) === 0 ? (
              <p className="ac-empty">{t('compliance.admin.consentsEmpty')}</p>
            ) : (
              <div className="ac-queue">
                {(consentsQuery.data ?? []).slice(0, 40).map((c, idx) => {
                  const row = c as Record<string, unknown>;
                  const agreed = Boolean(row.agreed);
                  return (
                    <article key={String(row.id ?? idx)} className="ac-consent">
                      <span
                        className={`ac-pill ${agreed ? 'ac-pill--resolved' : 'ac-pill--closed'}`}
                      >
                        {agreed
                          ? t('compliance.admin.consentAgreed')
                          : t('compliance.admin.consentRevoked')}
                      </span>
                      <div className="ac-consent__main">
                        <strong>
                          {String(row.displayName ?? row.userId ?? '—')}
                        </strong>
                        <span>
                          {String(row.consentType)} · v{String(row.version)} ·{' '}
                          {row.agreedAt
                            ? formatWhen(String(row.agreedAt), i18n.language)
                            : '—'}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}

        {tab === 'audit' ? (
          <section className="ac-panel" aria-labelledby="ac-audit-title">
            <div className="ac-panel__head">
              <h2 id="ac-audit-title" className="ac-panel__title">
                {t('compliance.admin.auditLogs')}
              </h2>
            </div>
            {auditQuery.isLoading ? (
              <Skeleton count={3} />
            ) : (auditQuery.data?.length ?? 0) === 0 ? (
              <p className="ac-empty">{t('compliance.admin.auditEmpty')}</p>
            ) : (
              <div className="ac-audit">
                {(auditQuery.data ?? []).map((log) => (
                  <article key={log.id} className="ac-audit__row">
                    <time dateTime={log.createdAt}>
                      {formatWhen(log.createdAt, i18n.language)}
                    </time>
                    <strong>{log.action}</strong>
                    <span>
                      {log.targetType || '—'}
                      {log.targetId ? ` / ${log.targetId}` : ''}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>
    </AdminPageShell>
  );
}
