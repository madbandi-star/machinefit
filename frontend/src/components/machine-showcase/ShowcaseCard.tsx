import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MachineShowcasePost } from '@machinefit/shared';
import { ROUTES } from '@/constants/routes';
import { resolveShowcaseMediaUrl } from '@/utils/showcaseMediaUrl';
import { RarityBadge } from './RarityBadge';

export function ShowcaseCard({ post }: { post: MachineShowcasePost }) {
  const { t } = useTranslation('community');
  const gymLabel = post.gymName || post.userGymName;

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
      </div>
      <div className="showcase-card__body">
        <h3 className="showcase-card__title">{post.machineName}</h3>
        {post.brandName ? <p className="showcase-card__brand">🏋️ {post.brandName}</p> : null}
        {gymLabel ? <p className="showcase-card__gym">📍 {gymLabel}</p> : null}
        <p className="showcase-card__meta">
          {t('showcase.gymsRegistered', { count: post.rarity.gymHoldingCount })}
          {' · '}
          {t('showcase.score', { score: post.rarity.score })}
        </p>
        {post.caption ? <p className="showcase-card__caption">{post.caption}</p> : null}
        <div className="showcase-card__stats">
          <span>❤️ {post.likeCount}</span>
          <span>💬 {post.commentCount}</span>
          <span>🔖 {post.bookmarkCount}</span>
        </div>
      </div>
    </Link>
  );
}
