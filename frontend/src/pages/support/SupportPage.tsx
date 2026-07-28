import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { SupportCategory, SupportTicketStatus } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { Icon } from '@/components/icons/Icon';
import { complianceApi } from '@/api/compliance.api';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/legal.css';

const CATEGORIES: SupportCategory[] = [
  'general',
  'privacy',
  'account',
  'billing',
  'report',
  'copyright',
  'other',
];

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

export function SupportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<SupportCategory>('general');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const listQuery = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => (await complianceApi.listTickets()).data.data,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      complianceApi.createTicket({
        category,
        subject: subject.trim(),
        body: body.trim(),
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      showToast(t('support.created'), 'success');
      navigate(ROUTES.SUPPORT_DETAIL.replace(':ticketId', res.data.data.id));
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (createMutation.isPending) return;
    if (subject.trim().length < 2 || body.trim().length < 2) return;
    createMutation.mutate();
  };

  const tickets = listQuery.data ?? [];

  return (
    <div className="support-page">
      <PageShell title={t('support.title')} subtitle={t('support.subtitle')}>
        <div className="settings-stack">
          <section className="form-section">
            <h2 className="form-section__title">{t('support.newTitle')}</h2>
            <p className="form-section__desc">{t('support.newDesc')}</p>

            <form className="form-stack" onSubmit={handleSubmit}>
              <label className="form-field">
                <span className="form-field__label">{t('support.category')}</span>
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SupportCategory)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(`support.categories.${c}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="form-field__label">{t('support.subject')}</span>
                <input
                  className="input"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  required
                  autoComplete="off"
                  placeholder={t('support.subjectPlaceholder')}
                />
              </label>

              <label className="form-field">
                <span className="form-field__label">{t('support.body')}</span>
                <textarea
                  className="input support-textarea"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  required
                  placeholder={t('support.bodyPlaceholder')}
                />
              </label>

              <button
                type="submit"
                className="btn btn--primary btn--block"
                disabled={
                  createMutation.isPending ||
                  subject.trim().length < 2 ||
                  body.trim().length < 2
                }
              >
                {t('support.submit')}
              </button>
            </form>
          </section>

          <section className="form-section">
            <h2 className="form-section__title">{t('support.myTickets')}</h2>
            <p className="form-section__desc">{t('support.myTicketsDesc')}</p>

            {listQuery.isLoading ? (
              <Skeleton count={3} height={64} />
            ) : listQuery.isError ? (
              <p className="support-inline-error">{t('errors.loadFailed')}</p>
            ) : tickets.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <p className="empty-state__title">{t('support.empty')}</p>
                <p className="empty-state__hint">{t('support.emptyHint')}</p>
              </div>
            ) : (
              <ul className="support-ticket-list">
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <Link
                      to={ROUTES.SUPPORT_DETAIL.replace(':ticketId', ticket.id)}
                      className="support-ticket-row"
                    >
                      <span className="support-ticket-row__main">
                        <span
                          className={`support-status ${statusTone(String(ticket.status))}`}
                        >
                          {t(`support.statuses.${ticket.status}`, {
                            defaultValue: String(ticket.status),
                          })}
                        </span>
                        <span className="support-ticket-row__subject">{ticket.subject}</span>
                        <span className="support-ticket-row__meta">
                          {t(`support.categories.${ticket.category}`, {
                            defaultValue: String(ticket.category),
                          })}
                          {' · '}
                          {new Date(ticket.updatedAt || ticket.createdAt).toLocaleDateString()}
                        </span>
                      </span>
                      <Icon name="chevronRight" size={18} className="list-nav__chevron" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </PageShell>
    </div>
  );
}
