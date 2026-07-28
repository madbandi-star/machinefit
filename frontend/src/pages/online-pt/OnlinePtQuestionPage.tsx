import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { onlinePtApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { safeHttpUrl } from '@/utils/safeHttpUrl';
import '@/styles/online-pt.css';

function linesToUrls(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
}

function statusChipClass(status: string): string {
  if (status === 'answered' || status === 'closed') return 'opt-chip opt-chip--ok';
  if (status === 'auto_refunded') return 'opt-chip opt-chip--danger';
  if (status === 'answering' || status === 'followup') return 'opt-chip opt-chip--warn';
  return 'opt-chip opt-chip--muted';
}

export function OnlinePtQuestionPage() {
  const { questionId = '' } = useParams();
  const { t } = useTranslation('online-pt');
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);
  const queryClient = useQueryClient();

  const [answerBody, setAnswerBody] = useState('');
  const [answerMedia, setAnswerMedia] = useState({ photo: '', video: '', audio: '' });
  const [followupBody, setFollowupBody] = useState('');
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');

  const { data: q, isLoading } = useQuery({
    queryKey: QUERY_KEYS.onlinePtQuestion(questionId),
    queryFn: async () => (await onlinePtApi.getQuestion(questionId)).data.data,
    enabled: Boolean(questionId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtQuestion(questionId) });
    queryClient.invalidateQueries({ queryKey: ['online-pt', 'questions'] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.onlinePtWallet });
  };

  const answerMutation = useMutation({
    mutationFn: () =>
      onlinePtApi.answer(questionId, {
        body: answerBody,
        photoUrls: linesToUrls(answerMedia.photo),
        videoUrls: linesToUrls(answerMedia.video),
        audioUrls: linesToUrls(answerMedia.audio),
      }),
    onSuccess: () => {
      showToast(t('answerDone'), 'success');
      setAnswerBody('');
      invalidate();
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  const followupMutation = useMutation({
    mutationFn: () => onlinePtApi.followup(questionId, { body: followupBody }),
    onSuccess: () => {
      setFollowupBody('');
      invalidate();
    },
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  const reviewMutation = useMutation({
    mutationFn: () => onlinePtApi.review(questionId, { rating, body: reviewBody }),
    onSuccess: () => invalidate(),
    onError: (e) => showToast(getApiErrorMessage(e, t('error')), 'error'),
  });

  if (isLoading || !q) {
    return (
      <div className="opt-shell">
        <PageShell>
          <Skeleton count={4} />
        </PageShell>
      </div>
    );
  }

  const isTrainer = Boolean(user?.id && user.id === q.trainerId);

  return (
    <div className="opt-shell">
      <PageShell>
        <div className="opt-thread">
          <header className="opt-thread-hero">
            <p className="opt-hero-kicker">Online PT</p>
            <h1>{q.title}</h1>
            <div className="opt-thread-meta">
              <span className={statusChipClass(q.status)}>{t(`status.${q.status}`)}</span>
              <span className="opt-chip opt-chip--muted">{q.trainerName}</span>
              {q.memberName ? (
                <span className="opt-chip opt-chip--muted">{q.memberName}</span>
              ) : null}
            </div>
            <p className="opt-meta">
              {t('deadline', { time: new Date(q.deadlineAt).toLocaleString() })}
            </p>
          </header>

          <article className="opt-bubble">
            <strong>{q.memberName ?? 'Member'}</strong>
            <p>{q.body}</p>
            {q.photoUrls?.map((u) => {
              const href = safeHttpUrl(u);
              return href ? (
                <a key={u} href={href} target="_blank" rel="noreferrer">
                  {u}
                </a>
              ) : null;
            })}
          </article>

          {(q.followups ?? []).map((f) => (
            <article key={f.id} className="opt-bubble">
              <strong>{t('followup')}</strong>
              <p>{f.body}</p>
            </article>
          ))}

          {(q.answers ?? []).map((a) => (
            <article key={a.id} className="opt-bubble opt-bubble--answer">
              <strong>{q.trainerName}</strong>
              <p>{a.body}</p>
              {[...a.photoUrls, ...a.videoUrls, ...a.audioUrls].map((u) => {
                const href = safeHttpUrl(u);
                return href ? (
                  <a key={u} href={href} target="_blank" rel="noreferrer">
                    {u}
                  </a>
                ) : null;
              })}
            </article>
          ))}

          {q.review ? (
            <article className="opt-bubble">
              <strong>
                ★ {q.review.rating}
              </strong>
              <p>{q.review.body}</p>
            </article>
          ) : null}

          {isTrainer && ['received', 'answering', 'followup'].includes(q.status) ? (
            <form
              className="opt-form"
              onSubmit={(e) => {
                e.preventDefault();
                answerMutation.mutate();
              }}
            >
              <h3>{t('answer')}</h3>
              <textarea
                rows={5}
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                required
                placeholder={t('answerBody')}
              />
              <textarea
                rows={2}
                value={answerMedia.photo}
                onChange={(e) => setAnswerMedia((m) => ({ ...m, photo: e.target.value }))}
                placeholder={t('photos')}
              />
              <textarea
                rows={2}
                value={answerMedia.video}
                onChange={(e) => setAnswerMedia((m) => ({ ...m, video: e.target.value }))}
                placeholder={t('videos')}
              />
              <textarea
                rows={2}
                value={answerMedia.audio}
                onChange={(e) => setAnswerMedia((m) => ({ ...m, audio: e.target.value }))}
                placeholder={t('audio')}
              />
              <button
                type="submit"
                className="opt-btn opt-btn-primary"
                disabled={answerMutation.isPending}
              >
                {t('submitAnswer')}
              </button>
            </form>
          ) : null}

          {q.canFollowup ? (
            <form
              className="opt-form"
              onSubmit={(e) => {
                e.preventDefault();
                followupMutation.mutate();
              }}
            >
              <h3>{t('followup')}</h3>
              <textarea
                rows={3}
                value={followupBody}
                onChange={(e) => setFollowupBody(e.target.value)}
                required
              />
              <button
                type="submit"
                className="opt-btn"
                disabled={followupMutation.isPending}
              >
                {t('submitFollowup')}
              </button>
            </form>
          ) : null}

          {q.canReview ? (
            <form
              className="opt-form"
              onSubmit={(e) => {
                e.preventDefault();
                reviewMutation.mutate();
              }}
            >
              <h3>{t('review')}</h3>
              <label>
                {t('ratingLabel')}
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <textarea
                rows={3}
                value={reviewBody}
                onChange={(e) => setReviewBody(e.target.value)}
                placeholder={t('reviewBody')}
              />
              <button
                type="submit"
                className="opt-btn opt-btn-primary"
                disabled={reviewMutation.isPending}
              >
                {t('submitReview')}
              </button>
            </form>
          ) : null}
        </div>
      </PageShell>
    </div>
  );
}
