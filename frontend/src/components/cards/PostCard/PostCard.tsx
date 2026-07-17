import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Post } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import '@/styles/community.css';

interface PostCardProps {
  post: Post;
  showDelete?: boolean;
  onDelete?: (postId: string) => void;
  isDeleting?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PostCard({ post, showDelete, onDelete, isDeleting }: PostCardProps) {
  const { t } = useTranslation('community');
  const href = ROUTES.POST_DETAIL.replace(':postId', post.id);

  return (
    <div className={`post-card-wrap${showDelete && onDelete ? ' post-card-wrap--with-delete' : ''}`}>
      <Link to={href} className="card card--interactive post-card">
        <h3 className="post-card__title">{post.title}</h3>
        <p className="post-card__excerpt">
          {post.content.length > 120 ? `${post.content.slice(0, 120)}…` : post.content}
        </p>
        <div className="post-card__meta">
          <span>{post.authorName ?? 'Anonymous'}</span>
          <span>{formatDate(post.createdAt)}</span>
          <span>👁 {post.viewCount}</span>
          {post.likeCount != null && <span>♥ {post.likeCount}</span>}
          {post.commentCount != null && <span>💬 {post.commentCount}</span>}
        </div>
      </Link>
      {showDelete && onDelete ? (
        <button
          type="button"
          className="post-card__delete"
          disabled={isDeleting}
          aria-label={t('deletePost')}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onDelete(post.id);
          }}
        >
          ×
        </button>
      ) : null}
    </div>
  );
}
