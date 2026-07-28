import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { OnlinePtDeadlineHours, OnlinePtOverdueAction } from '@machinefit/shared';
import { AdminPageShell } from '@/components/admin/AdminPageShell/AdminPageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import '@/styles/online-pt.css';
import '@/styles/admin.css';

type Tab = 'stats' | 'policy' | 'trainers' | 'questions' | 'payouts' | 'reviews';

export function AdminOnlinePtPage() {
  const { t } = useTranslation('online-pt');
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('stats');

  const statsQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtAdminStats,
    queryFn: async () => (await onlinePtApi.adminStats()).data.data,
    enabled: tab === 'stats',
  });

  const policyQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtPolicy,
    queryFn: async () => (await onlinePtApi.getPolicy()).data.data,
  });

  const trainersQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtTrainers({ admin: true }),
    queryFn: async () =>
      (await onlinePtApi.adminTrainers({ acceptingOnly: false, limit: 50 })).data.data,
    enabled: tab === 'trainers',
  });

  const questionsQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtQuestions({ role: 'admin' }),
    queryFn: async () =>
      (await onlinePtApi.adminQuestions({ role: 'admin', limit: 50 })).data.data,
    enabled: tab === 'questions',
  });

  const payoutsQuery = useQuery({
    queryKey: QUERY_KEYS.onlinePtAdminPayouts,
    queryFn: async () => (await onlinePtApi.adminPayouts()).data.data,
    enabled: tab === 'payouts',
  });

  const reviewsQuery = useQuery({
    queryKey: ['online-pt', 'admin', 'reviews'],
    queryFn: async () => (await onlinePtApi.adminReviews()).data.data,
    enabled: tab === 'reviews',
  });

  const [minPrice, setMinPrice] = useState(3000);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [fee, setFee] = useState(20);
  const [deadline, setDeadline] = useState<OnlinePtDeadlineHours>(48);
  const [overdue, setOverdue] = useState<OnlinePtOverdueAction>('refund');
  const [followupDays, setFollowupDays] = useState(7);
  const [followupMax, setFollowupMax] = useState(3);
  const [minPayout, setMinPayout] = useState(50000);
  const [approvalRequired, setApprovalRequired] = useState(true);

  useEffect(() => {
    const p = policyQuery.data;
    if (!p) return;
    setMinPrice(p.minTicketPrice);
    setMaxPrice(p.maxTicketPrice);
    setFee(p.platformFeePercent);
    setDeadline(p.answerDeadlineHours);
    setOverdue(p.overdueAction);
    setFollowupDays(p.followupDays);
    setFollowupMax(p.followupMaxCount);
    setMinPayout(p.minPayoutAmount);
    setApprovalRequired(p.trainerApprovalRequired);
  }, [policyQuery.data]);

  const savePolicy = useMutation({
    mutationFn: () =>
      onlinePtApi.adminPolicyUpdate({
        minTicketPrice: minPrice,
        maxTicketPrice: maxPrice,
        platformFeePercent: fee,
        answerDeadlineHours: deadline,
        overdueAction: overdue,
        followupDays,
        followupMaxCount: followupMax,
        minPayoutAmount: minPayout,
        trainerApprovalRequired: approvalRequired,
      }),
    onSuccess: () => {
      showToast(t('admin.policySaved'), 'success');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtPolicy });
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  const reviewTrainer = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'approved' | 'rejected' | 'suspended' | 'pending';
    }) => onlinePtApi.adminReviewTrainer(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['online-pt', 'trainers'] });
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  const reviewPayout = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: 'approved' | 'rejected' | 'paid';
    }) => onlinePtApi.adminReviewPayout(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtAdminPayouts });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtAdminStats });
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  const tabs: Tab[] = ['stats', 'policy', 'trainers', 'questions', 'payouts', 'reviews'];

  return (
    <AdminPageShell title={t('admin.title')}>
      <div className="admin-tabs admin-tabs--wide">
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            className={`admin-tabs__btn${tab === key ? ' is-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {t(`admin.${key}`)}
          </button>
        ))}
      </div>

      {tab === 'stats' ? (
        statsQuery.isLoading || !statsQuery.data ? (
          <Skeleton count={3} />
        ) : (
          <>
            <div className="opt-stats">
              <div className="opt-stat">
                <span className="opt-meta">Questions</span>
                <strong>{statsQuery.data.questionCount}</strong>
              </div>
              <div className="opt-stat">
                <span className="opt-meta">Answered</span>
                <strong>{statsQuery.data.answeredCount}</strong>
              </div>
              <div className="opt-stat">
                <span className="opt-meta">Revenue</span>
                <strong>{statsQuery.data.revenuePaid.toLocaleString()}</strong>
              </div>
              <div className="opt-stat">
                <span className="opt-meta">Trainer earn</span>
                <strong>{statsQuery.data.trainerEarnings.toLocaleString()}</strong>
              </div>
              <div className="opt-stat">
                <span className="opt-meta">Fees</span>
                <strong>{statsQuery.data.platformFees.toLocaleString()}</strong>
              </div>
              <div className="opt-stat">
                <span className="opt-meta">Active trainers</span>
                <strong>{statsQuery.data.activeTrainers}</strong>
              </div>
            </div>
            <h3>Top trainers</h3>
            <ul>
              {statsQuery.data.topTrainers.map((tr) => (
                <li key={tr.trainerId}>
                  {tr.displayName} — {tr.answerCount} answers · ★{tr.ratingAvg} ·{' '}
                  {tr.earned.toLocaleString()}원
                </li>
              ))}
            </ul>
            <h3>Popular specialties</h3>
            <ul>
              {statsQuery.data.popularSpecialties.map((s) => (
                <li key={s.specialty}>
                  {s.specialty} ({s.count})
                </li>
              ))}
            </ul>
          </>
        )
      ) : null}

      {tab === 'policy' ? (
        <form
          className="opt-form"
          onSubmit={(e) => {
            e.preventDefault();
            savePolicy.mutate();
          }}
        >
          <label>
            Min price
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            Max price
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            Fee %
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            Deadline hours
            <select
              value={deadline}
              onChange={(e) => setDeadline(Number(e.target.value) as OnlinePtDeadlineHours)}
            >
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={72}>72</option>
            </select>
          </label>
          <label>
            Overdue action
            <select
              value={overdue}
              onChange={(e) => setOverdue(e.target.value as OnlinePtOverdueAction)}
            >
              <option value="refund">refund</option>
              <option value="reassign">reassign</option>
            </select>
          </label>
          <label>
            Follow-up days
            <input
              type="number"
              value={followupDays}
              onChange={(e) => setFollowupDays(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            Follow-up max
            <input
              type="number"
              value={followupMax}
              onChange={(e) => setFollowupMax(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            Min payout
            <input
              type="number"
              value={minPayout}
              onChange={(e) => setMinPayout(Number(e.target.value) || 0)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={approvalRequired}
              onChange={(e) => setApprovalRequired(e.target.checked)}
            />{' '}
            Trainer approval required
          </label>
          <button type="submit" className="btn btn--primary" disabled={savePolicy.isPending}>
            {t('admin.savePolicy')}
          </button>
        </form>
      ) : null}

      {tab === 'trainers' ? (
        trainersQuery.isLoading ? (
          <Skeleton count={3} />
        ) : (
          <div className="opt-trainer-list">
            {(trainersQuery.data?.items ?? []).map((tr) => (
              <div key={tr.userId} className="opt-trainer">
                <div className="opt-trainer__row">
                  <strong>{tr.displayName}</strong>
                  <span>{tr.approvalStatus}</span>
                </div>
                <p className="opt-meta">
                  {tr.ticketPrice.toLocaleString()}원 · {tr.specialties.join(', ')}
                </p>
                <div className="admin-card__actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() =>
                      reviewTrainer.mutate({ id: tr.userId, status: 'approved' })
                    }
                  >
                    {t('admin.approve')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() =>
                      reviewTrainer.mutate({ id: tr.userId, status: 'rejected' })
                    }
                  >
                    {t('admin.reject')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() =>
                      reviewTrainer.mutate({ id: tr.userId, status: 'suspended' })
                    }
                  >
                    {t('admin.suspend')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {tab === 'questions' ? (
        questionsQuery.isLoading ? (
          <Skeleton count={3} />
        ) : (
          <div className="opt-trainer-list">
            {(questionsQuery.data?.items ?? []).map((q) => (
              <Link
                key={q.id}
                className="opt-trainer"
                to={ROUTES.ONLINE_PT_QUESTION.replace(':questionId', q.id)}
              >
                <div className="opt-trainer__row">
                  <strong>{q.title}</strong>
                  <span>{t(`status.${q.status}`)}</span>
                </div>
                <p className="opt-meta">
                  {q.memberName} → {q.trainerName}
                </p>
              </Link>
            ))}
          </div>
        )
      ) : null}

      {tab === 'payouts' ? (
        payoutsQuery.isLoading ? (
          <Skeleton count={3} />
        ) : (
          <div className="opt-trainer-list">
            {(payoutsQuery.data ?? []).map((p) => (
              <div key={p.id} className="opt-trainer">
                <div className="opt-trainer__row">
                  <strong>
                    {p.trainerName} · {p.amount.toLocaleString()}원
                  </strong>
                  <span>{p.status}</span>
                </div>
                <div className="admin-card__actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => reviewPayout.mutate({ id: p.id, status: 'approved' })}
                  >
                    {t('admin.approvePayout')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => reviewPayout.mutate({ id: p.id, status: 'paid' })}
                  >
                    {t('admin.pay')}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => reviewPayout.mutate({ id: p.id, status: 'rejected' })}
                  >
                    {t('admin.rejectPayout')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {tab === 'reviews' ? (
        reviewsQuery.isLoading ? (
          <Skeleton count={3} />
        ) : (
          <div className="opt-trainer-list">
            {(reviewsQuery.data ?? []).map((r) => (
              <div key={r.id} className="opt-trainer">
                <strong>
                  ★ {r.rating} — {r.memberName}
                </strong>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        )
      ) : null}
    </AdminPageShell>
  );
}
