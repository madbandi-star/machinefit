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

function formatDateShort(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'numeric',
    day: 'numeric',
    ...(sameYear ? {} : { year: '2-digit' }),
  });
}

export function PostCard({ post, showDelete, onDelete, isDeleting }: PostCardProps) {
  const { t } = useTranslation('community');
  const href = ROUTES.POST_DETAIL.replace(':postId', post.id);

  return (
    <div className={`board-index-row-wrap${showDelete && onDelete ? ' board-index-row-wrap--admin' : ''}`}>
      <Link to={href} className="board-index-row">
        {post.isPinned ? (
          <span className="board-index-row__pin" aria-label={t('pinnedPost')}>
            📌
          </span>
        ) : null}
        <span className="board-index-row__title">{post.title}</span>
        <span className="board-index-row__meta">
          {post.commentCount != null && post.commentCount > 0 ? (
            <span className="board-index-row__stat">{post.commentCount}</span>
          ) : null}
          <time dateTime={post.createdAt}>{formatDateShort(post.createdAt)}</time>
        </span>
      </Link>
      {showDelete && onDelete ? (
        <button
          type="button"
          className="board-index-row__delete"
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
