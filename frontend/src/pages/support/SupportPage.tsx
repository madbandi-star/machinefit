import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { SupportCategory } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
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
    mutationFn: () => complianceApi.createTicket({ category, subject, body }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      showToast(t('support.created'), 'success');
      navigate(ROUTES.SUPPORT_DETAIL.replace(':ticketId', res.data.data.id));
    },
    onError: () => showToast(t('errors.submitFailed'), 'error'),
  });

  return (
    <PageShell title={t('support.title')} subtitle={t('support.subtitle')}>
      <section className="form-section">
        <h3 className="form-section__title">{t('support.newTitle')}</h3>
        <label>
          {t('support.category')}
          <select
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
        <label>
          {t('support.subject')}
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            required
          />
        </label>
        <label>
          {t('support.body')}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            maxLength={5000}
            required
          />
        </label>
        <button
          type="button"
          className="btn btn--primary"
          disabled={createMutation.isPending || subject.trim().length < 2 || body.trim().length < 2}
          onClick={() => createMutation.mutate()}
        >
          {t('support.submit')}
        </button>
      </section>

      <section className="form-section">
        <h3 className="form-section__title">{t('support.myTickets')}</h3>
        <ul className="legal-link-list">
          {(listQuery.data ?? []).map((ticket) => (
            <li key={ticket.id}>
              <Link to={ROUTES.SUPPORT_DETAIL.replace(':ticketId', ticket.id)}>
                [{ticket.status}] {ticket.subject}
              </Link>
            </li>
          ))}
          {!listQuery.isLoading && (listQuery.data?.length ?? 0) === 0 && (
            <li>{t('support.empty')}</li>
          )}
        </ul>
      </section>
    </PageShell>
  );
}
