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
import '@/styles/brand-favorites.css';

function brandMatchesQuery(brand: Brand, q: string, language: string): boolean {
  if (!q) return true;
  const name = getLocalizedName(brand.name, language, brand.code).toLowerCase();
  const en = brand.name?.en?.trim().toLowerCase() ?? '';
  const code = brand.code.toLowerCase();
  return name.includes(q) || en.includes(q) || code.includes(q);
}

function brandChipLabel(brand: Brand, language: string): string {
  const localized = getLocalizedName(brand.name, language, brand.code);
  const en = brand.name?.en?.trim();
  // Prefer short English wordmarks for density (matches search brand chips).
  if (en && en.length <= localized.length + 4) return en;
  return localized;
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

  const catalogBrands = useMemo(() => {
    return [...brands]
      .filter((b) => brandMatchesQuery(b, normalizedQuery, i18n.language))
      .sort((a, b) => {
        const aFav = favoriteIds.has(a.id) ? 0 : 1;
        const bFav = favoriteIds.has(b.id) ? 0 : 1;
        if (aFav !== bFav) return aFav - bFav;
        return brandChipLabel(a, i18n.language).localeCompare(
          brandChipLabel(b, i18n.language),
          i18n.language
        );
      });
  }, [brands, favoriteIds, normalizedQuery, i18n.language]);

  const loading = brandsLoading || favoritesLoading;
  const favoriteCount = favoriteIds.size;

  return (
    <PageShell title={t('brandFavorites.title')} subtitle={t('brandFavorites.subtitle')}>
      <div className="brand-favorites">
        <div className="brand-favorites__toolbar">
          <label className="brand-favorites__search">
            <Search className="brand-favorites__search-icon" size={17} aria-hidden />
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
          <p className="brand-favorites__count" aria-live="polite">
            <Star size={13} strokeWidth={2.25} fill="currentColor" aria-hidden />
            <span>{t('brandFavorites.summaryCount', { count: favoriteCount })}</span>
          </p>
        </div>

        <section className="brand-favorites__list-wrap" aria-label={t('brandFavorites.listLabel')}>
          {loading ? (
            <div className="brand-favorites__chip-grid brand-favorites__chip-grid--skeleton" aria-hidden>
              {Array.from({ length: 18 }).map((_, i) => (
                <Skeleton key={i} height={34} />
              ))}
            </div>
          ) : catalogBrands.length === 0 ? (
            <p className="brand-favorites__empty">{t('brandFavorites.noSearchResults')}</p>
          ) : (
            <ul className="brand-favorites__chip-grid">
              {catalogBrands.map((brand) => (
                <BrandFavoriteChip key={brand.id} brand={brand} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function BrandFavoriteChip({ brand }: { brand: Brand }) {
  const { i18n, t } = useTranslation('common');
  const name = brandChipLabel(brand, i18n.language);
  const fullName = getLocalizedName(brand.name, i18n.language, brand.code);
  const { isFavorited, toggle, isPending, canToggle } = useBrandFavoriteToggle(brand.id);

  return (
    <li>
      <button
        type="button"
        className={`brand-favorites__chip${isFavorited ? ' brand-favorites__chip--on' : ''}`}
        onClick={toggle}
        disabled={!canToggle || isPending}
        aria-pressed={isFavorited}
        title={fullName}
        aria-label={
          isFavorited
            ? t('brandFavorites.removeNamed', { name: fullName })
            : t('brandFavorites.addNamed', { name: fullName })
        }
      >
        <Star
          className="brand-favorites__chip-star"
          size={12}
          strokeWidth={2.4}
          fill={isFavorited ? 'currentColor' : 'none'}
          aria-hidden
        />
        <span className="brand-favorites__chip-name">{name}</span>
      </button>
    </li>
  );
}
