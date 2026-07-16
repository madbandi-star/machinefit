import { Link } from 'react-router-dom';
import type { Post } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import '@/styles/community.css';

interface PostCardProps {
  post: Post;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function PostCard({ post }: PostCardProps) {
  const href = ROUTES.POST_DETAIL.replace(':postId', post.id);

  return (
    <Link to={href} className="card post-card">
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
  );
}
