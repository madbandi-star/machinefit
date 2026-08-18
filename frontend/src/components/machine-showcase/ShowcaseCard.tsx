import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MachineShowcasePost } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import { resolveShowcaseMediaUrl } from '@/utils/showcaseMediaUrl';
import { RarityBadge } from './RarityBadge';

export function ShowcaseCard({ post }: { post: MachineShowcasePost }) {
  const { t } = useTranslation('community');
  const gymLabel = post.gymName || post.userGymName;
  const imageCount = post.images?.length ?? (post.coverImage ? 1 : 0);

  return (
    <Link
      to={ROUTES.MACHINE_SHOWCASE_DETAIL.replace(':postId', post.id)}
      className={`showcase-card showcase-card--${post.rarity.grade.toLowerCase()}`}
    >
      <div className="showcase-card__media">
        {post.coverImage ? (
          <img
            className="showcase-card__img"
            src={resolveShowcaseMediaUrl(post.coverImage.thumbUrl)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="showcase-card__placeholder" aria-hidden />
        )}
        <RarityBadge grade={post.rarity.grade} compact />
        {imageCount > 1 ? (
          <span className="showcase-card__count">{imageCount}</span>
        ) : null}
      </div>
      <div className="showcase-card__body">
        <h3 className="showcase-card__title">{post.machineName}</h3>
        <div className="showcase-card__row">
          <span className="showcase-card__place">{gymLabel || post.brandName || '—'}</span>
          <span className="showcase-card__stats" aria-label={t('showcase.comments', { count: post.commentCount })}>
            <span>♥ {post.likeCount}</span>
            <span>💬 {post.commentCount}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
