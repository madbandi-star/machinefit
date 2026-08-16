import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Star } from 'lucide-react';
import type { Brand } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { brandApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useBrandFavorites, useBrandFavoriteToggle } from '@/hooks/useBrandFavorites';
import { getLocalizedName } from '@/utils/localizedName';
import { resolveBrandLogoUrl } from '@/utils/catalogAssets';
import '@/styles/brand-favorites.css';

function brandMatchesQuery(brand: Brand, q: string, language: string): boolean {
  if (!q) return true;
  const name = getLocalizedName(brand.name, language, brand.code).toLowerCase();
  const en = brand.name?.en?.toLowerCase() ?? '';
  const code = brand.code.toLowerCase();
  return name.includes(q) || en.includes(q) || code.includes(q);
}

export function BrandFavoritesPage() {
  const { t, i18n } = useTranslation('common');
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLowerCase();

  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: QUERY_KEYS.brands,
    queryFn: async () => {
      const res = await brandApi.list();
      return res.data.data;
    },
    staleTime: 10 * 60_000,
  });

  const { data: favorites = [], isLoading: favoritesLoading } = useBrandFavorites();
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.brandId)), [favorites]);

  const favoriteBrands = useMemo(() => {
    const byId = new Map(brands.map((b) => [b.id, b]));
    return favorites
      .map((f) => byId.get(f.brandId))
      .filter((b): b is Brand => Boolean(b));
  }, [brands, favorites]);

  const catalogBrands = useMemo(() => {
    return [...brands]
      .filter((b) => brandMatchesQuery(b, normalizedQuery, i18n.language))
      .sort((a, b) => {
        const aFav = favoriteIds.has(a.id) ? 0 : 1;
        const bFav = favoriteIds.has(b.id) ? 0 : 1;
        if (aFav !== bFav) return aFav - bFav;
        const an = getLocalizedName(a.name, i18n.language, a.code);
        const bn = getLocalizedName(b.name, i18n.language, b.code);
        return an.localeCompare(bn, i18n.language);
      });
  }, [brands, favoriteIds, normalizedQuery, i18n.language]);

  const loading = brandsLoading || favoritesLoading;
  const favoriteCount = favoriteBrands.length;

  return (
    <PageShell title={t('brandFavorites.title')} subtitle={t('brandFavorites.subtitle')}>
      <div className="brand-favorites">
        <div className="brand-favorites__summary" aria-live="polite">
          <span className="brand-favorites__summary-star" aria-hidden>
            <Star size={16} strokeWidth={2.25} fill="currentColor" />
          </span>
          <p className="brand-favorites__summary-text">
            {t('brandFavorites.summaryCount', { count: favoriteCount })}
          </p>
        </div>

        <section className="brand-favorites__section" aria-labelledby="brand-fav-mine-title">
          <div className="brand-favorites__section-head">
            <h2 id="brand-fav-mine-title" className="brand-favorites__section-title">
              {t('brandFavorites.mineTitle')}
            </h2>
            {!loading && favoriteCount > 0 ? (
              <span className="brand-favorites__badge">{favoriteCount}</span>
            ) : null}
          </div>

          {loading ? (
            <div className="brand-favorites__mine-grid" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={92} />
              ))}
            </div>
          ) : favoriteBrands.length === 0 ? (
            <div className="brand-favorites__empty-panel">
              <p className="brand-favorites__empty-title">{t('brandFavorites.empty')}</p>
              <p className="brand-favorites__empty-hint">{t('brandFavorites.emptyHint')}</p>
            </div>
          ) : (
            <ul className="brand-favorites__mine-grid">
              {favoriteBrands.map((brand) => (
                <BrandFavoriteTile key={brand.id} brand={brand} variant="mine" />
              ))}
            </ul>
          )}
        </section>

        <section className="brand-favorites__section" aria-labelledby="brand-fav-all-title">
          <div className="brand-favorites__section-head">
            <h2 id="brand-fav-all-title" className="brand-favorites__section-title">
              {t('brandFavorites.allTitle')}
            </h2>
          </div>

          <label className="brand-favorites__search">
            <Search className="brand-favorites__search-icon" size={18} aria-hidden />
            <span className="visually-hidden">{t('brandFavorites.searchLabel')}</span>
            <input
              type="search"
              className="brand-favorites__search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('brandFavorites.searchPlaceholder')}
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>

          {loading ? (
            <div className="brand-favorites__catalog-grid" aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} height={76} />
              ))}
            </div>
          ) : catalogBrands.length === 0 ? (
            <p className="brand-favorites__empty">{t('brandFavorites.noSearchResults')}</p>
          ) : (
            <ul className="brand-favorites__catalog-grid">
              {catalogBrands.map((brand) => (
                <BrandFavoriteTile key={brand.id} brand={brand} variant="catalog" />
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function BrandFavoriteTile({
  brand,
  variant,
}: {
  brand: Brand;
  variant: 'mine' | 'catalog';
}) {
  const { i18n, t } = useTranslation('common');
  const name = getLocalizedName(brand.name, i18n.language, brand.code);
  const logoUrl = resolveBrandLogoUrl(brand.code, brand.logoUrl);
  const { isFavorited, toggle, isPending, canToggle } = useBrandFavoriteToggle(brand.id);

  return (
    <li>
      <button
        type="button"
        className={`brand-favorites__tile brand-favorites__tile--${variant}${
          isFavorited ? ' brand-favorites__tile--on' : ''
        }`}
        onClick={toggle}
        disabled={!canToggle || isPending}
        aria-pressed={isFavorited}
        aria-label={
          isFavorited
            ? t('brandFavorites.removeNamed', { name })
            : t('brandFavorites.addNamed', { name })
        }
      >
        <span className="brand-favorites__tile-star" aria-hidden>
          <Star
            size={variant === 'mine' ? 14 : 15}
            strokeWidth={2.25}
            fill={isFavorited ? 'currentColor' : 'none'}
          />
        </span>
        {logoUrl ? (
          <img src={logoUrl} alt="" className="brand-favorites__tile-logo" loading="lazy" />
        ) : (
          <span className="brand-favorites__tile-fallback" aria-hidden>
            {name.slice(0, 1)}
          </span>
        )}
        <span className="brand-favorites__tile-name">{name}</span>
      </button>
    </li>
  );
}
