import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Post } from '@machinefit/shared';
import { Icon } from '@/components/icons/Icon';
import { ROUTES } from '@/constants/routes';
import '@/styles/community.css';

interface PostCardProps {
  post: Post;
  /** Classic board sequence number (newest = highest). */
  seq?: number;
  showDelete?: boolean;
  onDelete?: (postId: string) => void;
  isDeleting?: boolean;
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function authorLabel(post: Post) {
  const name = post.authorName?.trim();
  if (name) return name;
  if (post.userId) return post.userId.slice(0, 8);
  return '—';
}

export function PostCard({ post, seq, showDelete, onDelete, isDeleting }: PostCardProps) {
  const { t } = useTranslation('community');
  const href = ROUTES.POST_DETAIL.replace(':postId', post.id);
  const likes = post.likeCount ?? 0;
  const comments = post.commentCount ?? 0;

  return (
    <div className={`board-index-row-wrap${showDelete && onDelete ? ' board-index-row-wrap--admin' : ''}`}>
      <Link to={href} className="board-index-row board-index-row--post">
        {seq != null ? (
          <span className="board-index-row__seq" aria-label={t('postSeq', { seq })}>
            {seq}
          </span>
        ) : null}
        {post.isPinned ? (
          <span className="board-index-row__pin" aria-label={t('pinnedPost')}>
            📌
          </span>
        ) : null}
        <span className="board-index-row__title">{post.title}</span>
        <span className="board-index-row__meta board-index-row__meta--post">
          <span className="board-index-row__author" title={authorLabel(post)}>
            {authorLabel(post)}
          </span>
          <span className="board-index-row__counts" aria-label={`${t('likeCount', { count: likes })}, ${t('commentCount', { count: comments })}`}>
            <span className="board-index-row__stat board-index-row__stat--like" title={t('colLikes')}>
              <Icon name="heart" size={12} className="board-index-row__stat-icon" aria-hidden />
              <span className="board-index-row__stat-num">{likes}</span>
            </span>
            <span className="board-index-row__stat board-index-row__stat--comment" title={t('colComments')}>
              <Icon name="message" size={12} className="board-index-row__stat-icon" aria-hidden />
              <span className="board-index-row__stat-num">{comments}</span>
            </span>
          </span>
          <time className="board-index-row__date" dateTime={post.createdAt}>
            {formatDate(post.createdAt)}
          </time>
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
