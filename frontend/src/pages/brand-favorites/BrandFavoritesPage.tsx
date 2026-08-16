import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { Brand } from '@machinefit/shared';
import { PageShell } from '@/components/layout/PageContainer/PageShell';
import { Skeleton } from '@/components/feedback/Skeleton/Skeleton';
import { FavoriteBrandButton } from '@/components/brands/FavoriteBrandButton/FavoriteBrandButton';
import { brandApi } from '@/api';
import { QUERY_KEYS } from '@/constants/query-keys';
import { useBrandFavorites } from '@/hooks/useBrandFavorites';
import { getLocalizedName } from '@/utils/localizedName';
import { resolveBrandLogoUrl } from '@/utils/catalogAssets';
import '@/styles/brand-favorites.css';

function brandMatchesQuery(brand: Brand, q: string, language: string): boolean {
  if (!q) return true;
  const name = getLocalizedName(brand.name, language, brand.code).toLowerCase();
  const en = brand.name?.en?.toLowerCase() ?? '';
  const code = brand.code.toLowerCase();
  return name.includes(q) || en.includes(q) || code.toLowerCase().includes(q);
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
      .filter((b): b is Brand => Boolean(b))
      .filter((b) => brandMatchesQuery(b, normalizedQuery, i18n.language));
  }, [brands, favorites, normalizedQuery, i18n.language]);

  const allBrandsFiltered = useMemo(() => {
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

  return (
    <PageShell title={t('brandFavorites.title')} subtitle={t('brandFavorites.subtitle')}>
      <div className="brand-favorites">
        <label className="brand-favorites__search">
          <span className="visually-hidden">{t('brandFavorites.searchLabel')}</span>
          <input
            type="search"
            className="brand-favorites__search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('brandFavorites.searchPlaceholder')}
            autoComplete="off"
          />
        </label>

        <section className="brand-favorites__section" aria-labelledby="brand-fav-mine-title">
          <h2 id="brand-fav-mine-title" className="brand-favorites__section-title">
            {t('brandFavorites.mineTitle')}
          </h2>
          {loading ? (
            <Skeleton count={2} height={56} />
          ) : favoriteBrands.length === 0 ? (
            <p className="brand-favorites__empty">{t('brandFavorites.empty')}</p>
          ) : (
            <ul className="brand-favorites__list">
              {favoriteBrands.map((brand) => (
                <BrandFavoriteRow key={brand.id} brand={brand} />
              ))}
            </ul>
          )}
        </section>

        <section className="brand-favorites__section" aria-labelledby="brand-fav-all-title">
          <h2 id="brand-fav-all-title" className="brand-favorites__section-title">
            {t('brandFavorites.allTitle')}
          </h2>
          {loading ? (
            <Skeleton count={6} height={56} />
          ) : allBrandsFiltered.length === 0 ? (
            <p className="brand-favorites__empty">{t('brandFavorites.noSearchResults')}</p>
          ) : (
            <ul className="brand-favorites__list">
              {allBrandsFiltered.map((brand) => (
                <BrandFavoriteRow key={brand.id} brand={brand} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function BrandFavoriteRow({ brand }: { brand: Brand }) {
  const { i18n } = useTranslation();
  const name = getLocalizedName(brand.name, i18n.language, brand.code);
  const logoUrl = resolveBrandLogoUrl(brand.code, brand.logoUrl);

  return (
    <li className="brand-favorites__row">
      <div className="brand-favorites__row-main">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="brand-favorites__logo" loading="lazy" />
        ) : (
          <span className="brand-favorites__logo-fallback" aria-hidden>
            {name.slice(0, 1)}
          </span>
        )}
        <div className="brand-favorites__meta">
          <p className="brand-favorites__name">{name}</p>
          <p className="brand-favorites__code">{brand.code}</p>
        </div>
      </div>
      <FavoriteBrandButton brandId={brand.id} />
    </li>
  );
}
