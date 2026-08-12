import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { SupportTicketStatus } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { GuideProse } from '@/components/content/GuideProse/GuideProse';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/legal.css';
import '@/styles/components.css';

function statusTone(status: string): string {
  switch (status as SupportTicketStatus) {
    case 'open':
      return 'support-status--open';
    case 'in_progress':
      return 'support-status--progress';
    case 'resolved':
      return 'support-status--resolved';
    case 'closed':
      return 'support-status--closed';
    default:
      return '';
  }
}

export function SupportTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const { t } = useTranslation();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [reply, setReply] = useState('');

  const query = useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async () => (await complianceApi.getTicket(ticketId!)).data.data,
    enabled: Boolean(ticketId),
  });

  const replyMutation = useMutation({
    mutationFn: () => complianceApi.addTicketMessage(ticketId!, reply.trim()),
    onSuccess: () => {
      setReply('');
      void queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      void queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      showToast(t('support.replySent'), 'success');
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const handleReply = (event: FormEvent) => {
    event.preventDefault();
    if (!reply.trim() || replyMutation.isPending) return;
    replyMutation.mutate();
  };

  if (query.isLoading) {
    return (
      <div className="support-page">
        <PageShell title={t('support.title')}>
          <Skeleton count={4} height={72} />
        </PageShell>
      </div>
    );
  }

  const ticket = query.data;
  if (!ticket) {
    return (
      <div className="support-page">
        <PageShell
          title={t('support.title')}
          action={
            <Link to={ROUTES.SUPPORT} className="btn btn--secondary">
              {t('actions.back')}
            </Link>
          }
        >
          <div className="empty-state empty-state--compact">
            <p className="empty-state__title">{t('errors.notFound')}</p>
          </div>
        </PageShell>
      </div>
    );
  }

  const statusLabel = t(`support.statuses.${ticket.status}`, {
    defaultValue: String(ticket.status),
  });
  const categoryLabel = t(`support.categories.${ticket.category}`, {
    defaultValue: String(ticket.category),
  });

  return (
    <div className="support-page">
      <PageShell
        title={ticket.subject}
        subtitle={`${statusLabel} · ${categoryLabel}`}
        action={
          <Link to={ROUTES.SUPPORT} className="btn btn--secondary">
            {t('actions.back')}
          </Link>
        }
      >
        <div className="settings-stack">
          <div className="support-ticket-meta">
            <span className={`support-status ${statusTone(String(ticket.status))}`}>
              {statusLabel}
            </span>
            <span className="support-ticket-meta__text">
              {t('support.updatedAt', {
                date: new Date(ticket.updatedAt || ticket.createdAt).toLocaleString(),
              })}
            </span>
          </div>

          <section className="form-section support-thread-section" aria-label={t('support.thread')}>
            <div className="support-thread">
              {ticket.messages.map((m) => {
                const isAdmin = m.authorRole === 'admin';
                return (
                  <article
                    key={m.id}
                    className={`support-msg ${isAdmin ? 'support-msg--admin' : 'support-msg--user'}`}
                  >
                    <header className="support-msg__header">
                      <span className="support-msg__author">
                        {isAdmin ? t('support.staff') : t('support.me')}
                      </span>
                      <time dateTime={m.createdAt}>
                        {new Date(m.createdAt).toLocaleString()}
                      </time>
                    </header>
                    <p className="support-msg__body">{m.body}</p>
                  </article>
                );
              })}
            </div>
          </section>

          {ticket.status !== 'closed' ? (
            <section className="form-section">
              <h2 className="form-section__title">{t('support.reply')}</h2>
              <GuideProse className="form-section__desc" text={t('support.replyDesc')} variant="muted" />
              <form className="form-stack" onSubmit={handleReply}>
                <label className="form-field">
                  <span className="form-field__label visually-hidden">{t('support.reply')}</span>
                  <textarea
                    className="input support-textarea"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    rows={4}
                    maxLength={5000}
                    required
                    placeholder={t('support.replyPlaceholder')}
                  />
                </label>
                <button
                  type="submit"
                  className="btn btn--primary btn--block"
                  disabled={!reply.trim() || replyMutation.isPending}
                >
                  {t('support.sendReply')}
                </button>
              </form>
            </section>
          ) : (
            <p className="support-closed-note">{t('support.closedNote')}</p>
          )}
        </div>
      </PageShell>
    </div>
  );
}
