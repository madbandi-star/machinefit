import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { PostCard } from '@/components/cards/PostCard/PostCard';
import { BoardIndexPanel } from '@/components/community/BoardIndexPanel';
import { BoardIndexSkeleton } from '@/components/community/BoardIndexSkeleton';
import { communityApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/community.css';

const TITLE_MAX = 200;
const CONTENT_MAX = 5000;

export function FreeBoardPage() {
  const { t } = useTranslation('community');
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isAdmin = hasMinRole(user?.roleCode, Role.ADMIN);
  const showToast = useUIStore((s) => s.showToast);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.posts, 'free'],
    queryFn: async () => {
      const res = await communityApi.listPosts({ boardType: 'free', limit: 30 });
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      communityApi.createPost({ boardType: 'free', title: title.trim(), content: content.trim() }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
      setShowForm(false);
      setTitle('');
      setContent('');
      showToast(t('createSuccess'), 'success');
      navigate(ROUTES.POST_DETAIL.replace(':postId', res.data.data.id));
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => communityApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.posts });
      showToast(t('deleteSuccess'), 'success');
    },
    onError: () => showToast(t('errorGeneric'), 'error'),
    onSettled: () => setDeletingPostId(null),
  });

  const canSubmit = useMemo(
    () => Boolean(title.trim() && content.trim()) && !createMutation.isPending,
    [title, content, createMutation.isPending]
  );

  const handleDeletePost = (postId: string) => {
    if (!window.confirm(t('confirmDelete'))) return;
    setDeletingPostId(postId);
    deleteMutation.mutate(postId);
  };

  const handleNewPost = () => {
    if (!isAuthenticated) {
      showToast(t('loginRequired'), 'error');
      navigate(ROUTES.LOGIN);
      return;
    }
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelWrite = () => {
    setShowForm(false);
    setTitle('');
    setContent('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    createMutation.mutate();
  };

  if (showForm) {
    const titleReady = Boolean(title.trim());
    const contentReady = Boolean(content.trim());
    const checklist = [
      { id: 'title', label: t('freeStepTitle'), done: titleReady },
      { id: 'content', label: t('freeStepContent'), done: contentReady },
    ];
    const checklistDone = checklist.filter((item) => item.done).length;

    return (
      <div className="community-board-page board-write-page board-write-page--free">
        <PageShell title={t('newPost')} subtitle={t('freeWriteHint')}>
          <div className="board-write-checklist" aria-label={t('freeChecklistLabel')}>
            <div className="board-write-checklist__head">
              <p className="board-write-checklist__title">{t('freeChecklistLabel')}</p>
              <span className="board-write-checklist__progress">
                {checklistDone}/{checklist.length}
              </span>
            </div>
            <ul className="board-write-checklist__list board-write-checklist__list--free">
              {checklist.map((item) => (
                <li
                  key={item.id}
                  className={[
                    'board-write-checklist__item',
                    item.done ? 'is-done' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <span className="board-write-checklist__mark" aria-hidden>
                    {item.done ? '✓' : '·'}
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <form className="board-write board-write--free" onSubmit={handleSubmit}>
            <section
              className={[
                'board-write__section',
                titleReady ? 'is-ready' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-labelledby="free-step-title"
            >
              <header className="board-write__section-head">
                <span className="board-write__step">1</span>
                <div>
                  <h3 id="free-step-title" className="board-write__section-title">
                    {t('freeStepTitle')}
                  </h3>
                  <p className="board-write__section-hint">{t('freeStepTitleHint')}</p>
                </div>
                <span className="board-write__section-status">
                  {title.length}/{TITLE_MAX}
                </span>
              </header>
              <input
                id="post-title"
                className="input board-write__title"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                maxLength={TITLE_MAX}
                required
                placeholder={t('postTitlePlaceholder')}
                autoFocus
              />
            </section>

            <section
              className={[
                'board-write__section',
                contentReady ? 'is-ready' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-labelledby="free-step-content"
            >
              <header className="board-write__section-head">
                <span className="board-write__step">2</span>
                <div>
                  <h3 id="free-step-content" className="board-write__section-title">
                    {t('freeStepContent')}
                  </h3>
                  <p className="board-write__section-hint">{t('freeStepContentHint')}</p>
                </div>
                <span className="board-write__section-status">
                  {content.length}/{CONTENT_MAX}
                </span>
              </header>
              <textarea
                id="post-content"
                className="input board-write__textarea board-write__textarea--free"
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
                maxLength={CONTENT_MAX}
                required
                rows={8}
                placeholder={t('postContentPlaceholder')}
              />
            </section>

            <div className="board-write__actions">
              <button
                type="submit"
                className="btn btn--primary board-write__submit"
                disabled={!canSubmit}
              >
                {createMutation.isPending ? '…' : t('submit')}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleCancelWrite}
                disabled={createMutation.isPending}
              >
                {t('cancel')}
              </button>
            </div>
          </form>
        </PageShell>
      </div>
    );
  }

  return (
    <div className="community-board-page">
      <PageShell
        title={t('freeBoard')}
        subtitle={t('freeBoardSubtitle')}
        action={
          <div className="page-shell__header-action">
            <button type="button" className="btn btn--primary" onClick={handleNewPost}>
              {t('newPost')}
            </button>
          </div>
        }
      >
        {isLoading ? (
          <BoardIndexSkeleton rows={8} />
        ) : data?.items.length ? (
          <BoardIndexPanel
            countLabel={t('postCount', { count: data.meta?.total ?? data.items.length })}
            columnHeader={
              <div className="board-index-row board-index-row--cols board-index-row--post" aria-hidden>
                <span className="board-index-row__seq">{t('colSeq')}</span>
                <span className="board-index-row__title">{t('colTitle')}</span>
                <span className="board-index-row__meta board-index-row__meta--post">
                  <span className="board-index-row__author">{t('colAuthor')}</span>
                  <span className="board-index-row__counts board-index-row__counts--header">
                    <span className="board-index-row__stat board-index-row__stat--like board-index-row__stat--header">
                      {t('colLikes')}
                    </span>
                    <span className="board-index-row__stat board-index-row__stat--comment board-index-row__stat--header">
                      {t('colComments')}
                    </span>
                  </span>
                  <span className="board-index-row__date">{t('colDate')}</span>
                </span>
              </div>
            }
          >
            {data.items.map((post, index) => {
              const total = data.meta?.total ?? data.items.length;
              const page = data.meta?.page ?? 1;
              const limit = data.meta?.limit ?? data.items.length;
              const seq = total - ((page - 1) * limit + index);
              return (
                <PostCard
                  key={post.id}
                  post={post}
                  seq={seq}
                  showDelete={isAdmin}
                  onDelete={handleDeletePost}
                  isDeleting={deletingPostId === post.id && deleteMutation.isPending}
                />
              );
            })}
          </BoardIndexPanel>
        ) : (
          <p className="community-board-page__empty">{t('noPosts')}</p>
        )}

        <Link to={ROUTES.MY_PAGE} className="btn btn--secondary btn--block community-board-page__back">
          ← {tCommon('nav.myPage')}
        </Link>
      </PageShell>
    </div>
  );
}
