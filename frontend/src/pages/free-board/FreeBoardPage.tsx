import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const showToast = useUIStore((s) => s.showToast);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

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
    <PageShell
      title={t('freeBoard')}
      subtitle={t('freeBoardSubtitle')}
      action={
        <button className="btn btn--primary" onClick={handleNewPost}>
          {t('newPost')}
        </button>
      }
    >
      {showForm && (
        <form className="card" style={{ marginBottom: '1rem' }} onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="post-title">{t('postTitle')}</label>
            <input
              id="post-title"
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
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.items.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--color-text-muted)' }}>{t('noPosts')}</p>
      )}

      <Link to={ROUTES.COMMUNITY} className="btn btn--secondary btn--block" style={{ marginTop: '1rem' }}>
        ← {t('title')}
      </Link>
    </PageShell>
  );
}
