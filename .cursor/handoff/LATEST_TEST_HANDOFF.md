# Test handoff — Unify brand favorites into dense chip picker

## Summary
Brand favorites page is one searchable chip grid (no logos, no separate mine/add sections). Favorites sort to the top; mobile shows 3–4 brands per row.

## Git
- Branch: `main`
- Commit: `f54caff8`

## Changed files
- `frontend/src/pages/brand-favorites/BrandFavoritesPage.tsx`
- `frontend/src/styles/brand-favorites.css`
- `frontend/src/i18n/locales/{ko,en,ja,zh}/common.json`

## Test focus
1. Single list; starred favorites first.
2. No logos/images.
3. Mobile: 3–4 chips per row.
4. Toggle updates count; search filter on machine search still uses favorites.

## Fast checks
```bash
rg -n "brand-favorites__chip|listLabel|resolveBrandLogoUrl" frontend/src/pages/brand-favorites frontend/src/styles/brand-favorites.css frontend/src/i18n/locales/ko/common.json
```

## as-is → to-be
| as-is | to-be |
| --- | --- |
| Mine + Add sections with logo tiles | One dense chip grid, text + star only |

## Deploy
Frontend Pages only.
