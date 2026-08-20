import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Role, hasMinRole } from '@machinefit/shared';
import { RarityBadge } from '@/components/machine-showcase/RarityBadge';
import { machineShowcaseApi } from '@/api/machine-showcase.api';
import { useAuthStore } from '@/store/auth.store';
import { QUERY_KEYS } from '@/constants/query-keys';
import { ROUTES } from '@/constants/routes';
import { resolveShowcaseMediaUrl } from '@/utils/showcaseMediaUrl';
import '@/styles/machine-showcase.css';

const PREVIEW_LIMIT = 6;

export function MachineShowcaseLinks({ machineCode }: { machineCode: string }) {
  const { t } = useTranslation('community');
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const roleCode = useAuthStore((s) => s.user?.roleCode);
  /** Hidden for plain `member`; visible for premium_member and above. */
  const showShowcase = isAuthenticated && hasMinRole(roleCode, Role.PREMIUM_MEMBER);
  const postsQuery = useQuery({
    queryKey: QUERY_KEYS.machineShowcase({ machineCode, tab: 'latest', limit: PREVIEW_LIMIT }),
    queryFn: async () =>
      (await machineShowcaseApi.list({ machineCode, tab: 'latest', limit: PREVIEW_LIMIT })).data
        .data,
    enabled: showShowcase,
    staleTime: 60_000,
  });
  const gymsQuery = useQuery({
    queryKey: QUERY_KEYS.machineShowcaseGyms(machineCode),
    queryFn: async () => (await machineShowcaseApi.machineGyms(machineCode)).data.data,
    enabled: showShowcase,
    staleTime: 60_000,
  });

  if (!showShowcase) return null;

  const posts = postsQuery.data?.items ?? [];
  const postCount = postsQuery.data?.meta.total ?? 0;
  const gymCount = gymsQuery.data?.totalGyms ?? 0;
  const rarity = gymsQuery.data?.rarity;
  const regions = (gymsQuery.data?.byRegion ?? []).slice(0, 3);
  const extraRegions = Math.max(0, (gymsQuery.data?.byRegion.length ?? 0) - regions.length);
  const listTo = `${ROUTES.MACHINE_SHOWCASE}?tab=latest&machineCode=${encodeURIComponent(machineCode)}`;
  const writeTo = `${ROUTES.MACHINE_SHOWCASE_WRITE}?machineCode=${encodeURIComponent(machineCode)}`;
  const isLoading = postsQuery.isLoading || gymsQuery.isLoading;

  return (
    <section className="showcase-glance" aria-labelledby="showcase-glance-title">
      <header className="showcase-glance__head">
        <Link id="showcase-glance-title" className="showcase-glance__title" to={listTo}>
          {t('showcase.title')}
        </Link>
        <Link className="showcase-glance__cta" to={writeTo}>
          {t('showcase.writeCtaShort')}
        </Link>
      </header>

      {isLoading ? (
        <div className="showcase-glance__meta showcase-glance__meta--skel" aria-hidden>
          <span className="showcase-glance__chip-skel" />
          <span className="showcase-glance__chip-skel" />
          <span className="showcase-glance__chip-skel" />
        </div>
      ) : (
        <div className="showcase-glance__meta">
          {rarity ? <RarityBadge grade={rarity.grade} compact /> : null}
          <Link className="showcase-glance__chip" to={listTo}>
            {t('showcase.postsStat', { count: postCount })}
          </Link>
          <span className="showcase-glance__chip showcase-glance__chip--muted">
            {t('showcase.gymsStat', { count: gymCount })}
          </span>
          {regions.map((r: { region: string; count: number }) => (
            <span key={r.region} className="showcase-glance__chip showcase-glance__chip--muted">
              {r.region} {r.count}
            </span>
          ))}
          {extraRegions > 0 ? (
            <span className="showcase-glance__chip showcase-glance__chip--muted">+{extraRegions}</span>
          ) : null}
        </div>
      )}

      {isLoading ? (
        <div className="showcase-glance__thumbs" aria-hidden>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="showcase-glance__thumb showcase-glance__thumb--skel" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="showcase-glance__thumbs" role="list">
          {posts.map((post) => (
            <Link
              key={post.id}
              role="listitem"
              className="showcase-glance__thumb"
              to={ROUTES.MACHINE_SHOWCASE_DETAIL.replace(':postId', post.id)}
              aria-label={post.gymName || post.userGymName || post.machineName}
            >
              {post.coverImage ? (
                <img
                  src={resolveShowcaseMediaUrl(post.coverImage.thumbUrl)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <span className="showcase-glance__thumb-empty" aria-hidden />
              )}
            </Link>
          ))}
          {postCount > posts.length ? (
            <Link className="showcase-glance__more" to={listTo}>
              +{postCount - posts.length}
            </Link>
          ) : null}
        </div>
      ) : (
        <p className="showcase-glance__empty">{t('showcase.glanceEmpty')}</p>
      )}
    </section>
  );
}
