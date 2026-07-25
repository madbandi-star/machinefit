import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { complianceApi } from '@/api/compliance.api';
import { useUIStore } from '@/store/ui.store';
import '@/styles/legal.css';
import '@/styles/components.css';

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
    mutationFn: () => complianceApi.addTicketMessage(ticketId!, reply),
    onSuccess: () => {
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      showToast(t('support.replySent'), 'success');
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  if (query.isLoading) {
    return (
      <PageShell title={t('support.title')}>
        <Skeleton count={3} />
      </PageShell>
    );
  }

  const ticket = query.data;
  if (!ticket) {
    return (
      <PageShell title={t('support.title')}>
        <p>{t('errors.notFound')}</p>
      </PageShell>
    );
  }

  return (
    <PageShell title={ticket.subject} subtitle={`${ticket.status} · ${ticket.category}`}>
      <div className="support-thread">
        {ticket.messages.map((m) => (
          <article
            key={m.id}
            className={`support-msg support-msg--${m.authorRole === 'admin' ? 'admin' : 'user'}`}
          >
            <header>
              {m.authorRole === 'admin' ? t('support.staff') : t('support.me')} ·{' '}
              {new Date(m.createdAt).toLocaleString()}
            </header>
            <p>{m.body}</p>
          </article>
        ))}
      </div>
      {ticket.status !== 'closed' && (
        <section className="form-section">
          <label>
            {t('support.reply')}
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />
          </label>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!reply.trim() || replyMutation.isPending}
            onClick={() => replyMutation.mutate()}
          >
            {t('support.sendReply')}
          </button>
        </section>
      )}
    </PageShell>
  );
}
