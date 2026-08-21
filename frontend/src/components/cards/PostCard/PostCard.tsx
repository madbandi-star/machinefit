import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Post } from '@machinefit/shared';
import { AuthorWithRole } from '@/components/common/AuthorWithRole';
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
  const views = post.viewCount ?? 0;

  return (
    <div className={`board-post-card-wrap${showDelete && onDelete ? ' board-post-card-wrap--admin' : ''}`}>
      <Link
        to={href}
        className={`board-post-card${post.isPinned ? ' is-pinned' : ''}`}
      >
        <div className="board-post-card__head">
          {seq != null ? (
            <span className="board-post-card__seq" aria-label={t('postSeq', { seq })}>
              {seq}
            </span>
          ) : null}
          {post.isPinned ? (
            <span className="board-post-card__pin" aria-label={t('pinnedPost')}>
              {t('pinnedPost')}
            </span>
          ) : null}
          <h3 className="board-post-card__title">{post.title}</h3>
        </div>
        <div className="board-post-card__meta">
          <AuthorWithRole
            className="board-post-card__author"
            name={authorLabel(post)}
            roleCode={post.authorRoleCode}
          />
          <time className="board-post-card__date" dateTime={post.createdAt}>
            {formatDate(post.createdAt)}
          </time>
          <span
            className="board-post-card__stats"
            aria-label={`${t('likeCount', { count: likes })}, ${t('commentCount', { count: comments })}, ${t('viewsCount', { count: views })}`}
          >
            <span className="board-post-card__stat" title={t('colLikes')}>
              <Icon name="heart" size={13} aria-hidden />
              {likes}
            </span>
            <span className="board-post-card__stat" title={t('colComments')}>
              <Icon name="message" size={13} aria-hidden />
              {comments}
            </span>
            <span className="board-post-card__stat" title={t('viewsCount', { count: views })}>
              <Icon name="monitor" size={13} aria-hidden />
              {views}
            </span>
          </span>
        </div>
      </Link>
      {showDelete && onDelete ? (
        <button
          type="button"
          className="board-post-card__delete"
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
