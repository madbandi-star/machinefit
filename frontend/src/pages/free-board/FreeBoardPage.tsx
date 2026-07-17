import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { PostCard } from '@/components/cards/PostCard/PostCard';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { communityApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import '@/styles/components.css';
import '@/styles/community.css';

export function FreeBoardPage() {
  const { t } = useTranslation('community');
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.roleCode === 'admin';
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
      communityApi.createPost({ boardType: 'free', title, content }),
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
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    createMutation.mutate();
  };

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
        {showForm && (
          <form className="card community-board-page__form" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="post-title">{t('postTitle')}</label>
              <input
                id="post-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div className="form-row">
              <label htmlFor="post-content">{t('postContent')}</label>
              <textarea
                id="post-content"
                className="input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <div className="community-board-page__form-actions">
              <button type="submit" className="btn btn--primary" disabled={createMutation.isPending}>
                {t('submit')}
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>
                {t('cancel')}
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <Skeleton count={3} />
        ) : data?.items.length ? (
          <div className="community-board-page__list">
            {data.items.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                showDelete={isAdmin}
                onDelete={handleDeletePost}
                isDeleting={deletingPostId === post.id && deleteMutation.isPending}
              />
            ))}
          </div>
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
